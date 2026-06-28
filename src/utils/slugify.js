/**
 * Convierte un texto a slug URL-friendly
 * Ej: "One Piece Color Walk 1" -> "one-piece-color-walk-1"
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')     // Reemplazar caracteres no alfanuméricos por guiones
    .replace(/^-+|-+$/g, '')         // Eliminar guiones al inicio/final
    .replace(/--+/g, '-');           // Colapsar múltiples guiones
}

/**
 * Genera un slug único para un producto.
 * Si hay colisión de nombres, agrega un sufijo corto del ID.
 */
export function getProductSlug(product) {
  const base = slugify(product.name);
  const suffix = String(product.id).slice(-4);
  return `${base}-${suffix}`;
}

/**
 * Busca un producto por slug o por ID numérico (compatibilidad hacia atrás).
 */
export function findProductBySlugOrId(slugOrId, productsArray) {
  // Primero intentar buscar por ID numérico (compatibilidad)
  const numericId = parseInt(slugOrId, 10);
  if (!isNaN(numericId)) {
    const byId = productsArray.find(p => p.id === numericId);
    if (byId) return byId;
  }

  // Buscar por slug exacto
  const bySlug = productsArray.find(p => getProductSlug(p) === slugOrId);
  if (bySlug) return bySlug;

  // Buscar por slug base (sin sufijo de ID)
  const byBaseSlug = productsArray.find(p => slugify(p.name) === slugOrId);
  if (byBaseSlug) return byBaseSlug;

  return null;
}
