#!/usr/bin/env node
/* Headless QA for the Starter Kit page (index.html). Nothing leaves this machine: the page is
   served from 127.0.0.1 with the same headers as production (_headers) and Chromium runs locally.

     node qa/run-checks.cjs                         self-test, real UI flow, uploads, timing
     node qa/run-checks.cjs --baseline old.html     also: Editorial, Poster, Grid, the hero examples
                                                    and before/after render pixel-identical to old.html

   e.g.  git show origin/main:index.html > /tmp/old.html && node qa/run-checks.cjs --baseline /tmp/old.html
   Needs Node 18+ and Playwright with Chromium (set CHROMIUM_PATH to use a specific binary).
   Writes qa/luxury-editorial/results.json and exits 1 if any check fails. */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures');
const OUT = path.join(__dirname, 'luxury-editorial');
const argv = process.argv.slice(2);
const baselineFile = argv.includes('--baseline') ? argv[argv.indexOf('--baseline') + 1] : null;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'starterkit-qa-'));
const LUX = 3; // index of Luxury Editorial in the style picker

const results = [];
function check(name, pass, info) {
  results.push({ name, pass: !!pass, info: info || '' });
  console.log(`${pass ? '✓' : '✗'} ${name}${info ? `  (${info})` : ''}`);
}

