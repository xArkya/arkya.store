const fs = require('fs');
const path = require('path');

// Read products.js file
const productsPath = path.join(__dirname, '../src/data/products.js');
const productsContent = fs.readFileSync(productsPath, 'utf8');

// Parse the products array
const productsMatch = productsContent.match(/export const products = (\[.*\]);/s);
if (!productsMatch) {
  console.error('Could not find products array');
  process.exit(1);
}

const products = JSON.parse(productsMatch[1]);

// Track all base64 images found
let base64Count = 0;
let totalSizeSaved = 0;

// Function to extract base64 and save as file
function extractBase64Image(base64String, productId, imageIndex, isMainImage = false) {
  if (!base64String || !base64String.startsWith('data:image/webp;base64,')) {
    return base64String;
  }

  // Extract the base64 data
  const matches = base64String.match(/^data:image\/webp;base64,(.+)$/);
  if (!matches) {
    return base64String;
  }

  const base64Data = matches[1];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Calculate size in KB
  const sizeKB = (buffer.length / 1024).toFixed(2);
  totalSizeSaved += buffer.length;

  // Generate filename
  let filename;
  if (isMainImage) {
    filename = `${productId}.webp`;
  } else {
    filename = `${productId}-${imageIndex}.webp`;
  }

  // Save to public/images/products
  const outputPath = path.join(__dirname, '../public/images/products', filename);
  fs.writeFileSync(outputPath, buffer);

  console.log(`Extracted: ${filename} (${sizeKB} KB)`);

  // Return the relative path
  return `/images/products/${filename}`;
}

// Process each product
products.forEach((product, productIndex) => {
  const productId = product.id;
  let productHasBase64 = false;

  // Check main image
  if (product.image && product.image.startsWith('data:image/webp;base64,')) {
    console.log(`\nProcessing product ${productId} - main image`);
    product.image = extractBase64Image(product.image, productId, 0, true);
    productHasBase64 = true;
    base64Count++;
  }

  // Check images array
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img, imgIndex) => {
      if (img && img.startsWith('data:image/webp;base64,')) {
        if (!productHasBase64) {
          console.log(`\nProcessing product ${productId}`);
          productHasBase64 = true;
        }
        console.log(`  - Image ${imgIndex + 1}`);
        product.images[imgIndex] = extractBase64Image(img, productId, imgIndex + 1);
        base64Count++;
      }
    });
  }
});

// Update the products.js file
const updatedProductsContent = `export const products = ${JSON.stringify(products, null, 2)};`;
fs.writeFileSync(productsPath, updatedProductsContent);

console.log(`\n✅ Extraction complete!`);
console.log(`   - Total images extracted: ${base64Count}`);
console.log(`   - Total size saved: ${(totalSizeSaved / 1024 / 1024).toFixed(2)} MB`);
