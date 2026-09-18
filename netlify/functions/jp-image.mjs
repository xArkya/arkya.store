import { fetchImage } from '../../scripts/jp-catalog.mjs';

export default async (req) => {
  const url = new URL(req.url);
  const u = url.searchParams.get('u') || '';

  try {
    const img = await fetchImage(u);
    if (!img) return new Response('Not found', { status: 404 });
    return new Response(img.body, {
      headers: {
        'Content-Type': img.contentType,
        // La URL es content-addressed por id de producto: se puede cachear fuerte
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new Response('Error', { status: 502 });
  }
};
