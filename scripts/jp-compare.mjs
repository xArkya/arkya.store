// Compara el total que reporta el origen (Suruga-ya) vs lo que ya tenemos
// en Supabase, por cada subcategoría de libros y doujin.
//
//   node scripts/jp-compare.mjs
//
// Para doujin el origen se consulta con price=649- : el crawler solo
// importa items de >=¥649, así la comparación es del universo que se
// puede capturar, no del catálogo absoluto del sitio.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchProductsHtml, parseTotal } from './jp-catalog.mjs';
import { JP_CATEGORY_TREE } from '../src/data/jpCatalogFilters.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(join(ROOT, file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]])
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* opcional */
  }
}
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

// Una entrada por código de sub hoja (un leaf puede fusionar varios códigos)
const targets = [];
for (const [cat, tree] of Object.entries(JP_CATEGORY_TREE)) {
  for (const l1 of tree) {
    for (const leaf of l1.children) {
      for (const code of leaf.codes || [leaf.code]) {
        targets.push({ cat, code, label: `${l1.label} / ${leaf.label}` });
      }
    }
  }
}

async function dbCount(cat, code) {
  const db = SUPA[cat];
  const res = await fetch(`${db.url}/rest/v1/products?sub=eq.${code}&select=id&limit=0`, {
    headers: {
      apikey: db.key,
      Authorization: `Bearer ${db.key}`,
      Prefer: 'count=exact',
    },
  });
  if (!res.ok) return null;
  const cr = res.headers.get('content-range') || '';
  const n = Number(cr.split('/')[1]);
  return Number.isFinite(n) ? n : null;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (n) => (n == null ? '  —  ' : String(n).padStart(8));

let totalSrc = 0;
let totalDb = 0;
const resumenCat = {};

for (const t of targets) {
  let srcTotal = null;
  let err = '';
  try {
    const html = await fetchProductsHtml(t.code, '', {
      page: 1,
      includeOos: true,
      lang: 'en',
      // el crawler de doujin solo captura >=¥649: comparar contra ese universo
      price: t.cat === 'doujin' ? '649-' : '',
    });
    srcTotal = parseTotal(html).count;
  } catch (e) {
    err = ` (${e.message})`;
  }
  const db = await dbCount(t.cat, t.code);
  const pct =
    srcTotal && db != null ? ` ${Math.round((db / srcTotal) * 100)}%` : '';
  console.log(
    `[${t.cat}] ${t.code} ${t.label.padEnd(38).slice(0, 38)} origen:${fmt(srcTotal)}  bdd:${fmt(db)}${pct}${err}`
  );
  if (srcTotal != null) totalSrc += srcTotal;
  if (db != null) totalDb += db;
  const key = `${t.cat} ${t.label.split(' / ')[0]}`;
  resumenCat[key] ||= { src: 0, db: 0 };
  resumenCat[key].src += srcTotal || 0;
  resumenCat[key].db += db || 0;
  await delay(500); // suave con Cloudflare
}

console.log('\n== resumen por categoría ==');
for (const [k, v] of Object.entries(resumenCat)) {
  const pct = v.src ? ` ${Math.round((v.db / v.src) * 100)}%` : '';
  console.log(`${k.padEnd(30)} origen:${fmt(v.src)}  bdd:${fmt(v.db)}${pct}`);
}
const pctTotal = totalSrc ? ` ${Math.round((totalDb / totalSrc) * 100)}%` : '';
console.log(`\nTOTAL${' '.repeat(25)} origen:${fmt(totalSrc)}  bdd:${fmt(totalDb)}${pctTotal}`);
