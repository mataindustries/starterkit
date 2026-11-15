#!/usr/bin/env node
/* Headless QA for the Starter Kit page (index.html). Nothing leaves this machine: the page is
   served from 127.0.0.1 with the same headers as production (_headers) and Chromium runs locally.

     node qa/run-checks.cjs                         self-test, real UI flow, marketing goals, uploads,
                                                    timing; writes goal-selector screenshots to qa/goals/
     node qa/run-checks.cjs --baseline old.html     also: every graphics style, the hero examples and
                                                    before/after render pixel-identical to old.html, all
                                                    copy with no goal matches it word for word, and a kit
                                                    saved by old.html opens unchanged
     node qa/run-checks.cjs --url https://…         run the same checks against a deployed copy (for
                                                    example a preview), writing results-preview.json

   e.g.  git show origin/main:index.html > /tmp/old.html && node qa/run-checks.cjs --baseline /tmp/old.html
   Needs Node 18+ and Playwright with Chromium (set CHROMIUM_PATH to use a specific binary).
   Writes qa/luxury-editorial/results.json (results-preview.json with --url) and exits 1 if any check fails. */
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
const remote = argv.includes('--url') ? argv[argv.indexOf('--url') + 1].replace(/\/+$/, '') : null;
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

/* 2b · Marketing goals at phone widths: pick each goal, keep typed text, save, copy, reload, clear. */
const GOALS_OUT = path.join(__dirname, 'goals');
const GENERAL = { en: 'Introduce yourself,Before & after,One quick tip,Behind the scenes,Answer a common question,Where you work,Say thank you',
  es: 'Preséntese,Antes y después,Un consejo rápido,Detrás de cámaras,Responda una pregunta común,Dónde trabaja,Dé las gracias' };
