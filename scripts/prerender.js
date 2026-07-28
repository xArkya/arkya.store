/* eslint-disable */
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://arkya.store';

// Importar slugify para generar slugs amigables
const { getProductSlug } = await import('../src/utils/slugify.js');

// Rutas estáticas
const staticRoutes = [
  { path: '/', title: 'Arkya Store - Artbooks, Doujinshi, Mangas y Revistas Importadas de Japón', description: 'Hacé tu pedido de Artbooks, Dōjinshi (Doujinshi), Mangas, Guías oficiales, Novelas Ligeras, Revistas (Jump, etc.) y merchandising importado desde Japón. Envíos a todo el país. También traemos a pedido.', image: '/images/logo.png', priority: 1.0 },
  { path: '/contacto', title: 'Contacto - Arkya Store', description: 'Contactanos por Instagram para hacer pedidos personalizados de productos importados de Japón.', image: '/images/logo.png', priority: 0.6 },
  { path: '/terminos', title: 'Términos y Condiciones - Arkya Store', description: 'Términos y condiciones de uso de Arkya Store.', image: '/images/logo.png', priority: 0.4 },
  { path: '/preguntas-frecuentes', title: 'Preguntas Frecuentes - Arkya Store', description: 'Respuestas a las preguntas más frecuentes sobre compras, envíos y pedidos personalizados en Arkya Store.', image: '/images/logo.png', priority: 0.5 },
  { path: '/mis-me-gustas', title: 'Mis Me Gustas - Arkya Store', description: 'Tus productos favoritos guardados en Arkya Store.', image: '/images/logo.png', priority: 0.5 },
];

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toAbsoluteUrl(urlOrPath) {
  if (!urlOrPath) return `${BASE_URL}/images/logo.png`;
  if (urlOrPath.startsWith('http')) return urlOrPath;
  return `${BASE_URL}${urlOrPath}`;
}

function injectMetaTags(html, { title, description, image, url, type = 'website', jsonLd = null }) {
  let result = html;

  // Reemplazar <title>
  result = result.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Eliminar meta description existente para evitar duplicados
  result = result.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, '');
  // Eliminar og tags existentes
  result = result.replace(/<meta\s+property="og:[^"]+"\s+content="[^"]*"\s*\/?>/gi, '');
  // Eliminar twitter tags existentes
  result = result.replace(/<meta\s+name="twitter:[^"]+"\s+content="[^"]*"\s*\/?>/gi, '');
  // Eliminar canonical existente
  result = result.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, '');
  // Eliminar last-modified existente
  result = result.replace(/<meta\s+http-equiv="last-modified"\s+content="[^"]*"\s*\/?>/gi, '');
  // Eliminar JSON-LD existente
  result = result.replace(/<script\s+type="application\/ld\+json"[^>]*>.*?<\/script>/gis, '');

  const headEnd = result.indexOf('</head>');
  if (headEnd === -1) return result;

  const now = new Date().toISOString();
  const metaBlock = `
    <meta name="description" content="${escapeHtml(description)}" />
    <meta http-equiv="last-modified" content="${now}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(toAbsoluteUrl(image))}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:locale" content="es_AR" />
    <meta property="og:site_name" content="Arkya Store" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@arkya.store" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(toAbsoluteUrl(image))}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  `;

  result = result.slice(0, headEnd) + metaBlock + result.slice(headEnd);
  return result;
}

function writeHtmlToDir(filePath, html) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, html, 'utf-8');
}

