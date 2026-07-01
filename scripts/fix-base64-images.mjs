import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.js');
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'products');

// Leer products.js
let content = fs.readFileSync(productsPath, 'utf-8');

// Buscar base64 embebidos: data:image/webp;base64,...
const base64Regex = /"data:image\/webp;base64,([^"]+)"/g;
let match;
let count = 0;
const replacements = [];

while ((match = base64Regex.exec(content)) !== null) {
  const base64Data = match[1];
  const filename = `product-1782884435616-${count}.webp`;
  const filepath = path.join(imagesDir, filename);
  
  // Guardar archivo
  fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
  console.log(`✓ Guardado: ${filename} (${(base64Data.length * 0.75 / 1024).toFixed(1)} KB)`);
  
  replacements.push({
    from: match[0],
    to: `"/images/products/${filename}"`
  });
  count++;
}

// Reemplazar en el contenido
for (const r of replacements) {
  content = content.replace(r.from, r.to);
}

fs.writeFileSync(productsPath, content, 'utf-8');
console.log(`\n✓ ${count} imágenes base64 extraídas y reemplazadas en products.js`);
