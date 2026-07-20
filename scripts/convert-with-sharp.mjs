import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertImagesToWebP(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    const jpgFiles = files.filter(file => 
      file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
    );

    if (jpgFiles.length === 0) {
      console.log('No hay archivos JPG para convertir');
      return;
    }

    console.log(`\n🔄 Convirtiendo ${jpgFiles.length} imágenes a WebP...\n`);

    let converted = 0;
    let errors = 0;

    for (const file of jpgFiles) {
      try {
        const inputPath = path.join(dirPath, file);
        const outputPath = inputPath.replace(/\.(jpg|jpeg)$/i, '.webp');

        // Convertir con sharp
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);

        console.log(`✅ ${file} → ${path.basename(outputPath)}`);
        converted++;
      } catch (err) {
        console.error(`❌ Error convirtiendo ${file}: ${err.message}`);
        errors++;
      }
    }

    console.log(`\n=== Resumen ===`);
    console.log(`Convertidos: ${converted}`);
    console.log(`Errores: ${errors}`);
    console.log(`Total: ${jpgFiles.length}`);

    // Eliminar archivos JPG originales después de convertir exitosamente
    if (converted > 0) {
      console.log(`\n🧹 Eliminando archivos JPG originales...`);
      let deleted = 0;
      for (const file of jpgFiles) {
        try {
          const filePath = path.join(dirPath, file);
          fs.unlinkSync(filePath);
          console.log(`   ✅ Eliminado: ${file}`);
          deleted++;
        } catch (err) {
          console.error(`   ❌ Error eliminando ${file}: ${err.message}`);
        }
      }
      console.log(`\n${deleted} archivos JPG eliminados`);
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Ejecutar
const targetDir = process.argv[2] || path.join(__dirname, '..', 'public', 'images', 'products');

if (!fs.existsSync(targetDir)) {
  console.error(`Directorio no encontrado: ${targetDir}`);
  process.exit(1);
}

convertImagesToWebP(targetDir).then(() => {
  console.log('\n✅ ¡Conversión completada!');
  process.exit(0);
});