async function prerender() {
  if (!fs.existsSync(INDEX_HTML)) {
    console.error('dist/index.html no existe. Corré "npm run build" primero.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(INDEX_HTML, 'utf-8');

  // Importar datos necesarios antes de los loops
  const { products } = await import('../src/data/products.js');
  const { offers } = await import('../src/data/offers.js');

  // Función para obtener la fecha de vencimiento de oferta de un producto
  function getOfferEndDate(product) {
    const globalOffer = offers.find(o => o.isActive && o.isGlobal);
    if (globalOffer && globalOffer.endDate) return globalOffer.endDate;

    if (product.categories && product.categories.length > 0) {
      for (const cat of product.categories) {
        const catOffer = offers.find(o => !o.isGlobal && o.isActive && o.applicableCategories?.includes(cat));
        if (catOffer && catOffer.endDate) return catOffer.endDate;
      }
    }

    const catOffer = offers.find(o => !o.isGlobal && o.isActive && o.applicableCategories?.includes(product.category));
    if (catOffer && catOffer.endDate) return catOffer.endDate;

    return null;
  }

  // Agregar ItemList al home (productos destacados: primeros 12 en stock)
  const featuredProducts = products
    .filter(p => p.inStock !== false)
    .slice(0, 12)
    .map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        url: `${BASE_URL}/product/${product.id}/`,
        image: toAbsoluteUrl(product.image),
        description: (product.description || product.details || '').trim(),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'ARS',
          price: String(Math.floor(product.price)),
          availability: 'https://schema.org/InStock',
        },
      },
    }));

  // Prerender rutas estáticas
  for (const route of staticRoutes) {
    const url = `${BASE_URL}${route.path}`;
    let jsonLd = null;

    // Home: Organization + WebSite + SearchAction + ItemList
    if (route.path === '/') {
      const homeGraph = [
        {
          '@type': 'Organization',
          name: 'Arkya Store',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/images/logo.png`,
            width: 512,
            height: 512,
          },
          description: 'Tienda online de productos importados de Japón. Artbooks, Doujinshi, Mangas, Revistas y merchandising.',
          sameAs: [
            'https://instagram.com/arkya.store',
          ],
        },
        {
          '@type': 'WebSite',
          url: BASE_URL,
          name: 'Arkya Store',
          description: 'Artbooks, Doujinshi, Mangas y más importados de Japón',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${BASE_URL}/?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
      ];

      if (featuredProducts.length > 0) {
        homeGraph.push({
          '@type': 'ItemList',
          name: 'Productos destacados de Arkya Store',
          itemListElement: featuredProducts,
        });
      }

      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': homeGraph,
      };
    }

    const html = injectMetaTags(baseHtml, {
      title: route.title,
      description: route.description,
      image: route.image,
      url,
      type: 'website',
      jsonLd,
    });

    if (route.path === '/') {
      fs.writeFileSync(INDEX_HTML, html, 'utf-8');
      console.log(`✓ Prerender: / (index.html)`);
    } else {
      const outPath = path.join(DIST_DIR, route.path, 'index.html');
      writeHtmlToDir(outPath, html);
      console.log(`✓ Prerender: ${route.path}`);
    }
  }

  // Prerender productos
  for (const product of products) {
    const slug = getProductSlug(product);
    const productUrlBySlug = `${BASE_URL}/product/${slug}/`;
    const productUrlById = `${BASE_URL}/product/${product.id}/`;
    const priceStr = product.price
      ? `ARS ${Math.floor(product.price).toLocaleString('es-AR')}`
      : '';
    const title = `Comprar ${product.name} | Arkya Store`;
    const rawDescription = (product.description || product.details || 'Descubrí este producto exclusivo en Arkya Store').trim();
    const description = product.price
      ? `${rawDescription} Precio: ${priceStr}. Envíos a todo el país.`
      : `${rawDescription} Envíos a todo el país.`;
    const firstImage = product.images && product.images.length > 0
      ? product.images[0]
      : product.image || '/images/logo.png';
    const image = firstImage;
    const productImages = product.images && product.images.length > 0
      ? product.images.filter(img => img.trim() !== '')
      : [product.image].filter(Boolean);

    const offerEndDate = getOfferEndDate(product);
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: toAbsoluteUrl(firstImage),
      description: rawDescription,
      sku: String(product.id),
      itemCondition: 'https://schema.org/UsedCondition',
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Arkya Store',
      },
      offers: {
        '@type': 'Offer',
        url: productUrlBySlug,
        priceCurrency: 'ARS',
        price: String(Math.floor(product.price)),
        availability: product.inStock !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Arkya Store',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0',
            currency: 'ARS',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'AR',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 3,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 3,
              maxValue: 14,
              unitCode: 'DAY',
            },
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 5,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
          applicableCountry: 'AR',
        },
        ...(offerEndDate ? { priceValidUntil: offerEndDate } : {}),
      },
    };

    const html = injectMetaTags(baseHtml, {
      title,
      description,
      image,
      url: productUrlBySlug,
      type: 'product',
      jsonLd,
    });

    // Generar página con slug amigable (principal para SEO y compartir)
    const outPathBySlug = path.join(DIST_DIR, 'product', slug, 'index.html');
    writeHtmlToDir(outPathBySlug, html);
    console.log(`✓ Prerender: /product/${slug}`);
  }

  console.log('\nPrerender completado. HTML estático generado para todas las rutas.');
}

prerender().catch(err => {
  console.error('Error en prerender:', err);
  process.exit(1);
});
