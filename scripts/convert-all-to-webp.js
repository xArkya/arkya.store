import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, '../public/images/products');
const productsPath = path.resolve(__dirname, '../src/data/products.js');

// 1. Encontrar todos los archivos .jpg y .heic
const files = fs.readdirSync(imagesDir);
const toConvert = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.heic'));

console.log(`Encontrados ${toConvert.length} archivos para convertir:`);
toConvert.forEach(f => console.log(`  - ${f}`));

let converted = 0;
let errors = [];

for (const file of toConvert) {
  const inputPath = path.join(imagesDir, file);
  const outputPath = path.join(imagesDir, file.replace(/\.(jpg|jpeg|heic)$/i, '.webp'));

  try {
    // No sobrescribir si ya existe .webp
    if (!fs.existsSync(outputPath)) {
      await sharp(inputPath).webp({ quality: 85 }).toFile(outputPath);
      console.log(`  ✓ ${file} -> ${path.basename(outputPath)}`);
    } else {
      console.log(`  ⚠ ${file}: .webp ya existe, saltando conversión`);
    }
    converted++;
  } catch (e) {
    errors.push({ file, error: e.message });
    console.error(`  ✗ Error convirtiendo ${file}: ${e.message}`);
  }
}

// 2. Actualizar products.js
let content = fs.readFileSync(productsPath, 'utf-8');
let replaced = 0;

// Reemplazar .jpg y .heic por .webp en rutas de imágenes
content = content.replace(/"(\/images\/products\/[^"]+)\.(jpg|jpeg|heic)"/gi, (match, basePath) => {
  replaced++;
  return `"${basePath}.webp"`;
});

fs.writeFileSync(productsPath, content, 'utf-8');

console.log(`\n✓ ${converted} archivos convertidos a .webp`);
console.log(`✓ ${replaced} rutas actualizadas en products.js`);
if (errors.length > 0) {
  console.warn(`\n⚠ ${errors.length} errores:`);
  errors.forEach(e => console.warn(`  - ${e.file}: ${e.error}`));
}
