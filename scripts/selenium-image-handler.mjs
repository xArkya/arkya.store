import fs from 'fs';
import path from 'path';
import { autoConvertProductImages } from './auto-convert-images.mjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handler para procesar imágenes descargadas por Selenium
 * Convierte automáticamente JPG a WebP y actualiza las rutas en products.js
 */
export class SeleniumImageHandler {
  constructor(productsFilePath = null) {
    this.productsFilePath = productsFilePath || path.join(__dirname, '..', 'src', 'data', 'products.js');
    this.productsDir = path.join(__dirname, '..', 'public', 'images', 'products');
  }

  /**
   * Procesa imágenes descargadas por Selenium
   * @param {Object} productData - Datos del producto con imágenes
   * @returns {Object} Producto actualizado con rutas WebP
   */
  async processProductImages(productData) {
    console.log(`\n📥 Procesando producto: ${productData.name}`);
    
    // Asegurar que el directorio de productos existe
    if (!fs.existsSync(this.productsDir)) {
      fs.mkdirSync(this.productsDir, { recursive: true });
    }

    // Convertir imágenes a WebP
    const convertedImages = await autoConvertProductImages(
      productData.id,
      productData.images || [productData.image]
    );

    // Actualizar rutas en el producto
    const updatedProduct = { ...productData };
    
    if (convertedImages.length > 0) {
      // Convertir rutas absolutas a relativas
      updatedProduct.images = convertedImages.map(imgPath => {
        // Convertir ruta absoluta a relativa (/images/products/...)
        const relativePath = imgPath.replace(/\\/g, '/').split('public')[1] || imgPath;
        return relativePath;
      });

      if (updatedProduct.images.length > 0) {
        updatedProduct.image = updatedProduct.images[0];
      }

      console.log(`✅ Imágenes procesadas:`);
      updatedProduct.images.forEach(img => console.log(`   - ${img}`));
    }

    return updatedProduct;
  }

  /**
   * Agrega un producto a products.js con imágenes convertidas
   * @param {Object} productData - Datos del producto
   */
  async addProductWithConvertedImages(productData) {
    try {
      // Procesar imágenes
      const processedProduct = await this.processProductImages(productData);

      // Leer archivo actual
      let productsContent = fs.readFileSync(this.productsFilePath, 'utf-8');

      // Encontrar el array de productos
      const lastBracketIndex = productsContent.lastIndexOf(']');
      if (lastBracketIndex === -1) {
        throw new Error('No se encontró el array de productos en products.js');
      }

      // Preparar el nuevo producto
      const productJson = JSON.stringify(processedProduct, null, 2);
      const insertContent = `,\n  ${productJson}`;

      // Insertar antes del último ]
      const updatedContent = 
        productsContent.slice(0, lastBracketIndex) + 
        insertContent + 
        productsContent.slice(lastBracketIndex);

      // Escribir archivo actualizado
      fs.writeFileSync(this.productsFilePath, updatedContent, 'utf-8');

      console.log(`\n✅ Producto agregado a products.js`);
      console.log(`   ID: ${processedProduct.id}`);
      console.log(`   Nombre: ${processedProduct.name}`);
      console.log(`   Imágenes: ${processedProduct.images.length}`);

      return processedProduct;

    } catch (error) {
      console.error(`❌ Error al agregar producto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida que todas las imágenes de un producto existan en WebP
   * @param {Object} product - Producto a validar
   * @returns {boolean} true si todas las imágenes existen
   */
  validateProductImages(product) {
    const images = product.images || [product.image];
    
    for (const imagePath of images) {
      const fullPath = path.join(__dirname, '..', 'public', imagePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  Imagen no encontrada: ${imagePath}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Limpia imágenes JPG antiguas después de convertir a WebP
   * @param {boolean} dryRun - Si true, solo muestra qué se eliminaría
   */
  cleanupOldJpgImages(dryRun = true) {
    console.log(`\n🧹 Buscando imágenes JPG antiguas...`);
    
    const jpgFiles = fs.readdirSync(this.productsDir)
      .filter(file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg'));

    if (jpgFiles.length === 0) {
      console.log('No hay imágenes JPG para limpiar');
      return;
    }

    console.log(`Encontradas ${jpgFiles.length} imágenes JPG:`);
    
    jpgFiles.forEach(file => {
      const filePath = path.join(this.productsDir, file);
      const webpPath = filePath.replace(/\.(jpg|jpeg)$/i, '.webp');
      
      // Solo eliminar si existe la versión WebP
      if (fs.existsSync(webpPath)) {
        if (dryRun) {
          console.log(`   [DRY RUN] Eliminaría: ${file}`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`   ✅ Eliminado: ${file}`);
        }
      } else {
        console.log(`   ⚠️  No se elimina ${file} (no existe ${path.basename(webpPath)})`);
      }
    });

    if (dryRun) {
      console.log('\nEjecutar con cleanupOldJpgImages(false) para eliminar realmente');
    }
  }
}

// Ejemplo de uso
if (import.meta.url === `file://${process.argv[1]}`) {
  const handler = new SeleniumImageHandler();
  
  // Ejemplo: Producto de prueba
  const testProduct = {
    id: Date.now(),
    name: 'Producto de Prueba',
    image: '/images/products/test-0.jpg',
    images: [
      '/images/products/test-0.jpg',
      '/images/products/test-1.jpg'
    ],
    price: 9999,
    category: 'Test'
  };

  console.log('Ejemplo de uso del SeleniumImageHandler');
  console.log('=====================================\n');
  console.log('1. Procesar imágenes de un producto:');
  console.log('   const handler = new SeleniumImageHandler();');
  console.log('   const processed = await handler.processProductImages(productData);\n');
  
  console.log('2. Agregar producto con imágenes convertidas:');
  console.log('   await handler.addProductWithConvertedImages(productData);\n');
  
  console.log('3. Validar imágenes de un producto:');
  console.log('   const isValid = handler.validateProductImages(product);\n');
  
  console.log('4. Limpiar imágenes JPG antiguas:');
  console.log('   handler.cleanupOldJpgImages(true);  // dry run');
  console.log('   handler.cleanupOldJpgImages(false); // eliminar realmente\n');
}

export default SeleniumImageHandler;
