/* eslint-disable */
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, '../src/data/products.js');
const imagesDir = path.join(__dirname, '../public/images/products');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Read the products file
let productsContent = fs.readFileSync(productsPath, 'utf-8');

// Track replacements
let replacements = [];

// Function to extract base64 and save as file
function extractAndSaveBase64(base64String, productId, index) {
  try {
    // Determine the format
    const isWebP = base64String.includes('data:image/webp');
    const isJpeg = base64String.includes('data:image/jpeg');
    
    // Extract the base64 data
    const base64Data = base64String.split(',')[1];
    if (!base64Data) {
      console.error(`Invalid base64 format for product ${productId} image ${index}`);
      return null;
    }
    
    // Determine file extension
    const ext = isWebP ? 'webp' : isJpeg ? 'jpg' : 'png';
    
    // Create filename
    const filename = `product-${productId}-${index}.${ext}`;
    const filepath = path.join(imagesDir, filename);
    
    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    console.log(`✓ Extracted: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
    
    return `/images/products/${filename}`;
  } catch (error) {
    console.error(`Error extracting image for product ${productId}:`, error.message);
    return null;
  }
}

// Parse products and extract base64 images
const productsMatch = productsContent.match(/export const products = \[([\s\S]*)\];/);
if (!productsMatch) {
  console.error('Could not find products array');
  process.exit(1);
}

// Split by product objects to process each one
const productRegex = /\{\s*"name":[^}]*?"id":\s*(\d+)[^}]*?\}/gs;
const replacementMap = new Map();

// Process each product
let productMatch;
while ((productMatch = productRegex.exec(productsContent)) !== null) {
  const productId = productMatch[1];
  const productText = productMatch[0];
  
  // Find all base64 strings in this product
  const base64InProduct = /["']?(data:image\/[^"']+)["']?/g;
  let base64Match;
  let imageIndex = 0;
  
  while ((base64Match = base64InProduct.exec(productText)) !== null) {
    const base64String = base64Match[1];
    const fullMatch = base64Match[0];
    
    if (!replacementMap.has(fullMatch)) {
      // Extract and save the image
      const newPath = extractAndSaveBase64(base64String, productId, imageIndex);
      
      if (newPath) {
        replacementMap.set(fullMatch, `"${newPath}"`);
        replacements.push({
          productId,
          imageIndex,
          oldPath: base64String.substring(0, 50) + '...',
          newPath
        });
        imageIndex++;
      }
    }
  }
}

// Apply replacements
let updatedContent = productsContent;
replacementMap.forEach((newValue, oldValue) => {
  updatedContent = updatedContent.replaceAll(oldValue, newValue);
});

// Write the updated products file
fs.writeFileSync(productsPath, updatedContent, 'utf-8');

console.log('\n✓ Successfully updated products.js');
console.log(`\nSummary:`);
console.log(`- Extracted ${replacementMap.size} images`);
console.log(`- Updated ${replacementMap.size} references`);
if (replacements.length > 0) {
  console.log(`\nFirst 10 replacements:`);
  replacements.slice(0, 10).forEach(r => {
    console.log(`  Product ${r.productId}: ${r.newPath}`);
  });
  if (replacements.length > 10) {
    console.log(`  ... and ${replacements.length - 10} more`);
  }
}
