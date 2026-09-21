// Fetcher del catálogo externo de libros/doujin.
// El sitio origen está detrás de Cloudflare, que bloquea el TLS fingerprint
// de Node (fetch/https dan 403) pero deja pasar curl. Por eso las requests
// se hacen via child_process + curl: primero se pide la home para obtener
// cookies de sesión y luego se consulta /en/products?category=...&keyword=...
// con headers de navegador.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  JP_SUBCATEGORY_CODES,
  JP_YEAR_RANGES,
} from '../src/data/jpCatalogFilters.js';

export { JP_SUBCATEGORY_CODES, JP_YEAR_RANGES };

const execFileAsync = promisify(execFile);

const BASE = 'https://www.suruga-ya.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const COOKIE_JAR = join(tmpdir(), 'jp-catalog-cookies.txt');
const COOKIE_TTL = 4 * 60 * 1000;

// Suruga-ya bloquea por IP las requests desde datacenters (verificado:
// hasta con fingerprint de Chrome vía CycleTLS devuelve 403 desde AWS).
// Para producción hace falta un proxy residencial: setear JP_PROXY con
// la URL del proxy (http://user:pass@host:port, también soporta socks5://).
// Solo se usa para los requests al sitio — el CDN de imágenes responde
// directo desde datacenter, así no gasta bandwidth del proxy.
// Se leen lazy (dentro de cada request) porque los callers cargan
// .env.local DESPUÉS de importar este módulo — leerlos acá arriba haría
// que las variables del archivo nunca lleguen.
const getProxy = () => process.env.JP_PROXY || '';

// Bypass manual del challenge de Cloudflare: si la IP quedó flaggeada
// (checkbox interactivo), se puede resolver el challenge en el navegador y
// pasar la cookie cf_clearance al crawler:
//   JP_COOKIE  -> "cf_clearance=<valor>"  (devtools > Application > Cookies)
//   JP_UA      -> navigator.userAgent del MISMO navegador (la cookie está
//                 atada a IP + User-Agent exacto; con otro UA no sirve)
// Ojo: cf_clearance expira (típicamente ~30-60 min) — si vuelven los 403
// hay que refrescarla repitiendo el procedimiento.
// Acepta tanto "cf_clearance=<valor>" como el valor pelado (le agrega el
// nombre de la cookie — curl trata un -b sin '=' como nombre de archivo).
const getCookie = () => {
  const c = process.env.JP_COOKIE || '';
  return c && !c.includes('=') ? `cf_clearance=${c}` : c;
};
const getUa = () => process.env.JP_UA || UA;

export const JP_CATEGORIES = { books: '7', doujin: '11' };

// Ordenamientos que expone el sitio origen (param sort)
export const JP_SORTS = ['relevant', 'released_date_desc', 'released_date_asc'];

let cookieReadyAt = 0;
let sessionPromise = null;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function curlGet(url) {
  const args = [
    '-sS',
    '-L',
    '--max-time',
    '15',
    ...(getProxy() ? ['-x', getProxy()] : []),
    '-A',
    getUa(),
    '-H',
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8',
    '-H',
    'Accept-Language: en-US,en;q=0.9',
    '-H',
    `Referer: ${BASE}/en`,
    '-c',
    COOKIE_JAR,
    '-b',
    getCookie() || COOKIE_JAR,
    '-w',
    '\n%{http_code}',
    url,
  ];
  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 16 * 1024 * 1024 });
  const status = Number(stdout.slice(stdout.lastIndexOf('\n') + 1).trim()) || 0;
  return { status, html: stdout.slice(0, stdout.lastIndexOf('\n')) };
}

// Serializa los refreshes de sesión para que requests en paralelo no
// pisen el cookie jar entre sí.
async function ensureSession(force = false) {
  if (!force && Date.now() < cookieReadyAt) return;
  if (!sessionPromise) {
    sessionPromise = curlGet(`${BASE}/en`)
      .then(() => {
        cookieReadyAt = Date.now() + COOKIE_TTL;
      })
      .finally(() => {
        sessionPromise = null;
      });
  }
  await sessionPromise;
}

function isChallenge(status, html) {
  return (
    status === 403 ||
    html.includes('challenges.cloudflare.com') ||
    html.includes('Just a moment') ||
    // Página anti-bot de meta-refresh ("Redirecting to..."): no es un
    // challenge de CF pero hay que reintentarla con sesión refrescada
    html.includes('http-equiv="refresh"') ||
    html.includes('Redirecting to')
  );
}

const ALLOWED_IMG_HOST = 'https://cdn.suruga-ya.com/';

