import { fetchImage, hqImageUrl } from '../../scripts/jp-catalog.mjs';

// El sitio principal está en GitHub Pages y carga estas imágenes cross-origin.
const CORS = { 'Access-Control-Allow-Origin': '*' };

// La function registra su propia ruta: /api/jp-image llega directo acá
// sin depender de los redirects de netlify.toml.
export const config = { path: '/api/jp-image' };

export default async (req) => {
  const url = new URL(req.url);
  const u = url.searchParams.get('u') || '';
  const hq = url.searchParams.get('hq') === '1';

  try {
    let img = null;
    if (hq) {
      const hqUrl = hqImageUrl(u);
      if (hqUrl !== u) img = await fetchImage(hqUrl, 0, { follow: false });
    }
    img ||= await fetchImage(u);
    if (!img) return new Response('Not found', { status: 404, headers: CORS });
    return new Response(img.body, {
      headers: {
        ...CORS,
        'Content-Type': img.contentType,
        // La URL es content-addressed por id de producto: se puede cachear fuerte.
        // s-maxage largo = el edge de Netlify sirve las repeticiones sin
        // volver a invocar la function (ahorra créditos)
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable',
      },
    });
  } catch {
    return new Response('Error', { status: 502, headers: CORS });
  }
};
