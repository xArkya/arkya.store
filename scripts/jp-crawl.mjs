// Crawler del catálogo externo → Supabase.
//
// Corre en la PC del dueño (IP residencial, pasa Cloudflare). Es resumable:
// guarda el progreso en .jp-crawl-state.json y puede cortarse con Ctrl+C en
// cualquier momento sin perder nada.
//
// Estrategia por ejecución:
//   1) Refresh: pide las primeras JP_REFRESH_PAGES páginas de cada
//      subcategoría (orden por más recientes) y upsertea — actualiza stock
//      y captura items nuevos que entran "por arriba".
//   2) Backfill: sigue crawleando cada subcategoría desde donde quedó
//      (cursor en el state file) hasta agotar el presupuesto JP_CRAWL_PAGES.
//
// Uso:
//   node scripts/jp-crawl.mjs            # corre con defaults
//   node scripts/jp-crawl.mjs --dry      # imprime lo que haría, sin escribir
//   node scripts/jp-crawl.mjs --pages 300
//   node scripts/jp-crawl.mjs --reset    # borra el estado y arranca de cero
//
// Config (.env.local):
//   SUPABASE_URL / SUPABASE_SERVICE_KEY   (requeridas salvo --dry)
//   JP_CRAWL_PAGES   páginas de backfill por corrida (default 150)
//   JP_REFRESH_PAGES páginas de refresh por subcategoría (default 2)
//   JP_CONCURRENCY   requests en paralelo (default 3)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchProductsHtml,
  parseProducts,
  parseTotal,
} from './jp-catalog.mjs';
import {
  JP_CATEGORY_TREE,
  JP_YEAR_RANGES,
  JP_PRICE_BANDS,
} from '../src/data/jpCatalogFilters.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// JP_STATE_FILE: estado separado para corridas en paralelo (2 procesos no
// pueden compartir el mismo archivo — el último save pisa al otro).
const STATE_FILE =
  process.env.JP_STATE_FILE || join(ROOT, 'scripts', '.jp-crawl-state.json');

