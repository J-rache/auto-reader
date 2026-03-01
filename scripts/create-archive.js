const tar = require('tar');
const fs = require('fs');
const path = require('path');

async function run() {
  const repoRoot = path.join(__dirname, '..');
  const outDir = path.join(repoRoot, 'out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0,14);
  const outPath = path.join(outDir, `build-${timestamp}.tar.gz`);
  const dirs = ['dist', path.join('renderer','dist')].map(d => path.join(repoRoot, d)).filter(fs.existsSync);
  if (dirs.length === 0) {
    console.error('No dist directories to archive');
    process.exit(1);
  }
  console.log('Archiving:', dirs, '->', outPath);
  await tar.c({ gzip: true, file: outPath, cwd: repoRoot }, dirs.map(d => path.relative(repoRoot, d)));
  console.log('Wrote', outPath);
}

run().catch(err => { console.error(err); process.exit(1); });
