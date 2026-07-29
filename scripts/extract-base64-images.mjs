import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const productsPath = path.join(rootDir, 'src/data/products.js');
const imagesDir = path.join(rootDir, 'public/images/products');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Read products.js as text
const originalContent = fs.readFileSync(productsPath, 'utf8');

// Parse the products array by extracting JSON from the export
const start = originalContent.indexOf('[');
const end = originalContent.lastIndexOf(']');
if (start === -1 || end === -1) {
  console.error('Could not find products array in products.js');
  process.exit(1);
}

const jsonText = originalContent.slice(start, end + 1);

let products;
try {
  products = JSON.parse(jsonText);
} catch (e) {
  console.error('Failed to parse products.js as JSON:', e.message);
  process.exit(1);
}

function decodeBase64Image(dataString) {
  const matches = dataString.match(/^data:image\/(webp|jpeg|jpg|png);base64,(.+)$/);
  if (!matches) {
    throw new Error(`Invalid base64 image format: ${dataString.slice(0, 50)}...`);
  }
  const mime = matches[1];
  const ext = mime === 'jpeg' ? 'jpg' : (mime === 'jpg' ? 'jpg' : mime);
  const buffer = Buffer.from(matches[2], 'base64');
  return { mime, ext, buffer };
}

let extractedCount = 0;
let productsUpdated = 0;

for (const product of products) {
  const id = product.id;
  let productUpdated = false;

  // Process main image
  if (product.image && typeof product.image === 'string' && product.image.startsWith('data:image')) {
    const { ext, buffer } = decodeBase64Image(product.image);
    const filename = `product-${id}-main.${ext}`;
    const filePath = path.join(imagesDir, filename);
    fs.writeFileSync(filePath, buffer);
    product.image = `/images/products/${filename}`;
    extractedCount++;
    productUpdated = true;
    console.log(`Extracted image for product ${id} -> ${filename}`);
  }

  // Process images array
  if (Array.isArray(product.images)) {
    for (let i = 0; i < product.images.length; i++) {
      if (typeof product.images[i] === 'string' && product.images[i].startsWith('data:image')) {
        const { ext, buffer } = decodeBase64Image(product.images[i]);
        const filename = `product-${id}-${i}.${ext}`;
        const filePath = path.join(imagesDir, filename);
        fs.writeFileSync(filePath, buffer);
        product.images[i] = `/images/products/${filename}`;
        extractedCount++;
        productUpdated = true;
        console.log(`Extracted images[${i}] for product ${id} -> ${filename}`);
      }
    }
  }

  if (productUpdated) productsUpdated++;
}

if (extractedCount > 0) {
  const newContent = `export const products = ${JSON.stringify(products, null, 2)};\n`;
  fs.writeFileSync(productsPath, newContent);
  console.log(`\nExtraction complete:`);
  console.log(`- Products updated: ${productsUpdated}`);
  console.log(`- Images extracted: ${extractedCount}`);
  console.log(`- Images saved to: ${imagesDir}`);
  console.log(`- products.js updated`);
} else {
  console.log('No base64 images found in products.js');
}
