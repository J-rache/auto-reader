// licenseClient.js - simple client to interact with local license server
import axios from 'axios';

const SERVER = process.env.LICENSE_SERVER_URL || 'http://localhost:4002';

export async function generateClientKeyIfNeeded() {
  // generate an RSA keypair and store private in electron-store (unencrypted by default)
  const existing = await window.electronAPI.storeGet('client_pubkey');
  if (existing) return existing;
  // generate RSA key pair using Web Crypto
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' },
    true,
    ['sign','verify']
  );
  const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const pubB64 = arrayBufferToBase64(spki);
  const privB64 = arrayBufferToBase64(pkcs8);
  await window.electronAPI.storeSet('client_pubkey', pubB64);
  await window.electronAPI.storeSet('client_privkey', privB64);
  return pubB64;
}

// --- encryption helpers for private key (passphrase-based) ---
async function deriveKeyFromPassphrase(pass, saltB64) {
  const enc = new TextEncoder();
  const passKey = await window.crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  const salt = saltB64 ? base64ToArrayBuffer(saltB64) : window.crypto.getRandomValues(new Uint8Array(16));
  const derived = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt','decrypt']
  );
  return { derivedKey: derived, salt };
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function encryptPrivateKeyWithPassphrase(pass) {
  const privB64 = await window.electronAPI.storeGet('client_privkey');
  if (!privB64) throw new Error('No private key to encrypt');
  const { derivedKey, salt } = await deriveKeyFromPassphrase(pass);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = base64ToArrayBuffer(privB64);
  const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, plaintext);
  const payload = { salt: arrayBufferToBase64(salt), iv: arrayBufferToBase64(iv), ct: arrayBufferToBase64(ct) };
  await window.electronAPI.storeSet('client_privkey_enc', JSON.stringify(payload));
  await window.electronAPI.storeDelete('client_privkey');
  return true;
}

export async function decryptPrivateKeyWithPassphrase(pass) {
  const enc = await window.electronAPI.storeGet('client_privkey_enc');
  if (!enc) throw new Error('No encrypted private key stored');
  const obj = JSON.parse(enc);
  const { derivedKey } = await deriveKeyFromPassphrase(pass, obj.salt);
  const iv = base64ToArrayBuffer(obj.iv);
  const ct = base64ToArrayBuffer(obj.ct);
  const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, derivedKey, ct);
  const privB64 = arrayBufferToBase64(plain);
  // temporarily store decrypted private key in store for use
  await window.electronAPI.storeSet('client_privkey', privB64);
  return privB64;
}

export async function redeemVoucher(voucher) {
  const pub = await generateClientKeyIfNeeded();
  const res = await axios.post(`${SERVER}/redeem`, { voucher, client_pubkey: pub });
  // verify token signature if server public key available
  const { activationId, token, expires_at } = res.data;
  const pubPem = await window.electronAPI.fetchLicenseServerPublicKey(SERVER);
  if (pubPem) {
    const ok = await verifyJwtRS256(token, pubPem);
    if (!ok) throw new Error('Token signature verification failed');
  }
  await window.electronAPI.storeSet('activation', { activationId, token, expires_at });
  return res.data;
}

// minimal RS256 Verify using WebCrypto and SPKI/PEM public key
async function verifyJwtRS256(token, pubPem) {
  try {
    // strip PEM header if present
    let pem = pubPem.trim();
    pem = pem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s+/g, '');
    const spki = base64ToArrayBuffer(pem);
    const key = await window.crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const headerPayload = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const sig = base64UrlToUint8Array(parts[2]);
    const verified = await window.crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, headerPayload);
    return verified;
  } catch (err) {
    console.warn('verifyJwtRS256 error', err);
    return false;
  }
}

function base64UrlToUint8Array(b64url) {
  // replace URL-safe chars
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // pad
  while (b64.length % 4) b64 += '=';
  return new Uint8Array(Array.from(atob(b64)).map(c => c.charCodeAt(0)));
}

export async function getActivationStatus() {
  const act = await window.electronAPI.storeGet('activation');
  if (!act) return null;
  try {
    const res = await axios.get(`${SERVER}/status`, { params: { activationId: act.activationId } });
    return res.data;
  } catch (err) {
    console.warn('getActivationStatus error', err?.response?.data || err.message);
    return null;
  }
}

export async function deactivateActivation() {
  const act = await window.electronAPI.storeGet('activation');
  if (!act) return null;
  await axios.post(`${SERVER}/deactivate`, { activationId: act.activationId });
  await window.electronAPI.storeDelete('activation');
  return true;
}
