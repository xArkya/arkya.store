import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.js');
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'products');

// Leer products.js
let content = fs.readFileSync(productsPath, 'utf-8');

// Buscar base64 embebidos: data:image/{format};base64,...
const base64Regex = /"data:image\/([^;]+);base64,([^"]+)"/g;
let match;
let count = 0;
const replacements = [];

// Asegurar que el directorio de imágenes existe
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

while ((match = base64Regex.exec(content)) !== null) {
  const format = match[1]; // jpeg, png, webp, etc.
  const base64Data = match[2];
  const originalMatch = match[0];
  
  // Si ya es webp, solo extraer
  if (format === 'webp') {
    const filename = `product-${Date.now()}-${count}.webp`;
    const filepath = path.join(imagesDir, filename);
    
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
    console.log(`✓ Extraído (ya webp): ${filename} (${(base64Data.length * 0.75 / 1024).toFixed(1)} KB)`);
    
    replacements.push({
      from: originalMatch,
      to: `"/images/products/${filename}"`
    });
  } else {
    // Convertir a webp
    const filename = `product-${Date.now()}-${count}.webp`;
    const filepath = path.join(imagesDir, filename);
    
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      await sharp(buffer)
        .webp({ quality: 85, effort: 4 })
        .toFile(filepath);
      
      const originalSize = buffer.length / 1024;
      const webpSize = fs.statSync(filepath).size / 1024;
      const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);
      
      console.log(`✓ Convertido ${format} -> webp: ${filename} (${originalSize.toFixed(1)} KB -> ${webpSize.toFixed(1)} KB, ${savings}% ahorro)`);
      
      replacements.push({
        from: originalMatch,
        to: `"/images/products/${filename}"`
      });
    } catch (err) {
      console.error(`✗ Error convirtiendo imagen ${count}:`, err.message);
    }
  }
  count++;
}

// Reemplazar en el contenido
for (const r of replacements) {
  content = content.replace(r.from, r.to);
}

fs.writeFileSync(productsPath, content, 'utf-8');
console.log(`\n✓ ${replacements.length} imágenes base64 procesadas en products.js`);
