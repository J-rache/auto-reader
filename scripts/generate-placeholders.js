const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG (base64)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
const pngBuffer = Buffer.from(pngBase64, 'base64');

const outDir = path.join(__dirname, '..', 'build', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sizes = [16, 32, 48, 64, 128, 256];
for (const s of sizes) {
  const p = path.join(outDir, `icon-${s}.png`);
  fs.writeFileSync(p, pngBuffer);
  console.log('Wrote', p);
}

// Create ICO with single PNG entry (embedding PNG into ICO)
const icoPath = path.join(outDir, 'icon.ico');
const pngLen = pngBuffer.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = 1
header.writeUInt16LE(1, 4); // count = 1

const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0); // width 0 = 256
entry.writeUInt8(0, 1); // height 0 = 256
entry.writeUInt8(0, 2); // color count
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(0, 4); // planes
entry.writeUInt16LE(0, 6); // bitcount
entry.writeUInt32LE(pngLen, 8); // bytes in resource
entry.writeUInt32LE(6 + 16, 12); // image offset

const icoBuf = Buffer.concat([header, entry, pngBuffer]);
fs.writeFileSync(icoPath, icoBuf);
console.log('Wrote', icoPath);

console.log('Placeholder icons generated at', outDir);