// El CDN sirve la versión grande de cada imagen en
// database/pics_webp/game/<id>.jpg.webp — 'game' es el bucket genérico del
// CDN, no solo juegos (verificado: manga/libros/revistas resuelven ahí).
// Si el archivo no existe el CDN responde 302 al dominio viejo (detrás de
// Cloudflare) — con follow:false ese 302 falla rápido y se cae al thumb.
export function hqImageUrl(thumbUrl) {
  return thumbUrl.replace(
    /pics_webp\/boxart_m\/(\d+)m\.jpg\.webp$/,
    'database/pics_webp/game/$1.jpg.webp'
  );
}

export async function fetchImage(imageUrl, attempt = 0, { follow = true } = {}) {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith(ALLOWED_IMG_HOST)) {
    return null;
  }
  const { stdout } = await execFileAsync(
    'curl',
    [
      '-sS',
      ...(follow ? ['-L'] : []),
      '--max-time',
      '15',
      '-A',
      UA,
      '-H',
      `Referer: ${BASE}/en`,
      '-w',
      '\n%{http_code} %{content_type}',
      imageUrl,
    ],
    { maxBuffer: 8 * 1024 * 1024, encoding: 'buffer' }
  );
  const tail = stdout.slice(stdout.lastIndexOf('\n') + 1).toString('utf-8').trim();
  const [statusStr, contentType] = tail.split(' ');
  if (Number(statusStr) !== 200) {
    // Un 302 en el CDN significa "no existe ese webp acá" (apunta al
    // dominio viejo detrás de CF): no reintentar, salir rápido.
    if (Number(statusStr) === 302) return null;
    if (attempt < 2) {
      await delay(400);
      return fetchImage(imageUrl, attempt + 1, { follow });
    }
    return null;
  }
  return {
    body: stdout.slice(0, stdout.lastIndexOf('\n')),
    contentType: contentType || 'image/webp',
  };
}

export async function fetchProductsHtml(categoryId, keyword, { page = 1, year = '', price = '', sort = '', includeOos = true, lang = 'en' } = {}, attempt = 0) {
  await ensureSession(attempt > 0);
  // Sin in_stock=t el origen devuelve SOLO items con stock; con in_stock=t
  // devuelve todo (con stock + sin stock mezclados).
  // lang: 'en' (títulos romanizados) o 'ja' (títulos en japonés real).
  // price: rango estilo "501-1000" / "-500" / "5001-" — incluye sin-stock
  // (el origen recuerda el último precio conocido).
  let url = `${BASE}/${lang}/products?category=${categoryId}&keyword=${encodeURIComponent(keyword)}`;
  if (includeOos) url += '&in_stock=t';
  if (page > 1) url += `&page=${page}`;
  if (year) url += `&release_year=${encodeURIComponent(year)}`;
  if (price) url += `&price=${encodeURIComponent(price)}`;
  if (sort && sort !== 'relevant') url += `&sort=${sort}`;
  const { status, html } = await curlGet(url);
  if (isChallenge(status, html)) {
    if (attempt < 3) {
      await delay(400 * (attempt + 1));
      return fetchProductsHtml(categoryId, keyword, { page, year, sort, includeOos, price, lang }, attempt + 1);
    }
    throw new Error(`Upstream catalog blocked the request (status ${status})`);
  }
  return html;
}

function decodeEntities(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function parseProducts(html) {
  return html
    .split('class="product_wrap"')
    .slice(1)
    .map((block) => {
      const infoMatch = block.match(/data-info="([^"]*)"/);
      // data-src primero (lazy-load: el src es un placeholder), src después
      const imgMatch = block.match(/<img[^>]+data-src="([^"]+)"/) || block.match(/<img[^>]+src="([^"]+)"/);
      // no_photo.jpg es el placeholder del origen — el listado lo muestra
      // aunque el CDN tenga el thumb (típico en sin-stock): abajo se deriva
      // del id, el archivo es siempre <id lowercase>m.jpg.webp
      let imgUrl = imgMatch && !/no_photo/.test(imgMatch[1]) ? imgMatch[1] : null;

      let info = {};
      if (infoMatch) {
        try {
          info = JSON.parse(decodeEntities(infoMatch[1]));
        } catch {
          info = {};
        }
      }
      if (!imgUrl && info.id) {
        imgUrl = `https://cdn.suruga-ya.com/pics_webp/boxart_m/${String(info.id).toLowerCase()}m.jpg.webp`;
      }

      const priceMatch = block.match(/data-price="(\d+)"/);
      // La fecha sale como "Released date: 15 Sep 2025" (en) o
      // "発売日: 2012/11/24" (ja)
      const dateMatch = block.match(/Released date:\s*([^<]+)|発売日[:：]\s*([^<]+)/);

      return {
        id: info.id || null,
        title: decodeEntities(info.name || ''),
        // URL directa del CDN (el front la sirve sin proxy)
        image: imgUrl,
        // "Out of stock" (en) / 品切れ (ja)
        inStock: !block.includes('Out of stock') && !block.includes('品切れ'),
        price: priceMatch ? Number(priceMatch[1]) : null,
        releaseDate: dateMatch ? (dateMatch[1] || dateMatch[2]).trim() : null,
      };
    })
    .filter((p) => p.id && p.title);
}

