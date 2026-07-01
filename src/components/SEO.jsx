import { useEffect } from 'react';

export function SEO({
  title = 'Arkya Store',
  description = 'Tienda online con productos exclusivos, ofertas especiales y envíos rápidos.',
  image = 'https://arkya.store/images/logo2.png',
  url = 'https://arkya.store/',
  type = 'website',
  price = null,
  currency = 'ARS',
  availability = 'https://schema.org/InStock',
  keywords = 'artbooks, doujinshi, dōjinshi, manga, mangas, japón, importados, tienda online, anime, novelas ligeras, revistas Jump, figuras, merchandising, japonés, arkya store',
  faqData = null,
}) {
  useEffect(() => {
    // Actualizar title
    document.title = title;

    // Actualizar o crear metadatos
    const updateMeta = (name, content) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const updateProperty = (property, content) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateProperty('og:title', title);
    updateProperty('og:description', description);
    updateProperty('og:image', image);
    updateProperty('og:image:width', '1200');
    updateProperty('og:image:height', '630');
    updateProperty('og:image:type', 'image/webp');
    updateProperty('og:url', url);
    updateProperty('og:type', type);
    updateProperty('og:locale', 'es_AR');
    updateProperty('og:site_name', 'Arkya Store');

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);
    updateMeta('twitter:site', '@arkya.store');

    // Product meta tags
    if (type === 'product' && price !== null) {
      updateProperty('product:price:amount', String(Math.floor(price)));
      updateProperty('product:price:currency', currency);
      updateProperty('product:availability', availability === 'https://schema.org/InStock' ? 'in stock' : 'out of stock');
    }

    // JSON-LD structured data (Schema.org)
    let jsonLdScript = document.querySelector('script[data-seo="jsonld"]');
    if (jsonLdScript) jsonLdScript.remove();

    if (type === 'product' && price !== null) {
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title.replace(' | Arkya Store', ''),
        description,
        image,
        brand: { '@type': 'Brand', name: 'Arkya Store' },
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: currency,
          price: String(Math.floor(price)),
          availability,
          seller: { '@type': 'Organization', name: 'Arkya Store' },
        },
      };
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      jsonLdScript.setAttribute('data-seo', 'jsonld');
      jsonLdScript.textContent = JSON.stringify(productSchema);
      document.head.appendChild(jsonLdScript);
    } else if (type === 'website' && url === 'https://arkya.store/') {
      // Structured data Organization + WebSite para homepage
      const orgSchema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            name: 'Arkya Store',
            url: 'https://arkya.store/',
            logo: 'https://arkya.store/images/logo2.webp',
            description: 'Tienda de artbooks, doujinshi, mangas, guías, novelas ligeras, revistas Jump y merchandising importado de Japón.',
            sameAs: ['https://instagram.com/arkya.store'],
          },
          {
            '@type': 'WebSite',
            url: 'https://arkya.store/',
            name: 'Arkya Store',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://arkya.store/?search={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      };
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      jsonLdScript.setAttribute('data-seo', 'jsonld');
      jsonLdScript.textContent = JSON.stringify(orgSchema);
      document.head.appendChild(jsonLdScript);
    } else if (faqData && Array.isArray(faqData)) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqData.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      jsonLdScript.setAttribute('data-seo', 'jsonld');
      jsonLdScript.textContent = JSON.stringify(faqSchema);
      document.head.appendChild(jsonLdScript);
    }

    // Actualizar canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, image, url, type, price, currency, availability, keywords, faqData]);

  return null;
}
