import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, '../public/images/products');
const productsPath = path.resolve(__dirname, '../src/data/products.js');

let content = fs.readFileSync(productsPath, 'utf-8');

// Helper: download file from URL
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ========== 1. Handle base64 JPEG images ==========
const base64Regex = /"data:image\/jpeg;base64,([^"]+)"/g;
let base64Match;
let base64Counter = 0;
const base64Replacements = [];

while ((base64Match = base64Regex.exec(content)) !== null) {
  const fullMatch = base64Match[0];
  const base64Data = base64Match[1];
  base64Counter++;

  const tempJpg = path.join(imagesDir, `temp-base64-${base64Counter}.jpg`);
  const outWebp = path.join(imagesDir, `product-base64-${base64Counter}.webp`);

  try {
    fs.writeFileSync(tempJpg, Buffer.from(base64Data, 'base64'));
    await sharp(tempJpg).webp({ quality: 85 }).toFile(outWebp);
    fs.unlinkSync(tempJpg);
    base64Replacements.push({
      search: fullMatch,
      replace: `"/images/products/product-base64-${base64Counter}.webp"`
    });
    console.log(`✓ Base64 #${base64Counter} -> product-base64-${base64Counter}.webp`);
  } catch (e) {
    console.error(`✗ Base64 #${base64Counter} error: ${e.message}`);
  }
}

// Apply base64 replacements (do this after all conversions to avoid regex index issues)
for (const r of base64Replacements) {
  content = content.replace(r.search, r.replace);
}

// ========== 2. Handle Instagram HEIC URLs ==========
const instaRegex = /"(https:\/\/instagram[^"]+\.heic[^"]*)"/g;
let instaMatch;
let instaCounter = 0;
const instaReplacements = [];

while ((instaMatch = instaRegex.exec(content)) !== null) {
  const fullMatch = instaMatch[0];
  const url = instaMatch[1];
  instaCounter++;

  const tempFile = path.join(imagesDir, `temp-insta-${instaCounter}.tmp`);
  const outWebp = path.join(imagesDir, `product-insta-${instaCounter}.webp`);

  try {
    await downloadFile(url, tempFile);
    await sharp(tempFile).webp({ quality: 85 }).toFile(outWebp);
    fs.unlinkSync(tempFile);
    instaReplacements.push({
      search: fullMatch,
      replace: `"/images/products/product-insta-${instaCounter}.webp"`
    });
    console.log(`✓ Instagram #${instaCounter} -> product-insta-${instaCounter}.webp`);
  } catch (e) {
    console.error(`✗ Instagram #${instaCounter} error: ${e.message} (${url.substring(0, 80)}...)`);
  }
}

// Apply instagram replacements
for (const r of instaReplacements) {
  content = content.replace(r.search, r.replace);
}

fs.writeFileSync(productsPath, content, 'utf-8');

console.log(`\n✓ ${base64Replacements.length} imágenes base64 convertidas`);
console.log(`✓ ${instaReplacements.length} imágenes Instagram convertidas`);
console.log(`✓ ${base64Replacements.length + instaReplacements.length} rutas actualizadas en products.js`);
