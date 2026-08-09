import sharp from 'sharp';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsDataPath = path.join(__dirname, '../src/data/products.js');
const imagesDir = path.join(__dirname, '../public/images/products');

// Asegurar que el directorio de imágenes existe
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function downloadAndConvertImage(imageUrl, outputPath) {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.buffer();

    // Convertir a WebP
    await sharp(buffer)
      .webp({ quality: 85 })
      .toFile(outputPath);

    console.log(`✓ Descargado y convertido: ${imageUrl} → ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Error procesando ${imageUrl}:`, error.message);
    return false;
  }
}

async function processProductImages() {
  try {
    // Leer el archivo de productos
    const productsContent = fs.readFileSync(productsDataPath, 'utf-8');
    
    // Usar regex para encontrar todas las URLs de imágenes
    const imageUrlRegex = /"(https?:\/\/[^"]+\.(jpg|jpeg|png|webp))"/gi;
    const matches = [...productsContent.matchAll(imageUrlRegex)];

    console.log(`Encontradas ${matches.length} imágenes externas para procesar`);

    let updatedContent = productsContent;
    const processedUrls = new Set();

    for (const match of matches) {
      const imageUrl = match[1];
      
      // Evitar procesar la misma URL múltiples veces
      if (processedUrls.has(imageUrl)) {
        continue;
      }
      processedUrls.add(imageUrl);

      // Solo procesar URLs de Instagram y picsum.photos
      if (!imageUrl.includes('instagram') && !imageUrl.includes('picsum.photos')) {
        continue;
      }

      // Generar nombre de archivo local
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 10000);
      const localFileName = `product-${timestamp}-${randomId}.webp`;
      const localPath = path.join(imagesDir, localFileName);
      const localUrl = `/images/products/${localFileName}`;

      // Descargar y convertir
      const success = await downloadAndConvertImage(imageUrl, localPath);

      if (success) {
        // Reemplazar la URL en el contenido
        updatedContent = updatedContent.replaceAll(`"${imageUrl}"`, `"${localUrl}"`);
        console.log(`  Reemplazada: ${imageUrl} → ${localUrl}`);
      }
    }

    // Guardar el archivo actualizado
    if (updatedContent !== productsContent) {
      fs.writeFileSync(productsDataPath, updatedContent, 'utf-8');
      console.log('\n✓ Archivo de productos actualizado');
    } else {
      console.log('\nNo se realizaron cambios');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

processProductImages();
