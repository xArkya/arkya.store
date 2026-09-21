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
const STATE_FILE = join(ROOT, 'scripts', '.jp-crawl-state.json');

// --- env -----------------------------------------------------------------
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(join(ROOT, file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* archivo opcional */
  }
}

const SUPA_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || '';
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
  process.env.JP_CONCURRENCY != null ? Number(process.env.JP_CONCURRENCY) : 4;
// Pausa entre chunks de requests: normal y cuando el chunk anterior tuvo errores
const DELAY_MS = Number(process.env.JP_DELAY_MS) || 300;
const DELAY_ERR_MS = Number(process.env.JP_DELAY_ERR_MS) || 5000;

if (!DRY && (!SUPA_URL || !SUPA_KEY)) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY en .env.local');
  process.exit(1);
}

// Targets: una entrada por subcategoría hoja. Por ahora solo libros —
// doujin queda para después (sacar el filtro de abajo para habilitarlo).
// Priorizamos manga/revistas (lo que más se busca) y después el resto.
const ONLY_CATEGORIES = process.env.JP_CRAWL_ONLY
  ? process.env.JP_CRAWL_ONLY.split(',')
  : ['books'];
const PRIORITY_FIRST = ['701', '70205', '1100'];
const targets = [];
for (const [category, tree] of Object.entries(JP_CATEGORY_TREE)) {
  if (!ONLY_CATEGORIES.includes(category)) continue;
  for (const level1 of tree) {
    for (const leaf of level1.children) {
      targets.push({
        category,
        sub: leaf.code,
        label: `${level1.label} / ${leaf.label}`,
        key: leaf.code,
        year: '',
        price: '',
      });
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
for (const d of state.deep) {
  const key = keyOf(d.sub, d.price, d.year);
  // migración de targets por año del formato viejo ("sub@rango")
  const legacy = d.year && !d.price ? `${d.sub}@${d.year}` : null;
  if (legacy && state.targets[legacy] && !state.targets[key]) {
    state.targets[key] = state.targets[legacy];
    delete state.targets[legacy];
  }
  const tag = [d.price && `¥${d.price}`, d.year].filter(Boolean).join(' ');
  targets.push({ ...d, key, label: `${d.label} (${tag})` });
}
for (const t of targets) {
  state.targets[t.key] ||= { page: 1, done: false };
}
const saveState = () => {
  if (!DRY) writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
};

// --- supabase --------------------------------------------------------------
async function upsert(rows) {
  if (DRY || !rows.length) return;
  const res = await fetch(`${SUPA_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`supabase upsert: HTTP ${res.status} ${await res.text()}`);
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
function toRows(items, category, sub, band = null) {
  // El origen a veces lista el mismo producto 2 veces en una página —
  // Postgres rechaza un upsert con ids duplicados en el mismo batch.
  const seen = new Set();
  return items
    .filter(
      (p) =>
        p.id &&
        // Material promocional suelto, folletos y extras de compra — no se
        // ofrecen (títulos con estas palabras no son el producto en sí)
        !/\b(advertisement|leaflets?|kawara-?ban|4p|purchase benefits)\b/i.test(p.title) &&
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
  const html = await fetchProductsHtml(target.sub, '', {
    page,
    sort: 'released_date_desc',
    includeOos: true,
    lang: 'en', // títulos romanizados por el propio origen
    year: target.year || '',
    price: target.price || '',
  });
  const { count } = parseTotal(html);
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
  const rawCount = (html.match(/class="product_wrap"/g) || []).length;
  if (!rawCount) return 0;
  const band = target.price ? PRICE_RANGES.indexOf(target.price) : null;
  const rows = toRows(parseProducts(html), target.category, target.sub, band);
  await upsert(rows);
  if (DRY) rows.slice(0, 2).forEach((r) => console.log('   ', JSON.stringify(r).slice(0, 140)));
  return rawCount;
}

// true cuando un chunk entero falla (403 sostenido): significa que la IP
// quedó flaggeada o la cf_clearance expiró — seguir sería martillar al
// pedo, así que se corta la corrida entera.
let blocked = false;

async function crawlPages(target, pages) {
  // Páginas en chunks paralelos; si alguna falla se loguea y se sigue.
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const chunk = pages.slice(i, i + CONCURRENCY);
    const counts = await Promise.all(
      chunk.map((pg) =>
        crawlPage(target, pg).catch((err) => {
          console.error(`  [${target.sub} p${pg}] ${err.message}`);
          return -1;
        })
      )
    );
    if (counts.every((c) => c === -1)) {
      blocked = true;
      return false;
    }
    // Si hubo errores (403/rate limit), enfriar el ritmo bastante más
    await delay(counts.includes(-1) ? DELAY_ERR_MS : DELAY_MS);
    if (counts.includes('same') || counts.some((c) => c === 0)) return false; // stream agotado
  }
  return true;
}

// Si un listado agotó su stream habiendo reportado más items que los que
// deja ver la paginación (~10k), lo splitea: primero por banda de precio
// (todo item tiene precio conocido por el origen, incluso los sin stock)
// y si una banda sigue capeada, por rango de año debajo de ella.
const CAP_ITEMS = 24 * 410; // ~9.840 — el origen corta cerca de la pág 418
// Bandas JPY pesadas hacia abajo: libros/doujin usados son baratos en su
// mayoría. price_band guardado en la fila = índice en este array.
const PRICE_RANGES = JP_PRICE_BANDS.map((b) => b.range);
function maybeSplit(t) {
  if (!t._total) return;
  if (t.year && t.price) return; // máximo nivel de split
  if (t._same) return; // el origen ignoró el filtro — profundizar no ayuda
  // Toda sub base se splitea por precio — así TODOS los items quedan con
  // price_band, incluidos los sin-stock (el origen recuerda su precio).
  // Un target ya filtrado solo se vuelve a splitear si sigue capeado.
  const isBase = !t.price && !t.year;
  if (!isBase && t._total <= CAP_ITEMS) return;
  const dims = !t.price
    ? PRICE_RANGES.map((price) => ({ price }))
    : JP_YEAR_RANGES.map((year) => ({ year }));
  let added = 0;
  for (const dim of dims) {
    const d = {
      category: t.category,
      sub: t.sub,
      // sin el tag "(¥...)" que el label del padre ya pueda tener
      label: t.label.replace(/\s*\([^)]*\)\s*$/, ''),
      price: t.price || dim.price || '',
      year: t.year || dim.year || '',
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
      `  [${t.key}] ${t._total} items -> +${added} splits por ${!t.price ? 'precio' : 'año'}`
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
  for (const t of targets.filter((x) => !x.year && !x.price)) {
    // Si ya tiene splits por precio creados, no hay nada que sondear
    if (state.deep.some((d) => d.sub === t.sub && d.price)) continue;
    try {
      const html = await fetchProductsHtml(t.sub, '', {
        page: 1,
        sort: 'released_date_desc',
        includeOos: true,
        lang: 'en',
      });
      t._total = parseTotal(html).count;
      state.totals[t.sub] = t._total;
      maybeSplit(t);
      console.log(`[${t.sub}] total reportado: ${t._total ?? '?'}`);
    } catch (err) {
      console.error(`  [${t.sub}] ${err.message}`);
      if (err.message.includes('blocked')) {
        blocked = true;
        break;
      }
    }
    await delay(400);
  }
}

// Pass 1 — refresh: primeras páginas de cada subcategoría BASE (stock +
// novedades). Los targets split (banda/año) no se refrescan: todo item
// nuevo aparece en las primeras páginas del listado base, que ya cubre
// el target completo — refrescar bandas duplicaría requests al pedo.
if (REFRESH_PAGES > 0) {
  console.log('\n== refresh ==');
  for (const t of targets.filter(
    (x) => REFRESH_DEEP || (!x.year && !x.price)
  )) {
    console.log(`[${t.key}] ${t.label} — refresh`);
    const ok = await crawlPages(
      t,
      Array.from({ length: REFRESH_PAGES }, (_, i) => i + 1)
    );
    if (blocked) break;
    const cur = state.targets[t.key];
    if (!ok) {
      cur.done = true;
      maybeSplit(t);
    } else {
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
    const ok = await crawlPages(t, pages);
    if (blocked) break outer;
    cur.page = pages[pages.length - 1] + 1;
    if (!ok) {
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
    '\nCortado por bloqueo sostenido (403). Renová JP_COOKIE/JP_UA en .env.local ' +
      'o esperá a que se enfríe la IP y relanzá el comando — el progreso quedó guardado.'
  );
  process.exitCode = 1;
}
const pending = targets.filter((t) => !state.targets[t.key].done).length;
console.log(`\nListo. Subcategorías pendientes de backfill: ${pending}`);