/* Production headers, parsed from _headers, so the page runs under the real CSP. */
function prodHeaders() {
  const out = {};
  for (const line of fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').split('\n')) {
    const m = line.match(/^\s+([A-Za-z-]+):\s*(.+)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}
async function serve(html) {
  const headers = prodHeaders();
  const server = http.createServer((req, res) => {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
function pngSize(buf) {
  const sig = buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  return { png: sig, w: sig ? buf.readUInt32BE(16) : 0, h: sig ? buf.readUInt32BE(20) : 0 };
}
function watch(page, base) {
  const log = { errors: [], external: [] };
  page.on('pageerror', e => log.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') log.errors.push(m.text()); });
  page.on('request', r => { const u = r.url(); if (!u.startsWith(base) && !/^(data|blob):/.test(u)) log.external.push(u); });
  return log;
}
const settle = page => page.evaluate(() => window.ENMStarter.fontsReady).then(() => page.waitForTimeout(900));

/* 1 · The page's own #selftest (the same checks an owner can run on their phone). */
async function selfTest(browser, base) {
  const page = await browser.newPage();
  const log = watch(page, base);
  await page.goto(`${base}/#selftest`);
  await page.waitForFunction(() => window.__selftest, null, { timeout: 120000 });
  const st = await page.evaluate(() => window.__selftest);
  for (const r of st.results) check(`#selftest · ${r.n}`, r.pass, r.pass ? '' : r.info);
  check('#selftest · no page errors and no outside requests', !log.errors.length && !log.external.length, log.errors.concat(log.external).join(' | '));
  await page.close();
}

/* 2 · The real owner flow at phone widths: fill in, pick Luxury, edit, save, reload. */
async function uiFlow(browser, base, width, lang) {
  const es = lang === 'es';
  const ctx = await browser.newContext({ viewport: { width, height: 860 }, deviceScaleFactor: 2, acceptDownloads: true, locale: es ? 'es-MX' : 'en-US' });
  const page = await ctx.newPage();
  const log = watch(page, base);
  const tag = `UI ${width}px ${lang.toUpperCase()}`;
  await page.goto(base);
  await page.evaluate(() => window.ENMStarter.fontsReady);
  await page.click(`[data-lang="${lang}"]`);
  await page.fill('#f_name', 'Aura Skin Studio');
  await page.click('[data-svc="other"]');
  await page.fill('#f_other', es ? 'Clínica estética' : 'Med spa');
  await page.fill('#f_area', 'Pasadena');
  await page.fill('#f_phone', '6265550142');
  await page.fill('#f_handle', 'auraskin');
  await page.click('#b_go');
  await settle(page);
  await page.click(`[data-tpl="${LUX}"]`);
  await settle(page);

  const picker = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll('#tpls .tpl')];
    return {
      names: tiles.map(t => t.querySelector('span').textContent),
      pressed: tiles.findIndex(t => t.getAttribute('aria-pressed') === 'true'),
      widths: tiles.map(t => Math.round(t.getBoundingClientRect().width * 10) / 10),
      clipped: tiles.filter(t => { const s = t.querySelector('span'); return s.scrollWidth > s.clientWidth + 1; }).length,
      sideways: document.documentElement.scrollWidth > window.innerWidth,
      thumbsDrawn: [...document.querySelectorAll('#tpls canvas')].every(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return true; return false; })
    };
  });
  const want = es ? 'Editorial,Cartel,Cuadrícula,Lujo' : 'Editorial,Poster,Grid,Luxury';
  check(`${tag} · picker lists ${want}, Luxury selected, equal columns, labels not clipped, no sideways scroll`,
    picker.names.join() === want && picker.pressed === LUX && new Set(picker.widths).size === 1 && !picker.clipped && !picker.sideways && picker.thumbsDrawn,
    `columns ${picker.widths.join('/')}px`);

  // Headline and call to action edited through the normal fields.
  const head = es ? 'Su piel,\nen buenas manos.' : 'Skin care,\nthoughtfully done.';
  const cta = es ? 'Agende su valoración' : 'Book a consultation';
  await page.fill('#f_head', head);
  await page.fill('#f_cta', cta);
  await settle(page);

  if (width === 360) { // what the owner sees: style picker down to the post preview
    const clip = await page.evaluate(() => {
      const abs = el => { const r = el.getBoundingClientRect(); return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY }; };
      const top = abs(document.querySelector('#p_g .ctl')).top - 10, bottom = abs(document.querySelector('#c_post')).bottom + 46;
      return { x: 0, y: top, width: window.innerWidth, height: bottom - top };
    });
    await page.screenshot({ path: path.join(OUT, `app-graphics-${lang}.png`), clip, fullPage: true });
  }

  for (const kind of ['post', 'story']) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`[data-save="${kind}"]`)]);
    const file = path.join(TMP, `${width}-${lang}-${dl.suggestedFilename()}`);
    await dl.saveAs(file);
    const s = pngSize(fs.readFileSync(file));
    const H = kind === 'post' ? 1350 : 1920;
    check(`${tag} · Save image (${kind}) downloads a real 1080 × ${H} PNG named …-${kind}-luxury.png`,
      s.png && s.w === 1080 && s.h === H && dl.suggestedFilename() === `aura-skin-studio-${kind}-luxury.png`, `${dl.suggestedFilename()} ${s.w}×${s.h}`);
  }

  await page.reload();
  await settle(page);
  const after = await page.evaluate(() => ({
    saved: JSON.parse(localStorage.getItem('enm-starter-v1') || '{}'),
    pressed: (document.querySelector('#tpls [aria-pressed=true]') || {}).dataset,
    head: document.querySelector('#f_head').value, cta: document.querySelector('#f_cta').value,
    onKit: !document.querySelector('#kit').hidden
  }));
  check(`${tag} · after reload, Luxury, the edited headline and the CTA are still there`,
    after.saved.tpl === LUX && after.pressed && after.pressed.tpl === String(LUX) && after.head === head && after.cta === cta && after.onKit,
    `tpl=${after.saved.tpl}`);
  check(`${tag} · no page errors, no outside requests`, !log.errors.length && !log.external.length, log.errors.concat(log.external).join(' | '));
  await ctx.close();
}