// --- env -----------------------------------------------------------------
function loadEnvFile(file, { override = false } = {}) {
  try {
    for (const line of readFileSync(join(ROOT, file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && (override || !process.env[m[1]])) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* archivo opcional */
  }
}
for (const file of ['.env.local', '.env']) loadEnvFile(file);

// Hot-reload de credenciales: si el usuario renueva JP_COOKIE/JP_UA en
// .env.local a mitad de corrida, se detecta sin reiniciar el proceso.
function reloadCredentialsIfChanged() {
  const prev = process.env.JP_COOKIE;
  loadEnvFile('.env.local', { override: true });
  return process.env.JP_COOKIE !== prev;
}

// Cada categoría escribe a su proyecto: doujin (~1M items) vive en un
// Supabase aparte para no reventar el free tier de 500MB del de libros.
const SUPA = {
  books: {
    url: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
    key: process.env.SUPABASE_SERVICE_KEY || '',
  },
  doujin: {
    url: (process.env.SUPABASE_DOUJIN_URL || '').replace(/\/$/, ''),
    key: process.env.SUPABASE_DOUJIN_SERVICE_KEY || '',
  },
};
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const RESET = args.includes('--reset');
const pagesIdx = args.indexOf('--pages');
const PAGE_BUDGET =
  (pagesIdx > -1 ? Number(args[pagesIdx + 1]) : 0) ||
  Number(process.env.JP_CRAWL_PAGES) ||
  150;
const REFRESH_PAGES =
  process.env.JP_REFRESH_PAGES != null ? Number(process.env.JP_REFRESH_PAGES) : 2;
// JP_REFRESH_DEEP=1: refrescar también los targets split (más requests)
const REFRESH_DEEP = process.env.JP_REFRESH_DEEP === '1';
const CONCURRENCY =
  process.env.JP_CONCURRENCY != null ? Number(process.env.JP_CONCURRENCY) : 2;
// Pausa entre chunks de requests: normal y cuando el chunk anterior tuvo errores
const DELAY_MS = Number(process.env.JP_DELAY_MS) || 800;
const DELAY_ERR_MS = Number(process.env.JP_DELAY_ERR_MS) || 8000;
// Reintentos por página ante 403 aislados y cooldowns cuando el bloqueo es
// sostenido: en vez de cortar, espera y prueba de nuevo — la corrida termina
// sola aunque el origen limite la IP varias veces.
const PAGE_RETRIES = Number(process.env.JP_PAGE_RETRIES) || 3;
const COOLDOWN_MIN = Number(process.env.JP_COOLDOWN_MIN) || 10;
const MAX_COOLDOWNS = Number(process.env.JP_MAX_COOLDOWNS) || 6;

// Targets: una entrada por subcategoría hoja. Por defecto solo libros —
// para doujin: JP_CRAWL_ONLY=doujin (o 'books,doujin' para ambos).
// Priorizamos manga/revistas (lo que más se busca) y después el resto.
const ONLY_CATEGORIES = process.env.JP_CRAWL_ONLY
  ? process.env.JP_CRAWL_ONLY.split(',')
  : ['books'];
// JP_CRAWL_SUBS=7000722,11000000 -> solo esas subs (y sus splits). Para
// re-crawlear una categoría puntual sin tocar el resto.
const ONLY_SUBS = process.env.JP_CRAWL_SUBS
  ? process.env.JP_CRAWL_SUBS.split(',').map((s) => s.trim())
  : null;
const subOk = (sub) => !ONLY_SUBS || ONLY_SUBS.some((p) => sub.startsWith(p));

if (!DRY) {
  for (const cat of ONLY_CATEGORIES) {
    if (!SUPA[cat]?.url || !SUPA[cat]?.key) {
      console.error(
        cat === 'doujin'
          ? 'Faltan SUPABASE_DOUJIN_URL y/o SUPABASE_DOUJIN_SERVICE_KEY en .env.local'
          : 'Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY en .env.local'
      );
      process.exit(1);
    }
  }
}

const PRIORITY_FIRST = ['701', '70205', '1100'];
// Bandas del primer split de doujin: el piso es ¥649 (los más baratos no
// rinden para importar) y '649-700' cae dentro de la banda 1 del catálogo.
const DOUJIN_PRICE_RANGES = ['649-700', '701-1200', '1201-2500', '2501-5000', '5001-'];
const targets = [];
for (const [category, tree] of Object.entries(JP_CATEGORY_TREE)) {
  if (!ONLY_CATEGORIES.includes(category)) continue;
  for (const level1 of tree) {
    for (const leaf of level1.children) {
      // Un leaf puede fusionar varias subs del origen (Manga/Anime+Mook):
      // cada código se crawlea como target independiente.
      for (const subCode of leaf.codes || [leaf.code]) {
        if (!subOk(subCode)) continue;
        if (category === 'doujin') {
          // Sin listado base: con el piso de ¥649 la unión de las bandas
          // cubre TODO lo deseado — la base duplicaría esas páginas. Las
          // bandas se splitean por año/bisección si quedan capeadas.
          for (const price of DOUJIN_PRICE_RANGES) {
            targets.push({
              category,
              sub: subCode,
              label: `${level1.label} / ${leaf.label}`,
              key: `${subCode}@P${price}`,
              year: '',
              price,
              minPrice: 649,
            });
          }
        } else {
          targets.push({
            category,
            sub: subCode,
            label: `${level1.label} / ${leaf.label}`,
            key: subCode,
            year: '',
            price: '',
          });
        }
      }
    }
  }
}

// Clave del target en el state: sub, o sub@P<rango>, o sub@P<rango>@Y<rango>
const keyOf = (sub, price = '', year = '') =>
  sub + (price ? `@P${price}` : '') + (year ? `@Y${year}` : '');
targets.sort((a, b) => {
  const pa = PRIORITY_FIRST.some((p) => a.sub.startsWith(p) || a.sub === p) ? 0 : 1;
  const pb = PRIORITY_FIRST.some((p) => b.sub.startsWith(p) || b.sub === p) ? 0 : 1;
  return pa - pb;
});

// --- estado resumable -----------------------------------------------------
let state = { targets: {} };
if (!RESET && existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    /* estado corrupto: arranca de cero */
  }
}
// Deep targets (sub × banda de precio [× año]) generados cuando una sub
// pega en el techo de paginación del origen (~10k items): cada listado
// filtrado tiene su propio techo, así se recupera lo escondido.
state.deep ||= [];
state.totals ||= {};
const seenKeys = new Set(targets.map((t) => t.key));
for (const d of state.deep) {
  // Splits de otra categoría (ej. books al correr JP_CRAWL_ONLY=doujin)
  // no se rehidratan: quedan en el state para cuando toque su corrida.
  d.category ||= 'books';
  if (!ONLY_CATEGORIES.includes(d.category) || !subOk(d.sub)) continue;
  const key = keyOf(d.sub, d.price, d.year);
  // Las bandas de doujin ya son targets estáticos — no duplicar.
  if (seenKeys.has(key)) continue;
  // migración de targets por año del formato viejo ("sub@rango")
  const legacy = d.year && !d.price ? `${d.sub}@${d.year}` : null;
  if (legacy && state.targets[legacy] && !state.targets[key]) {
    state.targets[key] = state.targets[legacy];
    delete state.targets[legacy];
  }
  const tag = [d.price && `¥${d.price}`, d.year].filter(Boolean).join(' ');
  targets.push({ ...d, key, label: `${d.label} (${tag})` });
}
// Dentro de doujin se crawlea primero Para hombres (110000*) y después
// Para mujeres (110001*). El rank de prioridad general (PRIORITY_FIRST)
// domina: libros/manga siguen yendo antes que el doujin en corridas
// combinadas. Sort estable: conserva el orden de inserción por grupo.
const prioRank = (sub) =>
  PRIORITY_FIRST.some((p) => sub.startsWith(p) || sub === p) ? 0 : 1;
const doujinRank = (sub) =>
  sub.startsWith('110000') ? 0 : sub.startsWith('110001') ? 1 : 2;
targets.sort(
  (a, b) => prioRank(a.sub) - prioRank(b.sub) || doujinRank(a.sub) - doujinRank(b.sub)
);
for (const t of targets) {
  state.targets[t.key] ||= { page: 1, done: false };
}
const saveState = () => {
  if (!DRY) writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
};

// --- supabase --------------------------------------------------------------
async function upsert(rows, category, attempt = 0) {
  if (DRY || !rows.length) return;
  const db = SUPA[category];
  const res = await fetch(`${db.url}/rest/v1/products`, {
    method: 'POST',
    headers: {
      apikey: db.key,
      Authorization: `Bearer ${db.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    // 500/timeout transitorios (ej. índice construyéndose): un retry alcanza
    if (res.status >= 500 && attempt < 2) {
      await delay(4000);
      return upsert(rows, category, attempt + 1);
    }
    throw new Error(`supabase upsert: HTTP ${res.status} ${await res.text()}`);
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Formatos del origen: "15 Sep 2025" (en) o "2012/11/24" (ja) -> date Postgres
const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
function parseReleaseDate(s) {
  if (!s) return null;
  const iso = s.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }
  const m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// Convierte los items parseados a filas de la tabla. La imagen viene
// envuelta como /api/jp-image?u=<cdn url>: se desenrolla para guardar la
// URL cruda del CDN.
function toRows(items, category, sub, band = null, minPrice = null) {
  // El origen a veces lista el mismo producto 2 veces en una página —
  // Postgres rechaza un upsert con ids duplicados en el mismo batch.
  const seen = new Set();
  return items
    .filter(
      (p) =>
        p.id &&
        // Piso de precio de la categoría (doujin >=¥649): defensa por si
        // el origen ignora el filtro — solo aplica cuando el precio
        // exacto es visible (los sin-stock confían en el filtro del sitio)
        !(minPrice && p.price != null && p.price < minPrice) &&
        // Material promocional suelto, folletos y extras de compra — no se
        // ofrecen (títulos con estas palabras no son el producto en sí)
        !/\b(advertisement|leaflets?|kawara-?ban|4p|purchase benefits)\b/i.test(p.title) &&
        // Merch de eventos/conciertos y ediciones incompletas — no se venden
        !/\b(live tours?|concerts?|world tours?|live around|japan tours?|brochures?|pamphlets?|bonus missing|appendix missing)\b/i.test(p.title) &&
        !seen.has(p.id) &&
        seen.add(p.id)
    )
    .map((p) => {
      let image = p.image;
      if (image?.startsWith('/api/jp-image?u=')) {
        try {
          image = decodeURIComponent(image.slice('/api/jp-image?u='.length));
        } catch {
          /* se guarda como vino */
        }
      }
      // no_photo.jpg = placeholder del origen, no foto real
      if (image && (!image.startsWith('http') || /no_photo/.test(image))) image = null;
      // banda de precio (0-5): la del target que lo trajo, o derivada del
      // precio exacto cuando el HTML lo muestra — cubre sin-stock cuando
      // viene de un target con banda
      let pb = band;
      if (pb == null && p.price != null) {
        pb = PRICE_RANGES.findIndex((r) => {
          const [lo, hi] = r.split('-');
          return (!lo || p.price >= Number(lo)) && (!hi || p.price <= Number(hi));
        });
        if (pb < 0) pb = null;
      }
      return {
        id: p.id,
        title: p.title,
        // sin imagen se omite la key: el upsert conserva la foto que la
        // fila ya tenga (el origen muestra no_photo en out-of-stock)
        ...(image ? { image } : {}),
        release_date: parseReleaseDate(p.releaseDate),
        category,
        sub,
        price_band: pb,
      };
    });
}

// Pide una página del stream completo (con y sin stock mezclados) y la
// upsertea. Devuelve cuántos items crudos trajo (para detectar el fin),
// o 'same' si un target de año devolvió el mismo total que el listado
// base (filtro ignorado por el origen -> no gastar más páginas).
async function crawlPage(target, page) {
  // Retry por página con backoff: un 403 aislado no debe saltear items.
  let html;
  for (let attempt = 0; ; attempt++) {
    try {
      html = await fetchProductsHtml(target.sub, '', {
        page,
        sort: 'released_date_desc',
        includeOos: true,
        lang: 'en', // títulos romanizados por el propio origen
        year: target.year || '',
        // minPrice = piso de la categoría (doujin >=¥649): va como rango
        // abierto en la URL y también filtra los sin-stock del origen.
        price: target.price || (target.minPrice ? `${target.minPrice}-` : ''),
      });
      break;
    } catch (err) {
      if (attempt >= PAGE_RETRIES - 1) throw err;
      await delay(5000 * (attempt + 1));
    }
  }
  const { count } = parseTotal(html);
  const firstSeen = target._total == null;
  target._total ??= count;
  // Si un target filtrado reporta el mismo total que su padre, el origen
  // ignoró el filtro -> no gastar más páginas acá.
  if (
    (target.year || target.price) &&
    page === 1 &&
    count != null &&
    count === target._parentTotal
  ) {
    target._same = true; // filtro ignorado por el origen
    return 'same';
  }
  // Split temprano: si el total reportado ya supera el cap de paginación
  // y el target todavía puede subdividirse, no recorrer las ~418 páginas
  // visibles — los splits cubren todo el rango de todas formas.
  if (
    firstSeen &&
    count != null &&
    count > CAP_ITEMS &&
    (target.year || target.price) &&
    splitDims(target)
  ) {
    return 'split';
  }
  const rawCount = (html.match(/class="product_wrap"/g) || []).length;
  if (!rawCount) return 0;
  const band = target.price ? bandOfRange(target.price) : null;
  const rows = toRows(parseProducts(html), target.category, target.sub, band, target.minPrice);
  await upsert(rows, target.category);
  if (DRY) rows.slice(0, 2).forEach((r) => console.log('   ', JSON.stringify(r).slice(0, 140)));
  return rawCount;
}

// Bloqueo sostenido: en vez de cortar la corrida, espera COOLDOWN_MIN y
// prueba una request de sondeo. Repite hasta MAX_COOLDOWNS rondas; solo se
// rinde si el origen sigue rechazando (ej. cookie vencida de verdad).
let blocked = false;

async function handleBlocked() {
  for (let i = 0; i < MAX_COOLDOWNS; i++) {
    console.log(
      `\n>> Bloqueo sostenido (403). Cooldown ${COOLDOWN_MIN} min ` +
        `(${i + 1}/${MAX_COOLDOWNS}) — el progreso está guardado.\n` +
        `   Si la cookie venció, actualizá JP_COOKIE en .env.local: ` +
        `lo detecto solo y sigo sin reiniciar.`
    );
    saveState();
    // Espera en ticks de 15s: si el usuario renovó la cookie en .env.local,
    // se aplica y se sondea de inmediato en vez de esperar el cooldown entero.
    const deadline = Date.now() + COOLDOWN_MIN * 60 * 1000;
    while (Date.now() < deadline) {
      await delay(15000);
      if (reloadCredentialsIfChanged()) {
        console.log('>> Cookie/UA renovada en .env.local — sondeo ahora.');
        break;
      }
    }
    try {
      await fetchProductsHtml('7000722', '', { page: 1, lang: 'en' });
      console.log('>> El origen responde de nuevo — continúo.');
      blocked = false;
      return true;
    } catch (err) {
      console.log(`>> Sigue bloqueado (${err.message})`);
    }
  }
  return false;
}

// Devuelve { counts, blocked, exhausted }: counts[i] = items crudos de
// pages[i], -1 si falló, 'same' si el origen ignoró el filtro, 0 si vacío.
// blocked = todo el chunk falló (IP flaggeada); exhausted = fin del stream.
async function crawlPages(target, pages) {
  const counts = [];
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const chunk = pages.slice(i, i + CONCURRENCY);
    const res = await Promise.all(
      chunk.map((pg) =>
        crawlPage(target, pg).catch((err) => {
          console.error(`  [${target.sub} p${pg}] ${err.message}`);
          return -1;
        })
      )
    );
    counts.push(...res);
    if (res.every((c) => c === -1)) return { counts, blocked: true, exhausted: false };
    // Si hubo errores (403/rate limit), enfriar el ritmo bastante más.
    // Jitter en el delay normal para no hacer un patrón metronómico.
    await delay(res.includes(-1) ? DELAY_ERR_MS : DELAY_MS * (0.5 + Math.random()));
    if (res.some((c) => c === 'same' || c === 'split' || c === 0)) {
      return { counts, blocked: false, exhausted: true };
    }
  }
  return { counts, blocked: false, exhausted: false };
}

// Avanza el cursor hasta la primera página NO crawleada con éxito:
// una página que falló queda como próxima, no se saltea.
function advanceCursor(cur, pages, counts) {
  const firstBad = counts.findIndex((c) => c === -1);
  if (firstBad !== -1) {
    cur.page = pages[firstBad];
  } else if (counts.length < pages.length) {
    cur.page = pages[counts.length]; // cortó antes por stream agotado
  } else {
    cur.page = pages[pages.length - 1] + 1;
  }
}

// Si un listado agotó su stream habiendo reportado más items que los que
// deja ver la paginación (~10k), lo splitea: primero por banda de precio
// (todo item tiene precio conocido por el origen, incluso los sin stock)
// y si una banda sigue capeada, por rango de año debajo de ella.
const CAP_ITEMS = 24 * 410; // ~9.840 — el origen corta cerca de la pág 418
// Bandas JPY pesadas hacia abajo: libros/doujin usados son baratos en su
// mayoría. price_band guardado en la fila = índice en este array.
const PRICE_RANGES = JP_PRICE_BANDS.map((b) => b.range);
// Banda de la UI para un rango arbitrario (splits biseccionados): el
// índice de la banda que contiene el límite inferior.
function bandOfRange(range) {
  const exact = PRICE_RANGES.indexOf(range);
  if (exact >= 0) return exact;
  const lo = Number(range.split('-')[0]) || 0;
  const i = PRICE_RANGES.findIndex((r) => {
    const [blo, bhi] = r.split('-');
    return (!blo || lo >= Number(blo)) && (!bhi || lo <= Number(bhi));
  });
  return i < 0 ? null : i;
}
// '[2011, 2012]' -> ['[2011, 2011]', '[2012, 2012]']. null si es un solo
// año o un rango abierto ('{,2010]').
function splitYearRange(year) {
  const m = year.match(/\[(\d{4}),\s*(\d{4})\]/);
  if (!m || m[1] === m[2]) return null;
  const out = [];
  for (let y = Number(m[1]); y <= Number(m[2]); y++) out.push(`[${y}, ${y}]`);
  return out;
}
// '649-700' -> ['649-675','676-700']; '5001-' -> ['5001-20000','20001-'];
// '-300' -> ['-150','151-300']. null si no se puede dividir.
function bisectPriceRange(price) {
  const [lo, hi] = price.split('-');
  if (lo && hi) {
    const a = Number(lo), b = Number(hi);
    if (b - a < 1) return null;
    const mid = Math.floor((a + b) / 2);
    return [`${a}-${mid}`, `${mid + 1}-${b}`];
  }
  if (lo) return [`${lo}-20000`, '20001-'];
  if (hi) {
    const mid = Math.floor(Number(hi) / 2);
    return [`-${mid}`, `${mid + 1}-${hi}`];
  }
  return null;
}
// Dimensiones en que se puede subdividir un target: precio -> rango de
// años -> año individual -> bisección de precio. null = no se puede más.
function splitDims(t) {
  if (!t.price) {
    const ranges = t.category === 'doujin' ? DOUJIN_PRICE_RANGES : PRICE_RANGES;
    return { dims: ranges.map((price) => ({ price })), dimName: 'precio' };
  }
  if (!t.year) return { dims: JP_YEAR_RANGES.map((year) => ({ year })), dimName: 'año' };
  const ys = splitYearRange(t.year);
  if (ys) return { dims: ys.map((year) => ({ year })), dimName: 'año individual' };
  const ps = bisectPriceRange(t.price);
  return ps ? { dims: ps.map((price) => ({ price })), dimName: 'precio (bisección)' } : null;
}
function maybeSplit(t) {
  if (!t._total) return;
  if (t._same) return; // el origen ignoró el filtro — profundizar no ayuda
  // Toda sub base se splitea por precio — así TODOS los items quedan con
  // price_band, incluidos los sin-stock (el origen recuerda su precio).
  // Un target ya filtrado solo se vuelve a splitear si sigue capeado.
  const isBase = !t.price && !t.year;
  if (!isBase && t._total <= CAP_ITEMS) return;
  const sd = splitDims(t);
  if (!sd) {
    console.log(`  [${t.key}] ${t._total} items — sin más ejes de split, queda truncado`);
    return;
  }
  const { dims, dimName } = sd;
  let added = 0;
  for (const dim of dims) {
    const d = {
      category: t.category,
      sub: t.sub,
      // sin el tag "(¥...)" que el label del padre ya pueda tener
      label: t.label.replace(/\s*\([^)]*\)\s*$/, ''),
      price: dim.price ?? t.price,
      year: dim.year ?? t.year,
      minPrice: t.minPrice,
      _parentTotal: t._total,
    };
    const key = keyOf(d.sub, d.price, d.year);
    if (state.targets[key]) continue;
    state.deep.push(d);
    state.targets[key] = { page: 1, done: false };
    const tag = [d.price && `¥${d.price}`, d.year].filter(Boolean).join(' ');
    targets.push({ ...d, key, label: `${t.label} (${tag})` });
    added++;
  }
  if (added) {
    saveState();
    console.log(
      `  [${t.key}] ${t._total} items -> +${added} splits por ${dimName}`
    );
  }
}

// --- main ------------------------------------------------------------------
console.log(
  `jp-crawl: ${DRY ? 'DRY RUN ' : ''}${targets.length} subcategorías, ` +
    `refresh=${REFRESH_PAGES}p c/u, backfill budget=${PAGE_BUDGET}p`
);

// Pass 0 — deep probe (--deep): las subs ya marcadas done nunca vuelven a
// pedir páginas, así que el split hay que dispararlo acá: se pide la
// página 1 de cada sub base, se lee el total reportado y si supera el
// techo se generan los targets filtrados (precio -> año).
if (args.includes('--deep')) {
  console.log('\n== deep probe ==');
  // Doujin entra directo por banda (targets con price + minPrice): el
  // probe también los sondea — su total decide si hacen split por año.
  for (const t of targets.filter((x) => !x.year && (!x.price || x.minPrice))) {
    // Splits ya creados para ESTE target: para banda doujin = splits por
    // año del mismo rango; para base = splits por precio de la sub.
    const hasSplits = t.price
      ? state.deep.some((d) => d.sub === t.sub && d.price === t.price && d.year)
      : state.deep.some((d) => d.sub === t.sub && d.price && !d.year);
    if (hasSplits) {
      // Los splits por año particionan la banda entera — crawlear la banda
      // hasta el cap sería re-pedir ~418 páginas que los splits re-cubren.
      if (t.price && t.minPrice) state.targets[t.key].done = true;
      continue;
    }
    try {
      const html = await fetchProductsHtml(t.sub, '', {
        page: 1,
        sort: 'released_date_desc',
        includeOos: true,
        lang: 'en',
        price: t.price || (t.minPrice ? `${t.minPrice}-` : ''),
      });
      t._total = parseTotal(html).count;
      state.totals[t.sub] = t._total;
      maybeSplit(t);
      // Si el sondeo generó splits por año, la banda queda cubierta por
      // ellos: no tiene sentido crawlear sus ~418 páginas hasta el cap.
      if (
        t.price &&
        t.minPrice &&
        state.deep.some(
          (d) => d.sub === t.sub && d.price === t.price && d.year
        )
      )
        state.targets[t.key].done = true;
      console.log(`[${t.sub}] total reportado: ${t._total ?? '?'}`);
    } catch (err) {
      console.error(`  [${t.sub}] ${err.message}`);
      if (err.message.includes('blocked')) {
        blocked = true;
        if (!(await handleBlocked())) break;
      }
    }
    await delay(400);
  }
  saveState();
}

// Pass 1 — refresh: primeras páginas de cada subcategoría BASE (stock +
// novedades). Los targets split (banda/año) no se refrescan: todo item
// nuevo aparece en las primeras páginas del listado base, que ya cubre
// el target completo — refrescar bandas duplicaría requests al pedo.
if (REFRESH_PAGES > 0) {
  console.log('\n== refresh ==');
  // Doujin no tiene listado base: el refresh pega las primeras páginas
  // de cada banda (minPrice marca esos targets) — las novedades quedan
  // en el tope de cualquier orden por fecha igual.
  for (const t of targets.filter(
    (x) => REFRESH_DEEP || (!x.year && (!x.price || x.minPrice))
  )) {
    console.log(`[${t.key}] ${t.label} — refresh`);
    const res = await crawlPages(
      t,
      Array.from({ length: REFRESH_PAGES }, (_, i) => i + 1)
    );
    if (res.blocked) {
      blocked = true;
      if (!(await handleBlocked())) break;
      continue; // reintenta este target tras el cooldown
    }
    const cur = state.targets[t.key];
    if (res.exhausted) {
      cur.done = true;
      maybeSplit(t);
    } else if (!res.counts.includes(-1)) {
      cur.page = Math.max(cur.page, REFRESH_PAGES + 1);
    }
    saveState();
  }
}

// Pass 2 — backfill: continuar los cursores hasta agotar presupuesto
let budget = PAGE_BUDGET;
console.log('\n== backfill ==');
outer: for (const t of targets) {
  const cur = state.targets[t.key];
  if (cur.done) continue;
  while (!cur.done && budget > 0) {
    const pages = [];
    while (pages.length < CONCURRENCY && budget > 0) {
      pages.push(cur.page + pages.length);
      budget--;
    }
    console.log(`[${t.key}] ${t.label} — páginas ${pages.join(',')}`);
    const res = await crawlPages(t, pages);
    if (res.blocked) {
      blocked = true;
      budget += pages.length; // refund: estas páginas se reintentan tras cooldown
      if (!(await handleBlocked())) break outer;
      continue; // cursor intacto: reintenta las mismas páginas
    }
    advanceCursor(cur, pages, res.counts);
    if (res.exhausted) {
      cur.done = true;
      maybeSplit(t);
    }
    saveState();
  }
  if (budget <= 0 || blocked) break outer;
}

saveState();
if (blocked) {
  console.error(
    `\nCortado tras ${MAX_COOLDOWNS} cooldowns sin recuperación — la cookie ` +
      `cf_clearance probablemente venció de verdad. Renová JP_COOKIE/JP_UA en ` +
      `.env.local y relanzá el comando — el progreso quedó guardado.`
  );
  process.exitCode = 1;
}
const pending = targets.filter((t) => !state.targets[t.key].done).length;
console.log(`\nListo. Subcategorías pendientes de backfill: ${pending}`);
