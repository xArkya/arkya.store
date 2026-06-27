import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.resolve(__dirname, '../src/data/products.js');
const imagesDir = path.resolve(__dirname, '../public/images/products');

// Leer products.js
let content = fs.readFileSync(productsPath, 'utf-8');

// Función para verificar qué extensión existe para un archivo
function getExistingExtension(filename) {
  const base = filename.replace(/\.(jpg|jpeg|webp|png)$/i, '');
  const exts = ['.webp', '.jpg', '.jpeg', '.png'];
  for (const ext of exts) {
    const fullPath = path.join(imagesDir, base + ext);
    if (fs.existsSync(fullPath)) {
      return ext;
    }
  }
  return null;
}

// Regex para encontrar rutas de imagen
const pathRegex = /"(\/arkya\.store\/images\/products\/[^"]+)"/g;

let replacements = 0;
let missingFiles = [];

content = content.replace(pathRegex, (match, fullPath) => {
  // Quitar /arkya.store/ del principio
  const relativePath = fullPath.replace('/arkya.store/', '/');
  const filename = path.basename(relativePath);
  const ext = getExistingExtension(filename);

  if (ext) {
    const correctedFilename = filename.replace(/\.(jpg|jpeg|webp|png)$/i, ext);
    const correctedPath = '/images/products/' + correctedFilename;
    if (correctedPath !== fullPath) {
      replacements++;
      return `"${correctedPath}"`;
    }
  } else {
    missingFiles.push(filename);
  }

  return match;
});

fs.writeFileSync(productsPath, content, 'utf-8');

console.log(`✓ ${replacements} rutas corregidas.`);
if (missingFiles.length > 0) {
  console.warn(`⚠ ${missingFiles.length} archivos no encontrados:`);
  missingFiles.forEach(f => console.warn(`  - ${f}`));
}
