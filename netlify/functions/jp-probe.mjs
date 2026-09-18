// Endpoint de diagnóstico (temporal): prueba qué técnicas pueden alcanzar
// Suruga-ya desde la infraestructura de Netlify/AWS.
//   - curl plano contra variantes de dominio/scheme
//   - CycleTLS (fingerprint de Chrome) contra el dominio principal
//   - endpoint de traducción (control: Google debería responder)
// Devuelve un JSON con status/bytes/marca-de-challenge por intento.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const isChallenge = (status, html) =>
  status === 403 ||
  html.includes('challenges.cloudflare.com') ||
  html.includes('Just a moment') ||
  html.includes('http-equiv="refresh"') ||
  html.includes('Redirecting to');

async function curlProbe(url) {
  try {
    const { stdout } = await execFileAsync(
      'curl',
      [
        '-sS', '-L', '--max-time', '10',
        '-A', UA,
        '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        '-H', 'Accept-Language: en-US,en;q=0.9',
        '-w', '\n%{http_code}',
        url,
      ],
      { maxBuffer: 8 * 1024 * 1024 }
    );
    const status = Number(stdout.slice(stdout.lastIndexOf('\n') + 1).trim()) || 0;
    const html = stdout.slice(0, stdout.lastIndexOf('\n'));
    return { status, bytes: html.length, challenge: isChallenge(status, html) };
  } catch (err) {
    return { error: String(err?.message || err).slice(0, 200) };
  }
}

async function cycleTlsProbe(url) {
  try {
    // Specifier no literal ni foldable para que el bundler no lo procese;
    // el paquete viaja igual por external_node_modules en netlify.toml.
    const initCycleTLS = require(['cycle', 'tls'].join('')).default;
    const cycleTLS = await initCycleTLS();
    try {
      const res = await cycleTLS(
        url,
        {
          body: '',
          ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
          userAgent: UA,
        },
        'get'
      );
      const html = String(res?.body || '');
      return {
        status: res?.status,
        bytes: html.length,
        challenge: isChallenge(res?.status, html),
      };
    } finally {
      cycleTLS.exit();
    }
  } catch (err) {
    return { error: String(err?.message || err).slice(0, 200) };
  }
}

export const config = { path: '/api/jp-probe', timeout: 26 };

export default async () => {
  const results = {};

  // Variantes con curl plano
  const curlTargets = {
    'curl_www_en': 'https://www.suruga-ya.com/en',
    'curl_apex_en': 'https://suruga-ya.com/en',
    'curl_http_www': 'http://www.suruga-ya.com/en',
    'curl_www_products': 'https://www.suruga-ya.com/en/products?category=7&keyword=blue%20lock',
    'curl_jp_root': 'https://www.suruga-ya.jp/',
    'curl_cdn': 'https://cdn.suruga-ya.com/',
  };
  for (const [key, url] of Object.entries(curlTargets)) {
    results[key] = await curlProbe(url);
  }

  // CycleTLS (JA3 de Chrome) contra el dominio principal
  results['cycletls_www_en'] = await cycleTlsProbe('https://www.suruga-ya.com/en');
  results['cycletls_products'] = await cycleTlsProbe(
    'https://www.suruga-ya.com/en/products?category=7&keyword=blue%20lock'
  );

  // Control: el endpoint de traducción debería responder desde AWS
  results['translate_control'] = await curlProbe(
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=test'
  );

  return Response.json(results, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
};
