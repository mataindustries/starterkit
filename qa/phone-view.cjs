#!/usr/bin/env node
/* Phone-width review for Luxury Editorial. Nothing leaves this machine.

   1. Exports a realistic Post and Story through the real app UI, the way an owner would: fill in the
      form, upload a photo, pick Luxury, edit the headline, tap Save image.
   2. Shows the exports as a 360 CSS px wide Android phone does (screenshot at 2× pixel density), with
      the on-screen size of every text element.

     node qa/phone-view.cjs                      → qa/luxury-editorial/sample-post.png, sample-story.png,
                                                   phone-view-360.png
     node qa/phone-view.cjs --before old.html    → phone-view-360.png shows the old page next to this one
   The business is fictional; 555-01xx is a reserved fictional phone range. The photo is a synthetic
   stand-in from qa/fixtures. */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'luxury-editorial');
const PHOTO = path.join(__dirname, 'fixtures', 'photo-spa.jpg');
const argv = process.argv.slice(2);
const beforeFile = argv.includes('--before') ? argv[argv.indexOf('--before') + 1] : null;
const BIZ = { name: 'Casa Serena Skin Studio', other: 'Med spa', area: 'Pasadena & San Marino', phone: '6265550148', handle: 'casaserenaskin',
  headline: 'Your skin, in good hands.', cta: 'Book your first visit' };
const TARGET = { folio: 10, cta: 11, contact: 12 }; // on-screen px at 360 px wide, from the self-test

function headers() {
  const out = {};
  for (const line of fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').split('\n')) { const m = line.match(/^\s+([A-Za-z-]+):\s*(.+)$/); if (m) out[m[1]] = m[2].trim(); }
  return out;
}
async function serve(html) {
  const h = headers();
  const server = http.createServer((req, res) => { for (const [k, v] of Object.entries(h)) res.setHeader(k, v); res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

/* The owner flow, ending in two real downloads. Returns {post, story} file paths and measured sizes. */
async function exportVia(browser, html, tag, tmp) {
  const app = await serve(html);
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(app.base);
    await page.evaluate(() => window.ENMStarter.fontsReady);
    await page.click('[data-lang="en"]');
    await page.fill('#f_name', BIZ.name);
    await page.click('[data-svc="other"]');
    await page.fill('#f_other', BIZ.other);
    await page.fill('#f_area', BIZ.area);
    await page.fill('#f_phone', BIZ.phone);
    await page.fill('#f_handle', BIZ.handle);
    await page.setInputFiles('#f_file', PHOTO);
    await page.waitForTimeout(400);
    await page.click('#b_go');
    await page.waitForTimeout(800);
    await page.click('[data-tpl="3"]');
    await page.fill('#f_head', BIZ.headline);
    await page.fill('#f_cta', BIZ.cta);
    await page.waitForTimeout(1100);
    const files = {};
    for (const kind of ['post', 'story']) {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`[data-save="${kind}"]`)]);
      files[kind] = path.join(tmp, `${tag}-${dl.suggestedFilename()}`);
      await dl.saveAs(files[kind]);
    }
    // Measure the same state with the page's own renderer: smallest on-screen size per element.
    const photo = `data:image/jpeg;base64,${fs.readFileSync(PHOTO).toString('base64')}`;
    const sizes = await page.evaluate(async photo => {
      const A = window.ENMStarter, st = JSON.parse(localStorage.getItem('enm-starter-v1'));
      const im = new Image(); im.src = photo; await im.decode();
      const src = document.createElement('canvas'); src.width = im.naturalWidth; src.height = im.naturalHeight; src.getContext('2d').drawImage(im, 0, 0);
      const d = A.deriveData(st, src), out = {};
      for (const H of [1350, 1920]) {
        const cv = document.createElement('canvas'); cv.width = 1080; cv.height = H; const c = cv.getContext('2d'), runs = [], ft = c.fillText.bind(c);
        c.fillText = (t, x, y, m) => { runs.push({ t, font: c.font }); return ft(t, x, y, m); };
        A.render(c, 1080, H, d, 3);
        const px = r => +(r.font.match(/([\d.]+)px/) || [0, 0])[1] / 3, s = {};
        const put = (k, v) => { s[k] = Math.min(s[k] || 99, v); };
        for (const r of runs) {
          if (/Cormorant/.test(r.font)) put(r.t === r.t.toUpperCase() ? 'wordmark' : 'headline', px(r));
          else if (/^600 /.test(r.font)) put('cta', px(r));
          else if (/[@\d]/.test(r.t)) put('contact', px(r)); else put('folio', px(r));
        }
        out[H === 1350 ? 'post' : 'story'] = s;
      }
      return out;
    }, photo);
    if (errors.length) throw new Error(`${tag}: page errors ${errors.join(' | ')}`);
    return { files, sizes };
  } finally { await ctx.close(); app.server.close(); }
}

