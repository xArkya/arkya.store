// Registro de búsquedas del catálogo "Importados de Japón".
// Mismo mecanismo que useLikes.js: Google Form + fetch no-cors.
// Reutilizamos el form de los likes — el término va en el campo
// "Producto" y la acción queda marcada como "Busqueda", así en el
// spreadsheet se pueden filtrar aparte. Si algún día querés un form
// dedicado: creás el form, copiás la URL/entry nueva acá y listo.
const SEARCH_LOG_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeTtHuiqiyC8SSsxvGxTR3YjZ71JeEgibmvHIHqPHpZiekonw/formResponse';
const ENTRY_TERM = 'entry.1114527237'; // campo "Producto" del form de likes
const ENTRY_ACTION = 'entry.358415071'; // campo "Acción" → queda "Busqueda"
const ENTRY_EXTRA = 'entry.1004601232'; // campo "Precio" → contexto (categoría)

// context: string opcional con datos extra (ej. la categoría activa)
export function reportCatalogSearch(term, context = '') {
  const t = (term || '').trim();
  if (!t) return;
  try {
    const url = new URL(SEARCH_LOG_FORM_URL);
    url.searchParams.set(ENTRY_TERM, t);
    url.searchParams.set(ENTRY_ACTION, 'Busqueda');
    if (context) url.searchParams.set(ENTRY_EXTRA, context);
    // no-cors: no nos importa la respuesta, solo que llegue el hit
    fetch(url.toString(), { mode: 'no-cors', method: 'GET' }).catch(() => {});
  } catch {
    // el log nunca tiene que romper la búsqueda
  }
}