async function goalFlow(browser, base, width, lang) {
  const es = lang === 'es';
  const ctx = await browser.newContext({ viewport: { width, height: 860 }, deviceScaleFactor: 2, acceptDownloads: true, locale: es ? 'es-MX' : 'en-US', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const log = watch(page, base);
  const tag = `Goals ${width}px ${lang.toUpperCase()}`;
  await page.goto(base);
  await page.evaluate(() => window.ENMStarter.fontsReady);
  await page.click(`[data-lang="${lang}"]`);
  await page.fill('#f_name', 'Bright Path Cleaning');
  await page.fill('#f_area', 'Glendora');
  await page.fill('#f_phone', '6265550142');
  await page.click('#b_go');
  await settle(page);

  // What the owner sees, next to what the page's own copy code says it should show for the saved state.
  const look = () => page.evaluate(() => {
    const A = window.ENMStarter, st = JSON.parse(localStorage.getItem('enm-starter-v1') || '{}'), d = A.deriveData(st, null), q = s => [...document.querySelectorAll(s)];
    const px = c => { const s = c.toDataURL('image/png'); let x = 2166136261; for (let i = 0; i < s.length; i += 5) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16) + ':' + s.length; };
    return { goal: st.goal, want: A.buildCopy(d).ideas.map(i => i.t), hls: d.hls, ctas: d.ctas, ui: A.UI[st.lang], G: st.goal ? A.GOALS[st.goal][st.lang] : null,
      titles: q('#out_w article h3').map(h => h.textContent), caps: q('#out_w .capbox .txt').map(p => p.textContent),
      pressed: q('#goals [aria-pressed="true"]').map(b => b.dataset.goal), names: q('#goals button').map(b => b.textContent),
      head: document.querySelector('#f_head').value, cta: document.querySelector('#f_cta').value, hint: document.querySelector('#goalHint').textContent,
      intro: document.querySelector('#weekIntro').textContent, toast: document.querySelector('#toast').textContent, post: px(document.querySelector('#c_post')) };
  });
  const s0 = await look();
  const layout = await page.evaluate(() => {
    const b = [...document.querySelectorAll('#goals button')], r = b.map(x => x.getBoundingClientRect()), tabs = document.querySelector('.tabs').getBoundingClientRect();
    return { w: r.map(x => Math.round(x.width * 10) / 10), h: r.map(x => Math.round(x.height)), clipped: b.filter(x => x.scrollWidth > x.clientWidth + 1 || x.scrollHeight > x.clientHeight + 1).length,
      above: r.every(x => x.bottom <= tabs.top), firstScreen: r.every(x => x.bottom <= innerHeight), sideways: document.documentElement.scrollWidth > innerWidth, font: parseFloat(getComputedStyle(b[0]).fontSize) };
  });
  const names = es ? 'Conseguir clientes,Mostrar mi trabajo,Darme a conocer' : 'Sell now,Show proof,Build brand';
  check(`${tag} · selector shows ${names}: none picked, 3 equal columns, taps ≥ 48 px tall, labels fit, above the tabs on the first screen, no sideways scroll`,
    s0.names.join() === names && !s0.pressed.length && new Set(layout.w).size === 1 && new Set(layout.h).size === 1 && layout.h[0] >= 48 && !layout.clipped && layout.above && layout.firstScreen && !layout.sideways && layout.font >= 13,
    `${layout.w[0]} × ${layout.h[0]} px, ${layout.font}px text`);
  check(`${tag} · before picking a goal: Week 1 is the general plan, the usual headline and CTA, the "optional" hint`,
    !s0.goal && s0.titles.join() === GENERAL[lang] && s0.head === s0.hls[0] && s0.cta === s0.ctas[0] && s0.hint === s0.ui.goalNone && s0.intro === s0.ui.weekIntro, s0.titles[0]);

  // Pick each goal in turn: Week 1, headline, CTA, intro, hint and the graphics all follow.
  const shotGoal = { 320: 'brand', 360: 'sell', 412: 'proof' }[width];
  let prev = s0;
  const plans = {};
  for (const g of ['sell', 'proof', 'brand']) {
    await page.click(`[data-goal="${g}"]`);
    await settle(page);
    const s = await look();
    plans[g] = s.titles.join();
    check(`${tag} · tap "${s.G && s.G.name}": Week 1 has its own 7 ideas, headline and CTA switch to its suggestions, the graphics redraw`,
      s.goal === g && s.pressed.join() === g && s.titles.length === 7 && new Set(s.titles).size === 7 && s.titles.join() === s.want.join() && s.titles.join() !== prev.titles.join() &&
      s.head === s.hls[0] && s.cta === s.ctas[0] && s.head !== prev.head && s.cta !== prev.cta && s.intro === s.G.intro && s.hint === `${s.G.hint} ${s.ui.goalOff}` && s.toast === s.ui.goalSet && s.post !== prev.post,
      `${s.titles[0]} · “${s.head}” · ${s.cta}`);
    if (g === shotGoal) { // phone-width picture of the selector, as the owner sees it
      await page.waitForTimeout(2800); // let the toast fade
      const clip = await page.evaluate(() => ({ x: 0, y: 0, width: innerWidth, height: Math.ceil(document.querySelector('.tabs').getBoundingClientRect().bottom + scrollY + 14) }));
      fs.mkdirSync(GOALS_OUT, { recursive: true });
      await page.screenshot({ path: path.join(GOALS_OUT, `selector-${width}-${lang}.png`), clip });
    }
    prev = s;
  }
  check(`${tag} · the three goals give three different weeks, none the general plan`, new Set(Object.values(plans).concat(GENERAL[lang])).size === 4);

  // The owner types a headline, then changes goal: their headline stays, the CTA follows the goal.
  const mine = es ? 'Su casa lista para el fin de semana.' : 'Your home, ready for the weekend.';
  await page.fill('#f_head', mine);
  await page.click('[data-goal="sell"]');
  await settle(page);
  let s = await look();
  check(`${tag} · after typing a headline, switching goal keeps it (CTA and Week 1 still follow the goal)`,
    s.goal === 'sell' && s.head === mine && s.cta === s.ctas[0] && s.titles.join() === plans.sell && s.toast === s.ui.goalKept, s.toast);
  await page.click('#b_cta');
  await settle(page);
  s = await look();
  check(`${tag} · “Another idea” for the CTA cycles through the goal's own suggestions`, s.cta === s.ctas[1] && s.head === mine, s.cta);

  for (const kind of ['post', 'story']) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`[data-save="${kind}"]`)]);
    const file = path.join(TMP, `goal-${width}-${lang}-${dl.suggestedFilename()}`);
    await dl.saveAs(file);
    const p = pngSize(fs.readFileSync(file)), H = kind === 'post' ? 1350 : 1920;
    check(`${tag} · Save image (${kind}) with a goal: real 1080 × ${H} PNG, same file name as before`,
      p.png && p.w === 1080 && p.h === H && dl.suggestedFilename() === `bright-path-cleaning-${kind}-editorial.png`, `${dl.suggestedFilename()} ${p.w}×${p.h}`);
  }
  await page.click('[data-tab="w"]');
  await page.click('[data-copy="w0"]');
  await page.waitForTimeout(300);
  const copied = await page.evaluate(async () => ({ btn: document.querySelector('[data-copy="w0"]').textContent, clip: await navigator.clipboard.readText().catch(() => '') }));
  check(`${tag} · Week 1 “Copy caption” copies the Day 1 caption of the chosen goal`, /^✓/.test(copied.btn) && copied.clip === s.caps[0] && copied.clip.length > 40, copied.clip.slice(0, 60));

  await page.reload();
  await settle(page);
  s = await look();
  check(`${tag} · after reload: the goal, its Week 1, the typed headline and the chosen CTA are all still there`,
    s.goal === 'sell' && s.pressed.join() === 'sell' && s.titles.join() === plans.sell && s.head === mine && s.cta === s.ctas[1] && s.intro === s.G.intro);

  if (width === 360) { // Week 1 with the goal picked, as the phone screen shows it (sticky header and tabs included)
    await page.evaluate(() => { const r = document.querySelector('#weekIntro').getBoundingClientRect(); scrollTo(0, r.top + scrollY - 150); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GOALS_OUT, `week1-360-${lang}.png`) });
  }

  // Tap the chosen goal again: back to the general plan; the typed headline is still the owner's.
  await page.click('[data-goal="sell"]');
  await settle(page);
  s = await look();
  check(`${tag} · tapping the chosen goal again goes back to the general plan and keeps the typed headline`,
    !s.goal && !s.pressed.length && s.titles.join() === GENERAL[lang] && s.head === mine && s.hint === s.ui.goalNone && s.toast === s.ui.goalCleared && s.intro === s.ui.weekIntro);
  check(`${tag} · no page errors, no outside requests`, !log.errors.length && !log.external.length, log.errors.concat(log.external).join(' | '));
  await ctx.close();
}