const PAGE_SIZE = 24;

export function parseTotal(html) {
  const m = html.match(/alert-total-products[^>]*>([\s\S]*?)</);
  const text = m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : null;
  // en: "of (over )?N results" — ja: "該当件数:N件中"
  const countMatch =
    text && (text.match(/of (?:over )?([\d,]+) results/) || text.match(/該当件数[:：]\s*([\d,]+)/));
  return {
    text,
    count: countMatch ? Number(countMatch[1].replace(/,/g, '')) : null,
  };
}

// Paginación global con "con stock primero, sin stock al final":
// el origen expone un stream SOLO con stock (sin in_stock=t) que se puede
// paginar libremente, y un stream completo (in_stock=t) donde los sin-stock
// vienen mezclados. Entonces el listado virtual es:
//   [items del stream con-stock] ++ [items sin-stock del stream completo]
// Ambos se van pidiendo por demanda según la página pedida y se cachean.
const RESULTS_TTL = 6 * 60 * 1000;
const SCAN_PAGES_PER_CALL = 30; // tope de páginas del stream completo por request
const SCAN_CONCURRENCY = 3;
const streamCache = new Map();

function getStream(key) {
  const entry = streamCache.get(key);
  if (entry && Date.now() - entry.at <= RESULTS_TTL) return entry.value;
  streamCache.delete(key);
  const value = {
    inStockPages: new Map(), // página -> items[] del stream con-stock
    inStockCount: null,      // total reportado por el stream con-stock
    inStockApprox: false,
    oosItems: [],            // items sin-stock ya recolectados, en orden
    scannedAllPages: 0,      // cuántas páginas del stream completo se pidieron
    allTotal: null,          // total reportado por el stream completo
    allApprox: false,
    allTotalPages: null,
    allExhausted: false,     // no quedan más páginas del stream completo
  };
  if (streamCache.size > 60) streamCache.delete(streamCache.keys().next().value);
  streamCache.set(key, { at: Date.now(), value });
  return value;
}

async function ensureInStockPage(categoryId, keyword, opts, st, pg) {
  if (!st.inStockPages.has(pg)) {
    const html = await fetchProductsHtml(categoryId, keyword, { ...opts, page: pg, includeOos: false });
    st.inStockPages.set(pg, parseProducts(html));
    if (st.inStockCount == null) {
      const { count, approx } = parseTotal(html);
      st.inStockCount = count ?? st.inStockPages.get(pg).length;
      st.inStockApprox = approx;
    }
  }
  return st.inStockPages.get(pg);
}

// Pide páginas del stream completo (en chunks paralelos) y va acumulando los
// items sin-stock, hasta tener `needed` o agotar el stream / el presupuesto.
// Si una página falla se reintenta en la próxima llamada (no se marca como
// agotado: los resultados se agregan en orden estricto de página).
async function scanOos(categoryId, keyword, opts, st, needed) {
  let budget = SCAN_PAGES_PER_CALL;
  while (!st.allExhausted && st.oosItems.length < needed && budget > 0) {
    const pages = [];
    while (
      pages.length < SCAN_CONCURRENCY &&
      budget > 0 &&
      (st.allTotalPages == null || st.scannedAllPages + pages.length < st.allTotalPages)
    ) {
      pages.push(st.scannedAllPages + pages.length + 1);
      budget--;
    }
    if (!pages.length) break;

    const results = await Promise.all(
      pages.map((pg) =>
        fetchProductsHtml(categoryId, keyword, { ...opts, page: pg, includeOos: true })
          .then((html) => ({ pg, html }))
          .catch(() => ({ pg, html: null }))
      )
    );

    for (const { pg, html } of results) {
      if (html == null) return; // se reintenta desde esta página la próxima vez
      st.scannedAllPages = pg;
      const items = parseProducts(html);
      if (pg === 1) {
        const { count, approx } = parseTotal(html);
        st.allTotal = count;
        st.allApprox = approx;
        st.allTotalPages = count != null ? Math.ceil(count / PAGE_SIZE) : null;
      }
      st.oosItems.push(...items.filter((p) => !p.inStock));
      // El fin del stream se detecta por los bloques HTML crudos: parseProducts
      // descarta items sin id/título y no puede usarse para este chequeo.
      const rawCount = (html.match(/class="product_wrap"/g) || []).length;
      // El stream puede traer páginas con menos de 24 productos sin ser la
      // última: solo se considera agotado con una página vacía o al llegar
      // a la última página reportada por el origen.
      if (rawCount === 0 || (st.allTotalPages != null && pg >= st.allTotalPages)) {
        st.allExhausted = true;
        break;
      }
    }
  }
}

