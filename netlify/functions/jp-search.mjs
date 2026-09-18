import {
  searchCatalog,
  JP_CATEGORIES,
  JP_SUBCATEGORY_CODES,
  JP_YEAR_RANGES,
  JP_SORTS,
} from '../../scripts/jp-catalog.mjs';

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
    return Response.json({ items: [], totalCount: 0, totalApprox: false, page: 1, hasMore: false });
  }

  try {
    const data = await searchCatalog(q, { category, sub, year, sort, page });
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err) {
    return Response.json(
      { items: [], totalCount: 0, totalApprox: false, error: 'catalog_unavailable' },
      { status: 502 }
    );
  }
};
