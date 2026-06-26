import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_FILE = path.join(__dirname, '../src/data/products.js');
const IMAGES_DIR = path.join(__dirname, '../public/images/products');
const BACKUP_FILE = path.join(__dirname, '../src/data/products.backup.js');

// Función para extraer el tipo MIME y los datos de una imagen base64
function parseBase64Image(base64String) {
  const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    console.warn('String base64 no válido:', base64String.substring(0, 50) + '...');
    return null;
  }
  
  return {
    mimeType: matches[1],
    extension: matches[1].split('/')[1],
    data: matches[2]
  };
}

// Función para generar un nombre de archivo único
function generateImageFilename(extension, index = 0) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `img_${timestamp}_${randomStr}_${index}.${extension}`;
}

// Función principal
function extractImages() {
  console.log('Iniciando extracción de imágenes base64...');
  
  // Verificar que el archivo de productos exista
  if (!fs.existsSync(PRODUCTS_FILE)) {
    console.error('No se encontró el archivo products.js en:', PRODUCTS_FILE);
    throw new Error('Archivo products.js no encontrado');
  }
  
  // Crear backup del archivo original
  console.log('Creando backup del archivo original...');
  fs.copyFileSync(PRODUCTS_FILE, BACKUP_FILE);
  
  // Leer el archivo de productos
  let productsContent = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  
  // Extraer el array de productos
  const productsMatch = productsContent.match(/export\s+const\s+products\s*=\s*(\[.*?\]);/s);
  if (!productsMatch) {
    console.error('No se encontró el array de productos en el formato esperado');
    throw new Error('Array de productos no encontrado');
  }
  
  let products;
  try {
    products = JSON.parse(productsMatch[1]);
  } catch (error) {
    console.error('Error al parsear el JSON de productos:', error.message);
    throw new Error('Error parseando JSON de productos');
  }
  
  // Crear directorio de imágenes si no existe
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('Directorio de imágenes creado:', IMAGES_DIR);
  }
  
  let convertedImages = 0;
  let totalImages = 0;
  
  // Procesar cada producto
  products.forEach((product, productIndex) => {
    console.log(`\nProcesando producto ${productIndex + 1}: ${product.name}`);
    
    // Procesar imagen principal
    if (product.image && product.image.startsWith('data:image/')) {
      totalImages++;
      const imageData = parseBase64Image(product.image);
      if (imageData) {
        const filename = generateImageFilename(imageData.extension);
        const filepath = path.join(IMAGES_DIR, filename);
        const relativePath = `/images/products/${filename}`;
        
        // Guardar imagen como archivo
        fs.writeFileSync(filepath, imageData.data, 'base64');
        
        // Actualizar ruta en el producto
        product.image = relativePath;
        
        console.log(`  Imagen principal guardada: ${filename}`);
        convertedImages++;
      }
    }
    
    // Procesar array de imágenes
    if (product.images && Array.isArray(product.images)) {
      product.images = product.images.map((img, imgIndex) => {
        if (img && img.startsWith('data:image/')) {
          totalImages++;
          const imageData = parseBase64Image(img);
          if (imageData) {
            const filename = generateImageFilename(imageData.extension, imgIndex);
            const filepath = path.join(IMAGES_DIR, filename);
            const relativePath = `/images/products/${filename}`;
            
            // Guardar imagen como archivo
            fs.writeFileSync(filepath, imageData.data, 'base64');
            
            console.log(`  Imagen ${imgIndex + 1} guardada: ${filename}`);
            convertedImages++;
            
            return relativePath;
          }
        }
        return img;
      });
    }
  });
  
  // Generar nuevo contenido del archivo
  const newContent = `export const products = ${JSON.stringify(products, null, 2)};`;
  
  // Escribir el archivo actualizado
  fs.writeFileSync(PRODUCTS_FILE, newContent, 'utf8');
  
  // Mostrar resumen
  console.log('\n=== RESUMEN ===');
  console.log(`Total de imágenes encontradas: ${totalImages}`);
  console.log(`Imágenes convertidas exitosamente: ${convertedImages}`);
  console.log(`Imágenes guardadas en: ${IMAGES_DIR}`);
  console.log(`Backup guardado en: ${BACKUP_FILE}`);
  console.log(`Archivo products.js actualizado`);
  
  if (convertedImages > 0) {
    console.log('\n¡Proceso completado con éxito!');
    console.log('Las imágenes ahora son archivos físicos y el archivo products.js es mucho más ligero.');
  } else {
    console.log('\nNo se encontraron imágenes base64 para convertir.');
  }
}

// Ejecutar el script
extractImages();

export { extractImages };
