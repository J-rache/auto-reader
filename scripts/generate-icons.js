const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

(async () => {
  try {
    const root = path.join(__dirname, '..', 'build');
    const svgPath = path.join(root, 'icon.svg');
    if (!fs.existsSync(svgPath)) throw new Error('icon.svg not found in build/');
    const outDir = path.join(root, 'icons');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
    const pngPaths = [];
    for (const s of sizes) {
      const out = path.join(outDir, `icon-${s}.png`);
      await sharp(svgPath).resize(s, s).png().toFile(out);
      pngPaths.push(out);
      console.log('Wrote', out);
    }

    const icoPath = path.join(root, 'icon.ico');
    const buf = await pngToIco(pngPaths);
    fs.writeFileSync(icoPath, buf);
    console.log('Wrote', icoPath);

    // create a 512x512 PNG for mac/linux
    const png512 = path.join(root, 'icon-512.png');
    await sharp(svgPath).resize(512, 512).png().toFile(png512);
    console.log('Wrote', png512);

    console.log('Icon generation complete');
  } catch (err) {
    console.error('generate-icons error', err);
    process.exit(1);
  }
})();
