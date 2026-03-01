// Native messaging host prototype: reads JSON messages from stdin and appends to native-bridge/messages.json
const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

async function main() {
  const input = await readStdin();
  if (!input) return;
  // native messaging protocol: 4-byte length + message; some hosts send only message to stdin
  let msg = input;
  try { msg = JSON.parse(input); } catch (e) { /* leave as string */ }
  const bridgeDir = path.join(__dirname, '..', 'native-bridge');
  if (!fs.existsSync(bridgeDir)) fs.mkdirSync(bridgeDir, { recursive: true });
  const file = path.join(bridgeDir, 'messages.json');
  let arr = [];
  if (fs.existsSync(file)) {
    try { arr = JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); } catch (e) { arr = []; }
  }
  arr.push({ ts: new Date().toISOString(), message: msg });
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
