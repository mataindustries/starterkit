#!/usr/bin/env node
/* Contact sheets for reviewing the graphics templates, drawn by the page's own render code, so they
   show exactly what the app exports. Nothing leaves this machine.

     node qa/contact-sheet.cjs        → qa/luxury-editorial/compare-posts.png
                                        qa/luxury-editorial/compare-stories.png
                                        qa/luxury-editorial/luxury-family.png
   Photos and logos are synthetic stand-ins from qa/fixtures (no real people, places or brands). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures');
const OUT = path.join(__dirname, 'luxury-editorial');

const spaEN = { name: 'Aura Skin Studio', service: 'other', other: 'Med spa', area: 'Pasadena', phone: '6265550142', handle: 'auraskin', lang: 'en', hlEdited: true, headline: 'Skin care, thoughtfully done.', ctaIdx: 2 };
const spaES = Object.assign({}, spaEN, { other: 'Clínica estética', lang: 'es', headline: 'Su piel, en buenas manos.' });
const homeES = { name: 'Haven Bienes Raíces', service: 'other', other: 'Bienes raíces', area: 'San Marino', phone: '6265550187', web: 'havenhomes.com', lang: 'es', hlEdited: true, headline: 'Casas con carácter y mucha luz.', ctaIdx: 3, pal: 2 };
const longES = { name: 'Hermanos Mata Landscaping & Tree Service of the San Gabriel Valley', service: 'landscaping', area: 'Glendora, Azusa, San Dimas, La Verne & Claremont', phone: '6265550113', handle: 'hermanosmata', web: 'hermanosmata.com', email: 'hola@hermanosmata.com', lang: 'es' };
const STYLES = [['Editorial', 0], ['Poster', 1], ['Grid', 2], ['Luxury Editorial', 3]];

/* A sheet is rows of tiles: {label, tiles:[{caption, tpl, H, state, img, kind}]}. */
function compare(H, title) {
  const rows = [];
  for (const [lang, st] of [['EN', spaEN], ['ES', spaES]]) for (const [img, what] of [['photo-spa.jpg', 'photo'], [null, 'no photo']])
    rows.push({ label: `${lang} · ${what}`, tiles: STYLES.map(([name, tpl]) => ({ caption: name, tpl, H, state: st, img, kind: 'photo', isNew: tpl === 3 })) });
  return { title, sub: 'Same business, palette (Terracotta, the default for typed-in services) and edited headline in every column. EN: Med spa · ES: Clínica estética.', tile: 300, rows };
}
function family() {
  const set = (st, photo, logo, lang) => ['photo', 'no photo', 'logo'].flatMap(k => [1350, 1920].map(H => ({ caption: `${H === 1350 ? 'Post' : 'Story'} · ${k}`, tpl: 3, H, state: st, img: k === 'photo' ? photo : k === 'logo' ? logo : null, kind: k === 'logo' ? 'logo' : 'photo' })))
    .sort((a, b) => a.H - b.H);
  const P = ['Terracotta', 'Pine & lime', 'Midnight & sky', 'Charcoal & sun', 'Plum & coral'];
  return { title: 'Luxury Editorial · the family', sub: 'Photo-led, no-photo card and logo card, in post and story. Palettes are the app’s existing five, quietened by the template.', tile: 250, rows: [
    { label: 'Med spa · EN', tiles: set(spaEN, 'photo-spa.jpg', 'logo-alpha.png') },
    { label: 'Real estate · ES', tiles: set(homeES, 'photo-interior.jpg', 'logo-white.jpg') },
    { label: 'Palettes', tiles: P.map((p, i) => ({ caption: p, tpl: 3, H: 1350, state: Object.assign({}, spaEN, { pal: i }), img: null, kind: 'photo' }))
      .concat([{ caption: 'Long name · ES', tpl: 3, H: 1350, state: longES, img: 'photo-dusk.jpg', kind: 'photo' }]) }] };
}