/* 3 · Uploads through the real file input: photo, transparent logo, solid logo, then removal. */
async function uploads(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, acceptDownloads: true });
  const page = await ctx.newPage();
  const log = watch(page, base);
  await page.goto(base);
  await page.evaluate(() => window.ENMStarter.fontsReady);
  await page.fill('#f_name', 'Haven Homes Group');
  await page.click('[data-svc="other"]');
  await page.fill('#f_other', 'Real estate');
  await page.click('#b_go');
  await settle(page);
  await page.click(`[data-tpl="${LUX}"]`);
  await settle(page);
  const pixels = () => page.evaluate(() => { const c = document.querySelector('#c_post'); return c.toDataURL('image/png').length + ':' + c.getContext('2d').getImageData(0, 1300, 1080, 1).data.slice(0, 400).join(); });
  const kind = () => page.evaluate(() => JSON.parse(localStorage.getItem('enm-starter-v1')).kind);
  const before = await pixels();
  const cases = [['photo-interior.jpg', 'photo'], ['logo-alpha.png', 'logo'], ['logo-white.jpg', 'logo']];
  let prev = before;
  for (const [file, want] of cases) {
    await page.click('[data-tab="g"]');
    await page.click('#b_back');
    await page.setInputFiles('#f_file', path.join(FIX, file));
    await page.waitForTimeout(400);
    await page.click('#b_go');
    await settle(page);
    const now = await pixels();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-save="story"]')]);
    const out = path.join(TMP, `upload-${file}.png`);
    await dl.saveAs(out);
    const s = pngSize(fs.readFileSync(out));
    check(`Upload ${file} · detected as ${want}, Luxury preview changes, story still saves 1080 × 1920`, (await kind()) === want && now !== prev && s.w === 1080 && s.h === 1920, `kind=${await kind()} ${s.w}×${s.h}`);
    prev = now;
  }
  await page.click('#b_back');
  await page.click('#b_rmimg');
  await page.click('#b_go');
  await settle(page);
  check('Upload · removing the image brings back the no-photo Luxury card', (await pixels()) === before);
  check('Upload · no page errors, no outside requests', !log.errors.length && !log.external.length, log.errors.concat(log.external).join(' | '));
  await ctx.close();
}

/* 4 · Timing: what one keystroke costs (post + story + 4 thumbnails), per style. */
async function timing(browser, base) {
  const page = await browser.newPage();
  await page.addInitScript(() => { window.__ENM_NO_APP = true; });
  await page.goto(base);
  const t = await page.evaluate(async () => {
    const A = window.ENMStarter; await A.fontsReady;
    const photo = document.createElement('canvas'); photo.width = 1600; photo.height = 1067;
    const pc = photo.getContext('2d'); pc.fillStyle = '#c9b8a6'; pc.fillRect(0, 0, 1600, 1067);
    const d = A.deriveData(Object.assign({}, A.DEF, { name: 'Aura Skin Studio', service: 'other', other: 'Med spa', area: 'Pasadena', phone: '6265550142', handle: 'auraskin' }), photo);
    const cv = { p: document.createElement('canvas'), s: document.createElement('canvas'), t: document.createElement('canvas') };
    cv.p.width = cv.s.width = 1080; cv.p.height = 1350; cv.s.height = 1920; cv.t.width = 216; cv.t.height = 270;
    const once = tpl => { const a = performance.now();
      A.render(cv.p.getContext('2d'), 1080, 1350, d, tpl); A.render(cv.s.getContext('2d'), 1080, 1920, d, tpl);
      const tc = cv.t.getContext('2d'); tc.setTransform(.2, 0, 0, .2, 0, 0); A.render(tc, 1080, 1350, d, tpl); tc.setTransform(1, 0, 0, 1, 0, 0);
      cv.p.getContext('2d').getImageData(0, 0, 1, 1); return performance.now() - a; };
    const med = tpl => { for (let i = 0; i < 5; i++) once(tpl); const r = []; for (let i = 0; i < 25; i++) r.push(once(tpl)); r.sort((x, y) => x - y); return r[12]; };
    return [0, 1, 2, 3].map(med);
  });
  const old = Math.max(t[0], t[1], t[2]);
  check('Timing · Luxury redraw (post + story + thumbnail) costs no more than 2× the slowest existing style',
    t[3] <= Math.max(2 * old, old + 4), `ms: editorial ${t[0].toFixed(1)}, poster ${t[1].toFixed(1)}, grid ${t[2].toFixed(1)}, luxury ${t[3].toFixed(1)}`);
  await page.close();
  return t;
}

