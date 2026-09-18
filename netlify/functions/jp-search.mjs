import {
  searchCatalog,
  JP_CATEGORIES,
  JP_SUBCATEGORY_CODES,
  JP_YEAR_RANGES,
  JP_SORTS,
} from '../../scripts/jp-catalog.mjs';

// El sitio principal está en GitHub Pages y llama a esta API cross-origin.
const CORS = { 'Access-Control-Allow-Origin': '*' };

// La function registra su propia ruta: /api/jp-search llega directo acá
// sin depender de los redirects de netlify.toml.
// timeout: deep out-of-stock scans can exceed the 10s default
export const config = { path: '/api/jp-search', timeout: 26 };

export default async (req) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80);
  const category = url.searchParams.get('category') || 'books';
  const sub = url.searchParams.get('sub') || '';
  const year = url.searchParams.get('year') || '';
  const sort = url.searchParams.get('sort') || '';
  const page = Math.min(Math.max(parseInt(url.searchParams.get('page')) || 1, 1), 50);

  const valid =
    (category === 'all' || JP_CATEGORIES[category]) &&
    (!sub || JP_SUBCATEGORY_CODES.has(sub)) &&
    (!year || JP_YEAR_RANGES.includes(year)) &&
    (!sort || JP_SORTS.includes(sort));

  if (!valid) {
    return Response.json(
      { items: [], totalCount: 0, totalApprox: false, page: 1, hasMore: false },
      { headers: CORS }
    );
  }

  try {
    const data = await searchCatalog(q, { category, sub, year, sort, page });
    return Response.json(data, {
      headers: { ...CORS, 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    console.error('[jp-search]', err);
    return Response.json(
      { items: [], totalCount: 0, totalApprox: false, error: 'catalog_unavailable', detail: String(err?.message || err) },
      { status: 502, headers: CORS }
    );
  }
};