/* A sheet that shows each export at 360 CSS px wide, captured at 2× density like a typical phone. */
async function sheet(browser, cols) {
  const ctx = await browser.newContext({ viewport: { width: 400 * cols.length + 80, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const uri = f => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
  const row = (kind, label) => cols.map(c => `<figure><figcaption>${c.label} · ${label}</figcaption><img src="${uri(c.files[kind])}"><table>${
    ['wordmark', 'folio', 'headline', 'cta', 'contact'].map(k => { const v = c.sizes[kind][k], t = TARGET[k], bad = t && v < t - .05;
      return `<tr class="${bad ? 'bad' : ''}"><td>${{ wordmark: 'Business name', folio: 'Service · area', headline: 'Headline', cta: 'Call to action', contact: 'Phone · Instagram' }[k]}</td><td>${v ? v.toFixed(1) : '–'} px</td><td>${t ? `target ≥ ${t}` : ''}</td></tr>`; }).join('')}</table></figure>`).join('');
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:28px 40px 36px;background:#ECE8E1;font:14px/1.45 system-ui,Roboto,Arial,sans-serif;color:#1C1813}
    h1{font:600 22px/1.2 system-ui,Roboto,Arial,sans-serif;margin:0 0 6px} p{margin:0 0 22px;color:#5c554d;max-width:${400 * cols.length - 40}px}
    .row{display:flex;gap:40px;margin:0 0 30px;align-items:flex-start} figure{margin:0;width:360px}
    figcaption{font-weight:600;margin:0 0 8px} img{display:block;width:360px;height:auto;box-shadow:0 8px 24px -14px rgba(0,0,0,.45)}
    table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px} td{padding:3px 0;border-bottom:1px solid rgba(0,0,0,.08)} td:nth-child(2){font-weight:600}
    td:nth-child(3){color:#857C71;text-align:right} tr.bad td:nth-child(2){color:#B3261E}
  </style><h1>Luxury Editorial at real phone width</h1>
  <p>Each export is shown 360 CSS px wide, as on a typical Android phone (captured at 2× pixel density). Sizes are what the reader sees on screen; red means below the readability target. Fictional business; synthetic stand-in photo.</p>
  <div class="row">${row('post', 'Post')}</div><div class="row">${row('story', 'Story')}</div>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'phone-view-360.png'), fullPage: true });
  await ctx.close();
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'starterkit-phone-'));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const cols = [];
    if (beforeFile) cols.push(Object.assign({ label: 'Before' }, await exportVia(browser, fs.readFileSync(beforeFile, 'utf8'), 'before', tmp)));
    const now = await exportVia(browser, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), 'now', tmp);
    cols.push(Object.assign({ label: beforeFile ? 'After' : 'This version' }, now));
    fs.copyFileSync(now.files.post, path.join(OUT, 'sample-post.png'));
    fs.copyFileSync(now.files.story, path.join(OUT, 'sample-story.png'));
    await sheet(browser, cols);
    for (const c of cols) for (const k of ['post', 'story']) console.log(`${c.label.padEnd(12)} ${k.padEnd(6)}`, Object.entries(c.sizes[k]).map(([a, b]) => `${a} ${b.toFixed(1)}`).join(' · '));
    console.log('wrote qa/luxury-editorial/sample-post.png, sample-story.png, phone-view-360.png');
  } finally { await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
})().catch(e => { console.error(e); process.exit(1); });