/* 2c · Uploads, the before/after post and the Luxury style still work with a goal picked. */
async function goalUploads(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, acceptDownloads: true });
  const page = await ctx.newPage();
  const log = watch(page, base);
  await page.goto(base);
  await page.evaluate(() => window.ENMStarter.fontsReady);
  await page.fill('#f_name', 'Arroyo Yard Care');
  await page.click('[data-svc="landscaping"]');
  await page.fill('#f_area', 'Pasadena');
  await page.click('#b_go');
  await settle(page);
  await page.click('[data-goal="proof"]');
  await page.click(`[data-tpl="${LUX}"]`);
  await settle(page);
  const px = () => page.evaluate(() => document.querySelector('#c_story').toDataURL('image/png').length);
  const before = await px();
  await page.click('#b_back');
  await page.setInputFiles('#f_file', path.join(FIX, 'photo-dusk.jpg'));
  await page.waitForTimeout(400);
  await page.click('#b_go');
  await settle(page);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('enm-starter-v1')));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-save="story"]')]);
  const f1 = path.join(TMP, 'goal-upload-story.png'); await dl.saveAs(f1);
  const p1 = pngSize(fs.readFileSync(f1));
  check('Goals · with “Show proof” picked, a photo upload is detected and drawn in Luxury, and the story still saves 1080 × 1920',
    st.goal === 'proof' && st.kind === 'photo' && st.tpl === LUX && (await px()) !== before && p1.w === 1080 && p1.h === 1920, `${st.goal}/${st.kind} ${p1.w}×${p1.h}`);
  await page.setInputFiles('#f_before', path.join(FIX, 'photo-interior.jpg'));
  await page.setInputFiles('#f_after', path.join(FIX, 'photo-spa.jpg'));
  await settle(page);
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('[data-save="ba"]')]);
  const f2 = path.join(TMP, 'goal-ba.png'); await dl2.saveAs(f2);
  const p2 = pngSize(fs.readFileSync(f2));
  check('Goals · with a goal picked, the before & after post (Show proof, day 2) saves a real 1080 × 1350 PNG',
    p2.png && p2.w === 1080 && p2.h === 1350 && dl2.suggestedFilename() === 'arroyo-yard-care-before-after.png', `${dl2.suggestedFilename()} ${p2.w}×${p2.h}`);
  check('Goals · uploads with a goal: no page errors, no outside requests', !log.errors.length && !log.external.length, log.errors.concat(log.external).join(' | '));
  await ctx.close();
}

/* 2d · An owner's phone that saved the kit before goals existed opens to exactly the same kit. With
   --baseline, the old page and this page are compared on the same saved data. */
