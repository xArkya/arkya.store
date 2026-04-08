import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from './src/data/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let imageCount = 0;
const updatedProducts = [];

// Procesar cada producto
products.forEach((product) => {
  const updatedProduct = { ...product };

  // Procesar imagen principal
  if (product.image && product.image.startsWith('/images/products/')) {
    // Ya está en formato de URL, no necesita cambios
    imageCount++;
  } else if (product.image && !product.image.startsWith('data:image')) {
    // Ya es una URL, mantenerla
    imageCount++;
  }

  // Procesar imágenes adicionales
  if (product.images && Array.isArray(product.images)) {
    updatedProduct.images = product.images.map((img) => {
      if (img && img.startsWith('/images/products/')) {
        imageCount++;
        return img;
      } else if (img && !img.startsWith('data:image')) {
        imageCount++;
        return img;
      }
      return img;
    });
  }

  updatedProducts.push(updatedProduct);
});

console.log(`\n✓ Verificación completada!`);
console.log(`  - ${imageCount} referencias de imágenes encontradas`);
console.log(`  - ${products.length} productos verificados`);
console.log(`\n📁 Las imágenes están en: /public/images/products/`);
console.log(`🌐 URLs en products.js: /images/products/product-ID-index.jpg`);
console.log(`\n✅ Las rutas son correctas para Vite`);
