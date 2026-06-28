import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../src/data/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://arkya.store';

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  const today = new Date().toISOString().split('T')[0];

  // URL principal
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // URLs estáticas del sitio
  const staticRoutes = [
    { path: '/contacto', priority: '0.6' },
    { path: '/terminos', priority: '0.4' },
    { path: '/preguntas-frecuentes', priority: '0.5' },
    { path: '/mis-me-gustas', priority: '0.5' },
  ];

  staticRoutes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  // URLs de categorías (para SEO de palabras clave como "artbooks japon", "revistas japonesas")
  const categoryRoutes = [
    { path: '/?category=artbooks', name: 'Artbooks' },
    { path: '/?category=figuras', name: 'Figuras' },
    { path: '/?category=mangas', name: 'Mangas' },
    { path: '/?category=revistas', name: 'Revistas' },
    { path: '/?category=doujinshis', name: 'Doujinshis' },
    { path: '/?category=guide-books', name: 'Guide Books' },
    { path: '/?category=character-books', name: 'Character Books' },
    { path: '/?category=cartas', name: 'Cartas' },
    { path: '/?category=cd-dvd', name: 'CD/DVD' },
    { path: '/?category=novela-ligera', name: 'Novela Ligera' },
    { path: '/?category=peluches', name: 'Peluches' },
  ];

  categoryRoutes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';
  });

  // URLs de productos
  products.forEach(product => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/product/${product.id}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    // Image sitemap: imagen principal del producto
    if (product.image) {
      const imageUrl = product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`;
      xml += '    <image:image>\n';
      xml += `      <image:loc>${imageUrl}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(product.name)}</image:title>\n`;
      if (product.description) {
        xml += `      <image:caption>${escapeXml(product.description.split('\n')[0])}</image:caption>\n`;
      }
      xml += '    </image:image>\n';
    }
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml);
  console.log(`✓ Sitemap generado: ${products.length} productos indexados en ${sitemapPath}`);
}

generateSitemap();