async function legacy(browser, base, oldBase) {
  const saved = { lang: 'es', name: 'Limpieza Brillante', service: 'cleaning', other: '', area: 'Glendora', desc: '', phone: '(626) 555-0142', handle: '@limpiezabrillante', web: '', email: '',
    owner: 'Sergio', customer: '', review: '', kind: 'photo', tpl: 3, pal: 1, hlIdx: 2, ctaIdx: 1, headline: '', cta: '', hlEdited: false, ctaEdited: false, screen: 'kit', tab: 'w' };
  const open = async url => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    await ctx.addInitScript(s => { localStorage.setItem('enm-starter-v1', s); }, JSON.stringify(saved));
    const page = await ctx.newPage();
    const log = watch(page, url);
    await page.goto(url);
    await settle(page);
    const out = await page.evaluate(() => ({ week: document.querySelector('#p_w').innerText, bio: document.querySelector('#out_b').innerText, msgs: document.querySelector('#out_m').innerText,
      head: document.querySelector('#f_head').value, cta: document.querySelector('#f_cta').value, post: document.querySelector('#c_post').toDataURL(), story: document.querySelector('#c_story').toDataURL(),
      pressed: document.querySelectorAll('#goals [aria-pressed="true"]').length, goals: document.querySelectorAll('#goals button').length }));
    await ctx.close();
    return { out, log };
  };
  const now = await open(base);
  check('Legacy data · a kit saved before goals opens with no goal picked and the general Week 1',
    now.out.goals === 3 && now.out.pressed === 0 && now.out.week.includes('Preséntese') && now.out.week.includes('Dé las gracias') && !now.log.errors.length, now.out.head);
  if (oldBase) {
    const old = await open(oldBase);
    const same = ['week', 'bio', 'msgs', 'head', 'cta', 'post', 'story'].filter(k => now.out[k] !== old.out[k]);
    check('Legacy data · same saved kit, old page vs this page: Week 1, bio, messages, headline, CTA and both Luxury graphics are identical', !same.length, same.join(', ') || 'Week 1, bio, messages, headline, CTA, post, story');
  }
}

