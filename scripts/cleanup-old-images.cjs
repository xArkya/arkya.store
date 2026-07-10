const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images/products');

// Encontrar todos los archivos .jpg, .jpeg y .heic
const files = fs.readdirSync(imagesDir);
const toDelete = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.heic'));

console.log(`Encontrados ${toDelete.length} archivos para revisar:`);

let deleted = 0;
let skipped = 0;
let errors = [];

for (const file of toDelete) {
  const inputPath = path.join(imagesDir, file);
  const webpPath = path.join(imagesDir, file.replace(/\.(jpg|jpeg|heic)$/i, '.webp'));

  // Verificar que existe el archivo .webp correspondiente
  if (fs.existsSync(webpPath)) {
    try {
      fs.unlinkSync(inputPath);
      console.log(`  ✓ Eliminado: ${file}`);
      deleted++;
    } catch (e) {
      errors.push({ file, error: e.message });
      console.error(`  ✗ Error eliminando ${file}: ${e.message}`);
    }
  } else {
    console.log(`  ⚠ Saltado: ${file} (no existe .webp correspondiente)`);
    skipped++;
  }
}

console.log(`\n✓ ${deleted} archivos .jpg/.jpeg/.heic eliminados`);
console.log(`⚠ ${skipped} archivos saltados (sin .webp correspondiente)`);
if (errors.length > 0) {
  console.warn(`\n⚠ ${errors.length} errores:`);
  errors.forEach(e => console.warn(`  - ${e.file}: ${e.error}`));
}
