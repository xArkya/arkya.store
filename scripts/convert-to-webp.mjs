import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = path.join(__dirname, '..', 'public', 'images');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');

const SUPPORTED = ['.png', '.jpg', '.jpeg'];

let converted = 0;
let skipped = 0;
let errors = 0;

async function convertDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await convertDir(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED.includes(ext)) continue;

      const relativeDir = path.relative(INPUT_DIR, dir);
      const baseName = path.basename(entry.name, ext);
      const outDir = path.join(OUTPUT_DIR, relativeDir);
      const outPath = path.join(outDir, `${baseName}.webp`);

      // Skip if WebP already exists and is newer
      if (fs.existsSync(outPath)) {
        const srcStat = fs.statSync(fullPath);
        const outStat = fs.statSync(outPath);
        if (outStat.mtime >= srcStat.mtime) {
          skipped++;
          continue;
        }
      }

      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      try {
        await sharp(fullPath)
          .webp({ quality: 85, effort: 4 })
          .toFile(outPath);
        converted++;
        if (converted % 50 === 0) {
          console.log(`  Convertidos: ${converted} (skipeados: ${skipped}, errores: ${errors})`);
        }
      } catch (err) {
        errors++;
        console.error(`Error convirtiendo ${fullPath}:`, err.message);
      }
    }
  }
}

async function main() {
  console.log('Buscando imágenes en public/images...');
  await convertDir(INPUT_DIR);
  console.log('\n=== Resumen ===');
  console.log(`Convertidos: ${converted}`);
  console.log(`Skipeados (ya existían): ${skipped}`);
  console.log(`Errores: ${errors}`);
}

main().catch(console.error);
