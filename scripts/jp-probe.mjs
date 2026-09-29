// Probe: cuánto del total del origen cae dentro de los rangos de año que
// usa el crawler (los items sin release_year no matchean ningún split).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchProductsHtml, parseTotal } from './jp-catalog.mjs';
import { JP_YEAR_RANGES } from '../src/data/jpCatalogFilters.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const CODE = process.argv[2] || '11000100';
const PRICE = process.argv[3] || '649-';
const YEAR = process.argv[4] || '';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const get = async (opts) => {
  const html = await fetchProductsHtml(CODE, '', { page: 1, includeOos: true, lang: 'en', ...opts });
  const { count, text } = parseTotal(html);
  return { count, text, html };
};

// Si se pasa un año, medir cuántas páginas reales muestra el listado vs el
// total reportado (detecta inflación del "over N" del origen).
if (YEAR) {
  const r = await get({ price: PRICE, year: YEAR });
  console.log(`total reportado ${CODE} price=${PRICE} year=${YEAR}: ${r.count} ("${r.text}")`);
  let realItems = 0;
  for (let pg = 1; pg <= 6; pg++) {
    const html = await fetchProductsHtml(CODE, '', {
      page: pg, includeOos: true, lang: 'en', price: PRICE, year: YEAR,
      sort: 'released_date_desc',
    });
    const raw = (html.match(/class="product_wrap"/g) || []).length;
    realItems += raw;
    console.log(`  página ${pg}: ${raw} items`);
    if (raw < 24) break;
    await delay(400);
  }
  console.log(`items realmente visibles: ~${realItems}`);
  process.exit(0);
}

const base = await get({ price: PRICE });
console.log(`total ${CODE} price=${PRICE}: ${base.count} ("${base.text}")`);

let sumYears = 0;
for (const y of JP_YEAR_RANGES) {
  const r = await get({ price: PRICE, year: y });
  console.log(`  year ${y}: ${r.count}`);
  sumYears += r.count || 0;
  await delay(400);
}
console.log(`suma por años: ${sumYears} | sin-año estimado: ${base.count - sumYears}`);

// bandas de precio sin filtro de año, para ver cobertura por precio
const BANDS = ['649-700', '701-1200', '1201-2500', '2501-5000', '5001-'];
let sumPrice = 0;
for (const p of BANDS) {
  const r = await get({ price: p });
  console.log(`  price ${p}: ${r.count}`);
  sumPrice += r.count || 0;
  await delay(400);
}
console.log(`suma por bandas: ${sumPrice} | fuera-de-precio estimado: ${base.count - sumPrice}`);
