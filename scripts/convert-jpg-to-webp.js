/* eslint-disable */
/* eslint-env node */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../public/images/products');

async function convertJpgToWebp() {
  try {
    const files = fs.readdirSync(imagesDir);
    const jpgFiles = files.filter(file => file.endsWith('.jpg'));

    console.log(`Found ${jpgFiles.length} JPG files to convert`);

    for (const file of jpgFiles) {
      const inputPath = path.join(imagesDir, file);
      const outputPath = path.join(imagesDir, file.replace('.jpg', '.webp'));

      try {
        await sharp(inputPath)
          .webp({ quality: 85 })
          .toFile(outputPath);
        
        console.log(`✓ Converted: ${file} → ${path.basename(outputPath)}`);
      } catch (error) {
        console.error(`✗ Error converting ${file}:`, error.message);
      }
    }

    console.log('Conversion complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

convertJpgToWebp();
