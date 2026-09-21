// Servidor standalone del catálogo japonés: expone /api/jp-search y
// /api/jp-image sin depender de Netlify ni del middleware de Vite.
//
// Sirve para hostear la API desde cualquier máquina con IP residencial
// (Suruga-ya bloquea datacenters: AWS, Netlify, Cloudflare Workers).
// Para exponerlo a internet sin abrir puertos: `cloudflared tunnel
// --url http://localhost:3100` y usar la URL generada como VITE_JP_API_URL.
//
// Uso:  node scripts/jp-server.mjs [puerto]   (default 3100)

import { createServer } from 'node:http';
import { searchCatalog, fetchImage, JP_CATEGORIES, JP_SUBCATEGORY_CODES, JP_YEAR_RANGES, JP_SORTS } from './jp-catalog.mjs';

const PORT = Number(process.argv[2]) || 3100;
const CORS = { 'Access-Control-Allow-Origin': '*' };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const json = (data, status = 200, headers = {}) => {
    res.writeHead(status, { ...CORS, 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify(data));
  };

  try {
    if (url.pathname === '/api/jp-search') {
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
      if (!valid) return json({ items: [], totalCount: 0, totalApprox: false, page: 1, hasMore: false });

      const data = await searchCatalog(q, { category, sub, year, sort, page });
      return json(data, 200, { 'Cache-Control': 'public, max-age=60' });
    }

    if (url.pathname === '/api/jp-image') {
      const img = await fetchImage(url.searchParams.get('u') || '');
      if (!img) {
        res.writeHead(404, CORS);
        return res.end('Not found');
      }
      res.writeHead(200, {
        ...CORS,
        'Content-Type': img.contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      });
      return res.end(img.body);
    }

    if (url.pathname === '/health') return json({ ok: true });

    res.writeHead(404, CORS);
    res.end('Not found');
  } catch (err) {
    console.error('[jp-server]', url.pathname, err?.message || err);
    json({ items: [], totalCount: 0, totalApprox: false, error: 'catalog_unavailable' }, 502);
  }
});

server.listen(PORT, () => {
  console.log(`[jp-server] escuchando en http://localhost:${PORT}`);
  console.log('Para exponerlo: cloudflared tunnel --url http://localhost:' + PORT);
});