/* 2e · No new network use or dependencies: everything is still inside index.html. */
function staticChecks(html, oldHtml) {
  const code = html.replace(/url\(data:[^)]*\)/g, '');
  const remote = code.match(/(?:src|href|action)\s*=\s*["']?\s*(?:https?:)?\/\/[^\s"'>]+/gi) || [];
  const apis = code.match(/\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|import\s*\(|serviceWorker|RTCPeerConnection)/g) || [];
  const csp = h => (h.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1];
  const fonts = (html.match(/@font-face/g) || []).length;
  check('Static · no outside resources or network APIs in index.html (fetch, XHR, sockets, beacons, imports, remote src/href), 7 embedded fonts, page policy unchanged',
    !remote.length && !apis.length && fonts === 7 && /default-src 'none'/.test(csp(html)) && (!oldHtml || csp(html) === csp(oldHtml)),
    `${remote.concat(apis).join(' ') || 'none found'}; ${Buffer.byteLength(html)} bytes${oldHtml ? ` (+${Buffer.byteLength(html) - Buffer.byteLength(oldHtml)} vs baseline)` : ''}`);
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
async function regression(browser, base, old) {
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
      const hashes = {}, styles = A.UI.en.tplNames.length; // every style the page has (Luxury included when present)
      for (let t = 0; t < styles; t++) sets.forEach((v, si) => { for (const lang of ['en', 'es']) for (const [img, kind] of [[null, 'photo'], [photo, 'photo'], [logo, 'logo']]) for (const H of [1350, 1920]) {
        const c = document.createElement('canvas'); c.width = 1080; c.height = H;
        A.render(c.getContext('2d'), 1080, H, A.deriveData(Object.assign({}, A.DEF, v, { lang, kind }), img), t);
        hashes[`${t}/${si}/${lang}/${img ? kind : 'none'}/${H}`] = c.toDataURL('image/png');
      } });
      const ba = document.createElement('canvas'); ba.width = 1080; ba.height = 1350;
      A.tBA(ba.getContext('2d'), A.deriveData(Object.assign({}, A.DEF, sets[0]), null), spa, photo); hashes.ba = ba.toDataURL('image/png');
      // Every piece of generated copy with no goal: bio, about, messages, Week 1, headline and CTA suggestions.
      const texts = {}, full = { name: 'Bright Path Cleaning', area: 'Glendora', phone: '6265550123', handle: 'brightpath', web: 'brightpath.com', email: 'hi@brightpath.com', owner: 'Sergio', customer: 'María', review: 'https://g.page/r/example' };
      for (const lang of ['en', 'es']) for (const service of A.ORDER) for (const [vn, v] of [['full', full], ['minimal', { name: 'Bright Path' }]]) for (const other of ['pool cleaning', 'Clínica estética', 'Bienes raíces'])
        for (const [xn, x] of [['', {}], ['i1', { hlIdx: 1, ctaIdx: 1 }], ['i2', { hlIdx: 2, ctaIdx: 3 }], ['own', { hlEdited: true, headline: 'My words', ctaEdited: true, cta: 'Text me' }]]) {
          if (service !== 'other' && other !== 'pool cleaning') continue;
          const d = A.deriveData(Object.assign({}, A.DEF, v, x, { lang, service, other }), null), C = A.buildCopy(d);
          texts[`${lang}/${service}/${vn}/${other}/${xn}`] = JSON.stringify([C.bio, C.about, C.msgs, C.ideas, d.headline, d.cta, d.hls, d.ctas, d.desc, d.label]);
        }
      return { hashes, texts };
    }, imgs);
    await page.close();
    return out;
  };
  const [a, b] = [await grab(base), await grab(old.base)];
  const keys = Object.keys(b.hashes), diff = keys.filter(k => a.hashes[k] !== b.hashes[k]);
  const styles = [...new Set(keys.filter(k => k !== 'ba').map(k => k.split('/')[0]))].length;
  check(`Regression · all ${styles} graphics styles${styles > 3 ? ' (Luxury included)' : ''} and before/after are pixel-identical to the baseline page`, keys.length > 100 && !diff.length, `${keys.length} renders compared, ${diff.length} differ${diff.length ? ': ' + diff.slice(0, 3).join(', ') : ''}`);
  const tk = Object.keys(b.texts), td = tk.filter(k => a.texts[k] !== b.texts[k]);
  check('Regression · with no goal picked, every bio, about, message, Week 1 idea, headline and CTA matches the baseline page word for word', tk.length > 100 && !td.length && Object.keys(a.texts).length === tk.length, `${tk.length} states compared, ${td.length} differ${td.length ? ': ' + td.slice(0, 3).join(', ') : ''}`);
  // The setup screen's example fan, as an owner first sees it.
  const shot = async url => { const p = await browser.newPage({ viewport: { width: 412, height: 900 } }); await p.goto(url); await p.evaluate(() => window.ENMStarter.fontsReady); await p.waitForTimeout(500);
    const d = await p.evaluate(() => [...document.querySelectorAll('.fan canvas')].map(c => c.toDataURL()).join()); await p.close(); return d; };
  check('Regression · the example fan on the setup screen is unchanged', (await shot(base)) === (await shot(old.base)));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const app = remote ? { base: remote, server: { close() {} } } : await serve(html);
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  if (remote) { // test exactly what the deployed copy serves, and record whether it matches this checkout
    const page = await browser.newPage();
    const res = await page.goto(remote + '/');
    const served = await res.text(), h = res.headers();
    check(`Deployed copy · ${remote} answers 200 with the production headers`, res.ok() && /default-src 'none'/.test(h['content-security-policy'] || '') && /nosniff/.test(h['x-content-type-options'] || ''), `${res.status()} ${h['content-type']}`);
    check('Deployed copy · serves the same index.html as this checkout', served === html, `${Buffer.byteLength(served)} bytes`);
    html = served;
    await page.close();
  }
  let ms = null;
  try {
    const oldHtml = baselineFile ? fs.readFileSync(baselineFile, 'utf8') : null;
    const old = oldHtml ? await serve(oldHtml) : null;
    try {
      staticChecks(html, oldHtml);
      await selfTest(browser, app.base);
      for (const width of [320, 360, 412]) for (const lang of ['en', 'es']) await uiFlow(browser, app.base, width, lang);
      for (const width of [320, 360, 412]) for (const lang of ['en', 'es']) await goalFlow(browser, app.base, width, lang);
      await goalUploads(browser, app.base);
      await legacy(browser, app.base, old && old.base);
      await uploads(browser, app.base);
      ms = await timing(browser, app.base);
      if (old) await regression(browser, app.base, old);
    } finally { if (old) old.server.close(); }
  } finally {
    await browser.close();
    app.server.close();
  }
  const failed = results.filter(r => !r.pass);
  fs.writeFileSync(path.join(OUT, remote ? 'results-preview.json' : 'results.json'), JSON.stringify({
    url: remote || null,
    page: { bytes: Buffer.byteLength(html), fonts: (html.match(/@font-face/g) || []).length },
    chromium: browser.version(), renderMs: ms && { editorial: +ms[0].toFixed(2), poster: +ms[1].toFixed(2), grid: +ms[2].toFixed(2), luxury: +ms[3].toFixed(2) },
    baseline: baselineFile ? path.basename(baselineFile) : null, passed: results.length - failed.length, total: results.length, results
  }, null, 2) + '\n');
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
