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

    // Actualizar canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, image, url, type, price, currency, availability]);

  return null;
}