/* 5 · Optional regression: existing styles are pixel-identical to a baseline copy of the page. */
async function regression(browser, base, file) {
  const old = await serve(fs.readFileSync(file, 'utf8'));
  const imgs = Object.fromEntries(['photo-interior.jpg', 'logo-alpha.png', 'photo-spa.jpg'].map(f => [f, `data:image/${f.endsWith('png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(path.join(FIX, f)).toString('base64')}`]));
  const grab = async url => {
    const page = await browser.newPage();
    await page.addInitScript(() => { window.__ENM_NO_APP = true; });
    await page.goto(url);
    const out = await page.evaluate(async imgs => {
      const A = window.ENMStarter; await A.fontsReady;
      const load = async u => { const im = new Image(); im.src = u; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); return c; };
      const photo = await load(imgs['photo-interior.jpg']), logo = await load(imgs['logo-alpha.png']), spa = await load(imgs['photo-spa.jpg']);
      const sets = [{ name: 'Bright Path Cleaning', area: 'Glendora', phone: '6265550123', handle: 'brightpath', web: 'brightpath.com', email: 'hi@brightpath.com' },
        { name: 'Hermanos Mata Landscaping & Tree Service of the San Gabriel Valley', area: 'Glendora, Azusa, San Dimas, La Verne & Claremont', service: 'landscaping', phone: '6265550113' },
        { name: 'Aura Skin Studio', service: 'other', other: 'Med spa', area: 'Pasadena', hlEdited: true, headline: 'Skin care,\nthoughtfully done.' }];
      const hashes = [];
      for (let t = 0; t < 3; t++) for (const v of sets) for (const lang of ['en', 'es']) for (const [img, kind] of [[null, 'photo'], [photo, 'photo'], [logo, 'logo']]) for (const H of [1350, 1920]) {
        const c = document.createElement('canvas'); c.width = 1080; c.height = H;
        A.render(c.getContext('2d'), 1080, H, A.deriveData(Object.assign({}, A.DEF, v, { lang, kind }), img), t);
        hashes.push(c.toDataURL('image/png'));
      }
      const ba = document.createElement('canvas'); ba.width = 1080; ba.height = 1350;
      A.tBA(ba.getContext('2d'), A.deriveData(Object.assign({}, A.DEF, sets[0]), null), spa, photo); hashes.push(ba.toDataURL('image/png'));
      return hashes;
    }, imgs);
    await page.close();
    return out;
  };
  const [a, b] = [await grab(base), await grab(old.base)];
  const diff = a.filter((x, i) => x !== b[i]).length;
  check('Regression · Editorial, Poster, Grid (and before/after) are pixel-identical to the baseline page', a.length === b.length && diff === 0, `${a.length} renders compared, ${diff} differ`);
  // The setup screen's example fan, as an owner first sees it.
  const shot = async url => { const p = await browser.newPage({ viewport: { width: 412, height: 900 } }); await p.goto(url); await p.evaluate(() => window.ENMStarter.fontsReady); await p.waitForTimeout(500);
    const d = await p.evaluate(() => [...document.querySelectorAll('.fan canvas')].map(c => c.toDataURL()).join()); await p.close(); return d; };
  check('Regression · the example fan on the setup screen is unchanged', (await shot(base)) === (await shot(old.base)));
  old.server.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const app = await serve(html);
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let ms = null;
  try {
    await selfTest(browser, app.base);
    for (const width of [320, 360, 412]) for (const lang of ['en', 'es']) await uiFlow(browser, app.base, width, lang);
    await uploads(browser, app.base);
    ms = await timing(browser, app.base);
    if (baselineFile) await regression(browser, app.base, baselineFile);
  } finally {
    await browser.close();
    app.server.close();
  }
  const failed = results.filter(r => !r.pass);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({
    page: { bytes: Buffer.byteLength(html), fonts: (html.match(/@font-face/g) || []).length },
    chromium: browser.version(), renderMs: ms && { editorial: +ms[0].toFixed(2), poster: +ms[1].toFixed(2), grid: +ms[2].toFixed(2), luxury: +ms[3].toFixed(2) },
    baseline: baselineFile ? path.basename(baselineFile) : null, passed: results.length - failed.length, total: results.length, results
  }, null, 2) + '\n');
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
