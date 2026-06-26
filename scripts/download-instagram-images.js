#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Script para descargar imágenes de Instagram y guardarlas localmente
 * Uso: node download-instagram-images.js <product-id> <image-urls...>
 * 
 * Ejemplo:
 * node download-instagram-images.js ig_1234567890 "https://scontent.cdninstagram.com/..." "https://scontent.cdninstagram.com/..."
 */

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'products');

// Asegurar que el directorio existe
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Descargar una imagen desde una URL
 */
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(IMAGES_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { timeout: 5000 }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Eliminar archivo incompleto
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Eliminar archivo incompleto
      reject(err);
    });
  });
}

/**
 * Obtener extensión del archivo desde URL
 */
function getFileExtension(url) {
  const urlPath = url.split('?')[0]; // Remover query params
  const ext = path.extname(urlPath) || '.jpg';
  return ext;
}

/**
 * Generar nombre de archivo único
 */
function generateFilename(productId, index) {
  const timestamp = Date.now();
  const ext = '.jpg';
  return `product-${productId}-${index}${ext}`;
}

/**
 * Descargar múltiples imágenes para un producto (en paralelo)
 */
async function downloadProductImages(productId, imageUrls) {
  if (!productId || !imageUrls || imageUrls.length === 0) {
    console.error('Error: Se requiere productId e imageUrls');
    process.exit(1);
  }

  console.log(`\n📥 Descargando ${imageUrls.length} imágenes para producto: ${productId}`);
  
  const downloadedImages = new Array(imageUrls.length);
  let successCount = 0;
  let failureCount = 0;
  
  // Descargar máximo 3 imágenes en paralelo
  const MAX_PARALLEL = 3;
  const promises = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const filename = generateFilename(productId, i);
    
    const downloadPromise = (async () => {
      try {
        console.log(`  [${i + 1}/${imageUrls.length}] Descargando: ${filename}`);
        await downloadImage(url, filename);
        
        // Guardar la URL local relativa
        const localUrl = `/images/products/${filename}`;
        downloadedImages[i] = localUrl;
        successCount++;
        console.log(`  ✅ Guardado: ${localUrl}`);
      } catch (error) {
        failureCount++;
        console.error(`  ❌ Error descargando imagen ${i + 1}: ${error.message}`);
      }
    })();
    
    promises.push(downloadPromise);
    
    // Limitar a MAX_PARALLEL descargas simultáneas
    if (promises.length >= MAX_PARALLEL) {
      await Promise.race(promises);
      promises.splice(promises.findIndex(p => p === downloadPromise), 1);
    }
  }
  
  // Esperar a que terminen todas las descargas
  await Promise.all(promises);

  console.log(`\n✅ Descarga completada: ${successCount} exitosas, ${failureCount} fallidas`);
  
  return {
    productId,
    downloadedImages: downloadedImages.filter(img => img !== undefined),
    successCount,
    failureCount,
    totalRequested: imageUrls.length
  };
}

/**
 * Procesar argumentos de línea de comandos
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Uso: node download-instagram-images.js <product-id> <image-url-1> [image-url-2] ...

Ejemplo:
  node download-instagram-images.js ig_1234567890 "https://scontent.cdninstagram.com/..." "https://scontent.cdninstagram.com/..."

Este script descarga imágenes de Instagram y las guarda en:
  public/images/products/

Las URLs locales se devuelven en formato:
  /images/products/product-<id>-<index>.jpg
    `);
    process.exit(1);
  }

  const productId = args[0];
  const imageUrls = args.slice(1);

  try {
    const result = await downloadProductImages(productId, imageUrls);
    
    // Imprimir resultado como JSON para que pueda ser procesado por el servidor
    console.log('\n📊 Resultado:');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(result.failureCount === 0 ? 0 : 1);
  } catch (error) {
    console.error('Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { downloadProductImages, downloadImage };