// Traducción de títulos en japonés -> inglés. Best-effort con cadena de
// fallbacks (Google gtx suele devolver 429 por rate limit):
//   1) Google Translate client=gtx — una request traduce toda la página
//   2) endpoint de la extensión de Chrome (dict-chrome-ex), cuota separada
//   3) MyMemory — cuota diaria baja, por eso queda último
// Si todo falla quedan los títulos originales.
const JP_CHAR = /[぀-ヿ㐀-䶿一-鿿]/;
const translateCache = new Map();

async function curlJson(url) {
  // Se usa curl porque el fetch de Node es detectado/bloqueado por Google.
  const { stdout } = await execFileAsync(
    'curl',
    ['-sS', '--max-time', '8', '-A', UA, '-w', '\n%{http_code}', url],
    { maxBuffer: 4 * 1024 * 1024 }
  );
  const status = Number(stdout.slice(stdout.lastIndexOf('\n') + 1).trim()) || 0;
  if (status !== 200) throw new Error(`HTTP ${status}`);
  return JSON.parse(stdout.slice(0, stdout.lastIndexOf('\n')));
}

async function translateBatch(titles) {
  const errors = [];
  // gtx: los títulos se unen con \n y el segmento devuelto conserva las
  // líneas, así una sola request traduce toda la página de resultados.
  // dt=rm agrega la romanización (lectura fonética) — clave para que el
  // usuario encuentre "jujutsu kaisen" escribiéndolo en latín.
  try {
    const data = await curlJson(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&dt=rm&q=${encodeURIComponent(titles.join('\n'))}`
    );
    const en = (data?.[0] || []).map((seg) => seg?.[0]).filter(Boolean).join('').split('\n');
    const romaji = (data?.[1] || []).map((seg) => seg?.[3]).filter(Boolean).join('').split('\n');
    return { en, romaji };
  } catch (err) {
    errors.push(`gtx ${err.message}`);
  }
  // dict-chrome-ex: acepta un q= por título y devuelve un array ordenado.
  try {
    const qs = titles.map((t) => `q=${encodeURIComponent(t)}`).join('&');
    const data = await curlJson(
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ja&tl=en&${qs}`
    );
    if (Array.isArray(data)) return { en: data.map(String), romaji: [] };
    throw new Error('unexpected response');
  } catch (err) {
    errors.push(`dict-chrome-ex ${err.message}`);
  }
  // MyMemory: un request por título, en chunks de 6 en paralelo.
  try {
    const out = new Array(titles.length).fill(null);
    for (let i = 0; i < titles.length; i += 6) {
      await Promise.all(
        titles.slice(i, i + 6).map((t, j) =>
          curlJson(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=ja|en`
          )
            .then((d) => {
              out[i + j] = d?.responseData?.translatedText || null;
            })
            .catch(() => {})
        )
      );
    }
    if (out.every((x) => x == null)) throw new Error('no translations');
    return { en: out, romaji: [] };
  } catch (err) {
    errors.push(`mymemory ${err.message}`);
  }
  throw new Error(errors.join(' | '));
}

// Quita macrons/diacriticos del romaji (Tarō -> Taro) para que matchee
// lo que el usuario tipea con teclado común.
const stripMarks = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Devuelve { en: [...], romaji: [...] } alineados por índice con `titles`.
// Los títulos sin japonés pasan intactos en `en` y sin romaji.
export async function translateTitles(titles) {
  const pending = titles.filter((t) => JP_CHAR.test(t) && !translateCache.has(t));
  if (pending.length) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { en, romaji } = await translateBatch(pending);
        pending.forEach((t, i) => {
          if (en[i]) {
            translateCache.set(t, {
              en: en[i].trim(),
              romaji: romaji[i] ? stripMarks(romaji[i].trim()) : null,
            });
          }
        });
        break;
      } catch (err) {
        if (attempt === 1) console.error('[jp-translate]', err.message);
        else await delay(500);
      }
    }
    if (translateCache.size > 3000) translateCache.delete(translateCache.keys().next().value);
  }
  const en = [];
  const romaji = [];
  titles.forEach((t, i) => {
    const hit = translateCache.get(t);
    en[i] = hit?.en || t;
    romaji[i] = hit?.romaji || null;
  });
  return { en, romaji };
}

export async function searchCatalog(keyword, { category = 'all', sub = '', year = '', sort = '', page = 1 } = {}) {
  let ids;
  if (sub && JP_SUBCATEGORY_CODES.has(sub)) {
    // Una subcategoría pertenece a una sola categoría padre: un solo request
    ids = [sub];
  } else {
    ids =
      category === 'all'
        ? Object.values(JP_CATEGORIES)
        : [JP_CATEGORIES[category]].filter(Boolean);
  }

  const empty = { items: [], totalCount: 0, totalApprox: false, page, hasMore: false };
  if (!ids.length) return empty;

  const opts = { year, sort };
  const s = (page - 1) * PAGE_SIZE;
  const e = s + PAGE_SIZE;
  const items = [];
  const states = ids.map((id) => ({
    id,
    st: getStream(`${id}|${keyword}|${year}|${sort}`),
  }));

  // Región con-stock: [0, totalIn) — página `page` del stream con-stock de
  // cada categoría (mismo tamaño de página => los rangos quedan alineados).
  await Promise.all(states.map(({ id, st }) => ensureInStockPage(id, keyword, opts, st, 1)));

  let totalIn = 0;
  for (const { id, st } of states) {
    const Ki = st.inStockCount;
    const a = Math.max(s, totalIn);
    const b = Math.min(e, totalIn + Ki);
    if (a < b) {
      const p1 = Math.floor((a - totalIn) / PAGE_SIZE) + 1;
      const p2 = Math.floor((b - 1 - totalIn) / PAGE_SIZE) + 1;
      for (let pg = p1; pg <= p2; pg++) {
        const list = await ensureInStockPage(id, keyword, opts, st, pg);
        items.push(...list.slice(a - totalIn - (pg - 1) * PAGE_SIZE, b - totalIn - (pg - 1) * PAGE_SIZE));
      }
    }
    totalIn += Ki;
  }

  // Región sin-stock: [totalIn, ...) — items sin-stock del stream completo,
  // recolectados por demanda. allTotal de cada categoría se conoce tras
  // pedir su página 1.
  if (e > totalIn) {
    await Promise.all(
      states.map(({ id, st }) => (st.allTotal != null || st.allExhausted ? null : scanOos(id, keyword, opts, st, 1)))
    );
    let segStart = totalIn;
    for (const { id, st } of states) {
      // Estimación del tamaño de la región sin-stock: lo realmente
      // recolectado si ya se agotó el stream, si no el total reportado.
      const oosTotal = st.allExhausted
        ? st.oosItems.length
        : st.allTotal != null
          ? Math.max(0, st.allTotal - st.inStockCount)
          : Number.MAX_SAFE_INTEGER;
      const a = Math.max(s, segStart);
      const b = Math.min(e, segStart + oosTotal);
      if (a < b) {
        await scanOos(id, keyword, opts, st, b - segStart);
        items.push(...st.oosItems.slice(a - segStart, b - segStart));
      }
      segStart += oosTotal;
    }
  }

  // Total del catálogo para el contador: exacto cuando ya se conoce el
  // total del stream completo de cada categoría.
  const grandTotal = states.reduce((acc, { st }) => {
    const t = st.allExhausted ? st.inStockCount + st.oosItems.length : st.allTotal;
    return acc == null || t == null ? null : acc + t;
  }, 0);
  const totalCount = grandTotal ?? totalIn + states.reduce((acc, { st }) => acc + st.oosItems.length, 0);
  const totalApprox =
    grandTotal == null || states.some(({ st }) => st.allApprox || st.inStockApprox);
  // Si la página quedó incompleta porque el escaneo de sin-stock no llegó a
  // recolectar suficiente en este request, hasMore queda en true para que el
  // usuario pueda reintentar avanzando (el progreso queda cacheado).
  const underfilled = items.length < PAGE_SIZE && states.some(({ st }) => !st.allExhausted);
  const hasMore =
    underfilled ||
    (grandTotal != null
      ? e < grandTotal
      : e < totalIn || states.some(({ st }) => !st.allExhausted));

  const { en: translated } = await translateTitles(items.map((p) => p.title));
  items.forEach((p, i) => {
    p.title = translated[i];
  });

  return { items, totalCount, totalApprox, page, hasMore };
}
