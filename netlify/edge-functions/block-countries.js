// Netlify Edge Function — Bloquear acceso desde India (IN) y Rusia (RU)
export default async (request, context) => {
  const country = context.geo?.country?.code;
  const blockedCountries = ['IN', 'RU'];

  if (country && blockedCountries.includes(country)) {
    return new Response(
      '<!DOCTYPE html><html><head><title>Access Denied</title></head><body><h1>403 Forbidden</h1><p>Access to this site is not available from your region.</p></body></html>',
      {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  return context.next();
};
