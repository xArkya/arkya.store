import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../src/data/products.js';

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function getProductSlug(product) {
  const base = slugify(product.name);
  const suffix = String(product.id).slice(-4);
  return `${base}-${suffix}`;
}

function extractBrand(product) {
  const name = product.name.toLowerCase();
  const brands = [
    'one piece', 'naruto', 'bleach', 'dragon ball', 'my hero academia',
    'demon slayer', 'jujutsu kaisen', 'attack on titan', 'evangelion',
    'fate', 'persona', 'nier', 'final fantasy', 'kingdom hearts',
    'pokemon', 'zelda', 'mario', 'kirby', 'fire emblem',
    'spy x family', 'chainsaw man', 'kaguya-sama', 'quintessential quintuplets',
    're zero', 'overlord', 'konosuba', 'sword art online', 'date a live',
    'oregairu', ' Classroom', 'monogatari', 'madoka magica', 'steins;gate',
    'holo', 'sailor moon', 'cardcaptor sakura', 'clamp', 'fullmetal alchemist',
    'hunter x hunter', 'jjk', 'bnha', 'aot', 'snk', 'hxh', 'fma',
  ];

  for (const brand of brands) {
    if (name.includes(brand.toLowerCase())) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }

  if (product.categories && product.categories.length > 0) {
    return product.categories[0];
  }

  return 'Arkya Store';
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://arkya.store';

function generateMerchantFeed() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n';
  xml += '  <channel>\n';
  xml += `    <title>Arkya Store - Product Feed</title>\n`;
  xml += `    <link>${baseUrl}</link>\n`;
  xml += `    <description>Productos importados de Japón - Artbooks, Doujinshi, Mangas, Guías, Novelas Ligeras, Revistas Jump y Merchandising</description>\n`;

  products.forEach(product => {
    const productSlug = getProductSlug(product);
    const productUrl = `${baseUrl}/product/${productSlug}`;
    const imageUrl = product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`;
    const brand = extractBrand(product);
    const categoryText = product.categories?.[0] || 'Artbooks';
    const googleCategory = mapToGoogleCategory(categoryText);
    const description = product.description || product.details || `${product.name}. ${categoryText} importado de Japón. Disponible en Arkya Store.`;
    const availability = product.inStock !== false ? 'in_stock' : 'out_of_stock';
    const price = product.price ? `${product.price} ARS` : '0 ARS';

    xml += '    <item>\n';
    xml += `      <g:id>${product.id}</g:id>\n`;
    xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`;
    xml += `      <g:description>${escapeXml(description.trim())}</g:description>\n`;
    xml += `      <g:link>${productUrl}</g:link>\n`;
    xml += `      <g:image_link>${imageUrl}</g:image_link>\n`;

    // Imágenes adicionales
    if (product.images && product.images.length > 1) {
      product.images.slice(1, 5).forEach(img => {
        const additionalImageUrl = img.startsWith('http') ? img : `${baseUrl}${img}`;
        xml += `      <g:additional_image_link>${additionalImageUrl}</g:additional_image_link>\n`;
      });
    }

    xml += `      <g:condition>new</g:condition>\n`;
    xml += `      <g:availability>${availability}</g:availability>\n`;
    xml += `      <g:price>${price}</g:price>\n`;
    xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`;
    xml += `      <g:google_product_category>${googleCategory}</g:google_product_category>\n`;
    xml += `      <g:product_type>${escapeXml(categoryText)}</g:product_type>\n`;
    xml += `      <g:identifier_exists>yes</g:identifier_exists>\n`;
    xml += `      <g:mpn>${product.id}</g:mpn>\n`;

    // Envío
    xml += `      <g:shipping>\n`;
    xml += `        <g:country>AR</g:country>\n`;
    xml += `        <g:service>Standard</g:service>\n`;
    xml += `        <g:price>0 ARS</g:price>\n`;
    xml += `      </g:shipping>\n`;

    // Política de devoluciones
    xml += `      <g:return_policy_link>${baseUrl}/devoluciones</g:return_policy_link>\n`;

    xml += '    </item>\n';
  });

  xml += '  </channel>\n';
  xml += '</rss>';

  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const feedPath = path.join(publicDir, 'google-merchant-feed.xml');
  fs.writeFileSync(feedPath, xml);
  console.log(`✓ Feed de Merchant Center generado: ${products.length} productos en ${feedPath}`);
}

function mapToGoogleCategory(category) {
  const categoryMap = {
    'Artbooks': '784 > 784_5476',
    'Figuras': '784 > 784_8550',
    'Mangas': '784 > 784_6040',
    'Revistas': '783 > 783_5405',
    'Doujinshis': '784 > 784_6040',
    'Guide Books': '784 > 784_5476',
    'Character Books': '784 > 784_5476',
    'Cartas': '784 > 784_8550',
    'CD/DVD': '783 > 783_5385',
    'Novela Ligera': '784 > 784_5476',
    'Peluches': '784 > 784_8550',
  };

  return categoryMap[category] || '784';
}

generateMerchantFeed();