async function main() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => { window.__ENM_NO_APP = true; });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const imgs = Object.fromEntries(fs.readdirSync(FIX).filter(f => /\.(jpg|png)$/.test(f)).map(f => [f, `data:image/${f.endsWith('png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(path.join(FIX, f)).toString('base64')}`]));
    for (const [file, sheet] of [['compare-posts.png', compare(1350, 'Posts · 1080 × 1350 · existing styles vs Luxury Editorial')],
                                 ['compare-stories.png', compare(1920, 'Stories · 1080 × 1920 · existing styles vs Luxury Editorial')],
                                 ['luxury-family.png', family()]]) {
      const url = await page.evaluate(draw, { sheet, imgs, foot: 'Rendered by qa/contact-sheet.cjs from index.html with the app’s own drawing code. Photos and logos are synthetic stand-ins (qa/fixtures).' });
      fs.writeFileSync(path.join(OUT, file), Buffer.from(url.split(',')[1], 'base64'));
      console.log('wrote', path.relative(ROOT, path.join(OUT, file)));
    }
  } finally { await browser.close(); server.close(); }
}

/* Runs in the page. */
async function draw({ sheet, imgs, foot }) {
  const A = window.ENMStarter; await A.fontsReady;
  const cache = {};
  const load = async name => { if (!name) return null; if (cache[name]) return cache[name];
    const im = new Image(); im.src = imgs[name]; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); return (cache[name] = c); };
  const shrink = (src, w) => { let c = src; while (c.width / 2 >= w) { const n = document.createElement('canvas'); n.width = Math.round(c.width / 2); n.height = Math.round(c.height / 2); const x = n.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, n.width, n.height); c = n; }
    const n = document.createElement('canvas'); n.width = w; n.height = Math.round(src.height * w / src.width); const x = n.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, n.width, n.height); return n; };
  const T = sheet.tile, gap = 26, M = 56, labelW = 150, capH = 34;
  const rowH = r => Math.max(...r.tiles.map(t => Math.round(t.H * T / 1080))) + capH;
  const cols = Math.max(...sheet.rows.map(r => r.tiles.length));
  const W = M * 2 + labelW + cols * T + (cols - 1) * gap, head = 150;
  const H = head + sheet.rows.reduce((s, r) => s + rowH(r) + 40, 0) + 70;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = '#ECE8E1'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1C1813'; c.font = '500 46px "Cormorant Garamond"'; c.fillText(sheet.title, M, 78);
  c.fillStyle = '#6F675E'; c.font = '400 19px Inter'; c.fillText(sheet.sub, M, 114);
  let y = head;
  for (const r of sheet.rows) {
    c.fillStyle = '#1C1813'; c.font = '600 15px Inter'; c.letterSpacing = '2px';
    r.label.toUpperCase().split(' · ').forEach((part, i) => c.fillText(part, M, y + 22 + i * 24)); c.letterSpacing = '0px';
    let x = M + labelW;
    for (const t of r.tiles) {
      const full = document.createElement('canvas'); full.width = 1080; full.height = t.H;
      A.render(full.getContext('2d'), 1080, t.H, A.deriveData(Object.assign({}, A.DEF, t.state, { kind: t.kind }), await load(t.img)), t.tpl);
      const th = shrink(full, T);
      c.save(); c.shadowColor = 'rgba(28,24,19,.18)'; c.shadowBlur = 18; c.shadowOffsetY = 8; c.drawImage(th, x, y); c.restore();
      if (t.isNew) { c.strokeStyle = '#1C1813'; c.lineWidth = 2; c.strokeRect(x - 7, y - 7, T + 14, th.height + 14); }
      c.fillStyle = t.isNew ? '#1C1813' : '#4A443D'; c.font = `${t.isNew ? 600 : 500} 15px Inter`; c.fillText(t.caption + (t.isNew ? '  · new' : ''), x, y + th.height + 26);
      x += T + gap;
    }
    y += rowH(r) + 40;
  }
  c.fillStyle = '#857C71'; c.font = '400 14px Inter'; c.fillText(foot, M, H - 34);
  return cv.toDataURL('image/png');
}

main().catch(e => { console.error(e); process.exit(1); });
