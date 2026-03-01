const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB = path.join(__dirname, 'licenses.json');
// simple JSON DB for prototype
let db = { vouchers: {}, activations: {} };
if (fs.existsSync(DB)) db = JSON.parse(fs.readFileSync(DB));

const PRIVATE_KEY = fs.existsSync(path.join(__dirname, 'jwt.key')) ? fs.readFileSync(path.join(__dirname, 'jwt.key')) : null;
const PUBLIC_KEY = PRIVATE_KEY ? fs.readFileSync(path.join(__dirname, 'jwt.pub')) : null;

// Helper: persist db
function persist() { fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }

// POST /redeem
app.post('/redeem', (req, res) => {
  const { voucher, client_pubkey } = req.body;
  if (!voucher || !client_pubkey) return res.status(400).json({ error: 'voucher & client_pubkey required' });
  const v = db.vouchers[voucher];
  if (!v) return res.status(404).json({ error: 'invalid voucher' });
  if (v.redeemed) return res.status(409).json({ error: 'voucher already redeemed' });

  // create activation
  const activationId = 'act_' + Date.now();
  const payload = { activationId, voucher, client_pubkey_hash: client_pubkey.slice(0, 40), exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) };
  let token;
  if (PRIVATE_KEY) {
    token = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });
  } else {
    // fallback: unsigned for prototype (not secure)
    token = jwt.sign(payload, 'dev-secret');
  }

  db.vouchers[voucher].redeemed = true;
  db.activations[activationId] = { voucher, client_pubkey_hash: payload.client_pubkey_hash, token, expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() };
  persist();
  return res.json({ activationId, token, expires_at: db.activations[activationId].expires_at });
});

// POST /deactivate
app.post('/deactivate', (req, res) => {
  const { activationId } = req.body;
  if (!activationId) return res.status(400).json({ error: 'activationId required' });
  if (!db.activations[activationId]) return res.status(404).json({ error: 'not found' });
  db.activations[activationId].revoked = true;
  persist();
  return res.json({ status: 'ok' });
});

// GET /status
app.get('/status', (req, res) => {
  const { activationId } = req.query;
  if (!activationId) return res.status(400).json({ error: 'activationId required' });
  const act = db.activations[activationId];
  if (!act) return res.status(404).json({ error: 'not found' });
  return res.json(act);
});

// GET /publicKey - return base64 public key if available
app.get('/publicKey', (req, res) => {
  if (!PUBLIC_KEY) return res.status(404).send('');
  // return raw contents (PEM) or base64
  res.type('text/plain').send(PUBLIC_KEY.toString());
});

// Endpoint to create a voucher (admin prototyping)
app.post('/voucher', (req, res) => {
  const id = 'v_' + Math.random().toString(36).slice(2, 9);
  db.vouchers[id] = { created_at: new Date().toISOString(), redeemed: false };
  persist();
  res.json({ voucher: id });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log('License server listening on', PORT));

// For development: if no keys exist, log a notice
if (!PRIVATE_KEY) console.log('License server running without RSA signing keys. Redeemed tokens will be signed with dev secret. To enable production signing place jwt.key and jwt.pub in the server directory.');
