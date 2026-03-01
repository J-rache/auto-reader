// coquiClient.js - minimal client to call local Coqui TTS service
export async function synthesizeWithCoqui(text) {
  const url = 'http://localhost:5002/synthesize';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('Coqui service error: ' + res.status);
    const arr = await res.arrayBuffer();
    return arr; // return audio data as ArrayBuffer (wav)
  } catch (err) {
    console.warn('synthesizeWithCoqui error', err);
    throw err;
  }
}
