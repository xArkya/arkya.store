const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compress(file, maxDim, quality, minSizeKB) {
  const stats = fs.statSync(file);
  if (stats.size < minSizeKB * 1024) return { file, skipped: true };
  const input = fs.readFileSync(file);
  const meta = await sharp(input).metadata();
  const resized = Math.max(meta.width, meta.height) > maxDim;
  const buf = await sharp(input)
    .resize(resized ? { width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true } : undefined)
    .webp({ quality })
    .toBuffer();
  if (buf.length >= stats.size) return { file, skipped: true };
  fs.writeFileSync(file, buf);
  return { file, before: stats.size, after: buf.length };
}

async function run() {
  let done = 0, saved = 0;
  const report = (r) => {
    done++;
    if (!r.skipped) {
      saved += r.before - r.after;
      if (r.before > 400 * 1024) console.log(`${path.basename(r.file)}: ${Math.round(r.before/1024)}KB -> ${Math.round(r.after/1024)}KB`);
    }
    if (done % 200 === 0) console.log(`...${done} procesados`);
  };

  const root = fs.readdirSync('public/images').filter(f => f.endsWith('.webp'));
  for (const f of root) {
    try { report(await compress(path.join('public/images', f), 1400, 78, 150)); }
    catch (e) { console.log('ERROR', f, e.message); }
  }

  const dir = 'public/images/products';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
  for (const f of files) {
    try { report(await compress(path.join(dir, f), 900, 75, 120)); }
    catch (e) { console.log('ERROR', f, e.message); }
  }

  console.log(`LISTO. Ahorrado: ${Math.round(saved/1048576)}MB en ${done} archivos`);
}
run().catch(e => { console.error(e); process.exit(1); });
