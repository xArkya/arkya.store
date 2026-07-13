import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convierte automáticamente imágenes JPG/JPEG a WebP
 * Se ejecuta cuando se agregan nuevas imágenes de productos
 */
export async function autoConvertImagesToWebP(imagePaths) {
  if (!imagePaths || imagePaths.length === 0) {
    console.log('No hay imágenes para convertir');
    return [];
  }

  const convertedPaths = [];
  const errors = [];

  for (const imagePath of imagePaths) {
    try {
      // Verificar si es JPG/JPEG
      if (!imagePath.toLowerCase().match(/\.(jpg|jpeg)$/)) {
        console.log(`⏭️  Saltando ${path.basename(imagePath)} (no es JPG/JPEG)`);
        convertedPaths.push(imagePath);
        continue;
      }

      const ext = path.extname(imagePath).toLowerCase();
      const basePath = imagePath.slice(0, -ext.length);
      const webpPath = `${basePath}.webp`;

      // Verificar si el archivo WebP ya existe
      if (fs.existsSync(webpPath)) {
        console.log(`✅ ${path.basename(webpPath)} ya existe`);
        convertedPaths.push(webpPath);
        continue;
      }

      // Verificar que el archivo JPG existe
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Archivo no encontrado: ${imagePath}`);
      }

      // Convertir a WebP usando cwebp (debe estar instalado)
      console.log(`🔄 Convirtiendo ${path.basename(imagePath)} a WebP...`);
      
      try {
        // Intenta usar cwebp si está disponible
        execSync(`cwebp "${imagePath}" -o "${webpPath}" -q 80`, { 
          stdio: 'pipe',
          shell: true 
        });
      } catch (e) {
        // Si cwebp no está disponible, intenta con ImageMagick
        console.log('   cwebp no disponible, intentando con ImageMagick...');
        execSync(`magick convert "${imagePath}" -quality 80 "${webpPath}"`, { 
          stdio: 'pipe',
          shell: true 
        });
      }

      console.log(`✅ Convertido: ${path.basename(webpPath)}`);
      convertedPaths.push(webpPath);

    } catch (error) {
      console.error(`❌ Error al convertir ${path.basename(imagePath)}: ${error.message}`);
      errors.push({
        file: imagePath,
        error: error.message
      });
      // Mantener la ruta original si falla la conversión
      convertedPaths.push(imagePath);
    }
  }

  // Resumen
  console.log('\n=== Resumen de Conversión ===');
  console.log(`Total procesados: ${imagePaths.length}`);
  console.log(`Convertidos: ${convertedPaths.filter(p => p.endsWith('.webp')).length}`);
  console.log(`Errores: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errores encontrados:');
    errors.forEach(err => {
      console.log(`   - ${err.file}: ${err.error}`);
    });
  }

  return convertedPaths;
}

/**
 * Procesa un directorio completo de imágenes
 */
export async function autoConvertDirectoryToWebP(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directorio no encontrado: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath);
  const imagePaths = files
    .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png)$/))
    .map(file => path.join(dirPath, file));

  return autoConvertImagesToWebP(imagePaths);
}

/**
 * Hook para usar en tu script de Selenium
 * Uso: await autoConvertProductImages(productId, imageUrls)
 */
export async function autoConvertProductImages(productId, imageUrls) {
  console.log(`\n📦 Procesando imágenes del producto ${productId}...`);
  
  const imagePaths = imageUrls.map(url => {
    // Convertir URL a ruta local
    // Ej: /images/products/product-123-0.jpg -> /public/images/products/product-123-0.jpg
    return path.join(__dirname, '..', 'public', url);
  });

  return autoConvertImagesToWebP(imagePaths);
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetPath = process.argv[2];
  
  if (!targetPath) {
    console.log('Uso: node auto-convert-images.mjs <ruta-archivo-o-directorio>');
    process.exit(1);
  }

  const stats = fs.statSync(targetPath);
  
  if (stats.isDirectory()) {
    autoConvertDirectoryToWebP(targetPath)
      .then(() => process.exit(0))
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  } else {
    autoConvertImagesToWebP([targetPath])
      .then(() => process.exit(0))
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  }
}
