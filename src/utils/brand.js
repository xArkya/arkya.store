/**
 * Extrae la marca del producto desde nombre/descripción para schema.org.
 * Compartido entre ProductPage.jsx y scripts/prerender.js.
 */
export function extractBrand(product) {
  if (!product) return 'Importado de Japón';
  const text = `${product.name || ''} ${product.description || ''} ${product.details || ''}`;
  const knownBrands = [
    'Bandai', 'Sega', 'Furyu', 'Taito', 'Good Smile Company', 'Kotobukiya',
    'Max Factory', 'Alter', 'Megahouse', 'Banpresto', 'Plex', 'Bellfine',
    'Orange Rouge', 'Aniplex', 'Kadokawa', 'Broccoli', 'Aquamarine',
    'Phat Company', 'FREEing', 'Union Creative', 'Mimeyoi', 'Wing',
    'Native', 'Orchid Seed', 'Alphamax', 'Daiki Kougyou', 'Skytube',
    'Ques Q', 'Amakuni', 'Revolve', 'Stronger', 'Easy Eight',
    'Sentinel', 'Hobby Japan', 'Di molto bene', 'Emontoys',
    'Shueisha', 'Kodansha', 'Square Enix', 'Viz Media', 'Yen Press',
    'Dark Horse', 'Tokyo Pop', 'Panini', 'Ivrea', 'Norma',
    'Medicom Toy', 'Funko', 'Nendoroid', 'Figma', 'SH Figuarts',
    'Robot Spirits', 'Metal Build', 'Model Kit', 'Gunpla',
    'Ichiban Kuji', 'Prize Figure', 'Desktop Cute', 'Coreful',
    'Luminasta', 'AMP', 'Trio-Try-iT', 'Hi-Touch', 'Noodle Stopper',
    'Pop Up Parade', 'Look Up', 'Nendoroid',
  ];
  for (const brand of knownBrands) {
    if (text.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'Importado de Japón';
}
