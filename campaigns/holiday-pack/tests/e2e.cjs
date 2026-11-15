const {chromium}=require('playwright');const fs=require('fs');const SP=__dirname;
const URL='http://127.0.0.1:8765/';let fails=0,checks=0;const ok=(c,n)=>{checks++;if(!c){fails++;console.log('FAIL',n)}};
const png=f=>{const b=fs.readFileSync(f);return[b.readUInt32BE(16),b.readUInt32BE(20)]};
(async()=>{const b=await chromium.launch();
for(const w of [320,360,412]){
 const ctx=await b.newContext({viewport:{width:w,height:780},deviceScaleFactor:2,acceptDownloads:true,hasTouch:true,isMobile:true,
   userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const reqs=[];p.on('request',r=>{const u=r.url();if(!u.startsWith(URL)&&!u.startsWith('data:')&&!u.startsWith('blob:'))reqs.push(u)});
 await p.goto(URL);await p.waitForTimeout(500);
 const ovf=async n=>ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${w} no horizontal scroll: ${n}`);
 ok((await p.textContent('.brand span'))==='NextCustomer',`${w} header brand`);ok((await p.title()).startsWith('NextCustomer'),`${w} title`);await ovf('setup');
 await p.screenshot({path:`${SP}/../shots-out/${w}-1-setup-en.png`});
 await p.fill('#f_name','Bright Path Cleaning');await p.fill('#f_area','Glendora');await p.fill('#f_phone','6265550142');
 await p.setInputFiles('#f_file',`${SP}/photo.jpg`);await p.waitForTimeout(400);ok(await p.isVisible('#imgbox'),`${w} gallery upload`);
 await p.setInputFiles('#f_camera',`${SP}/photo.jpg`);await p.waitForTimeout(400);ok(await p.isVisible('#imgbox'),`${w} camera input accepts a photo`);
 ok(await p.getAttribute('#f_camera','capture')==='environment',`${w} camera input`);
 await p.click('#b_go');await p.waitForTimeout(900);ok(await p.isVisible('#kit'),`${w} kit shown`);await ovf('kit');
 const hl0=await p.inputValue('#f_head');ok(hl0==="Come home to clean.",`${w} everyday headline ${hl0}`);
 ok((await p.$$('#seasons .chip')).length===4,`${w} 4 season chips`);
 await p.click('[data-season=ready]');await p.waitForTimeout(500);
 ok((await p.inputValue('#f_head'))==="Holiday guests coming? Let's get your home ready.",`${w} ready headline`);
 ok((await p.inputValue('#f_cta'))==="Ask about availability",`${w} ready cta`);
 ok(await p.isVisible('#out_season .txt'),`${w} season caption`);await ovf('season');
 await p.click('#b_head');await p.waitForTimeout(300);ok((await p.inputValue('#f_head'))==="A clean home before the holidays.",`${w} another headline`);
 await p.click('#b_cta');await p.waitForTimeout(300);ok((await p.inputValue('#f_cta'))==="Message us for a quote",`${w} another cta`);
 await p.fill('#f_head','Ready for holiday guests?');await p.fill('#f_cta','Text us for a quote');await p.fill('#f_gname','Bright Path Home Cleaning');await p.waitForTimeout(500);
 ok((await p.inputValue('#f_name'))==='Bright Path Home Cleaning',`${w} name syncs to setup`);ok((await p.textContent('#kitTitle'))==='Bright Path Home Cleaning',`${w} kit title updates`);
 await p.setInputFiles('#f_file2',`${SP}/photo.jpg`);await p.waitForTimeout(400);ok(await p.isVisible('#gimg'),`${w} graphics photo upload`);
 ok(await p.getAttribute('#f_camera2','capture')==='environment',`${w} graphics camera input`);
 await p.waitForTimeout(900);
 await p.locator('#seasons').scrollIntoViewIfNeeded();await p.evaluate(()=>scrollBy(0,-120));await p.screenshot({path:`${SP}/../shots-out/${w}-2-graphics-ready-controls.png`});
 await p.locator('#c_post').scrollIntoViewIfNeeded();await p.waitForTimeout(200);await p.screenshot({path:`${SP}/../shots-out/${w}-3-graphics-ready-post.png`});
 const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-save=post]')]);const f=`${SP}/../shots-out/dl-${w}-${dl.suggestedFilename()}`;await dl.saveAs(f);
 ok(dl.suggestedFilename()==='bright-path-home-cleaning-post-holiday-ready-editorial.png',`${w} filename ${dl.suggestedFilename()}`);
 ok(png(f).join()==='1080,1350',`${w} post png dims ${png(f)}`);
 const [dl2]=await Promise.all([p.waitForEvent('download'),p.click('[data-save=story]')]);const f2=`${SP}/../shots-out/dl-${w}-${dl2.suggestedFilename()}`;await dl2.saveAs(f2);
 ok(png(f2).join()==='1080,1920',`${w} story png dims ${png(f2)}`);
 const shareBtn=await p.$('[data-share=post]');
 if(shareBtn){await p.evaluate(()=>{window.__shared=null;navigator.canShare=()=>true;navigator.share=async o=>{const f=o.files[0];window.__shared=[f.name,f.type,f.size]}});
   await shareBtn.click();await p.waitForTimeout(600);const s=await p.evaluate(()=>window.__shared);ok(s&&s[1]==='image/png'&&s[2]>20000,`${w} native share file ${s}`)}
 else console.log(w,'share button hidden: headless Chromium has no file sharing, save fallback used');
 for(const t of [1,2,0]){await p.click(`[data-tpl="${t}"]`);await p.waitForTimeout(250)}
 await p.click('[data-season=shop]');await p.waitForTimeout(400);ok((await p.inputValue('#f_head'))==="Shop small. Hire local.",`${w} shop headline`);
 await p.click('[data-season=ready]');await p.waitForTimeout(400);ok((await p.inputValue('#f_head'))==='Ready for holiday guests?',`${w} ready edits restored`);
 ok((await p.inputValue('#f_cta'))==='Text us for a quote',`${w} ready cta restored`);
 await p.click('[data-season=""]');await p.waitForTimeout(400);ok((await p.inputValue('#f_head'))===hl0,`${w} everyday restored`);ok(!(await p.isVisible('#out_season .txt')),`${w} caption hidden on everyday`);
 await p.click('[data-season=thanks]');await p.click('[data-lang=es]');await p.waitForTimeout(600);
 ok((await p.inputValue('#f_head'))==='Gracias, vecinos.',`${w} es headline`);ok((await p.textContent('#seasons .chip[aria-checked=true]')).includes('Gracias, vecinos'),`${w} es chip`);
 ok((await p.title()).includes('Kit de marketing gratis'),`${w} es title`);await ovf('es');
 await p.click('[data-tpl="1"]');await p.waitForTimeout(800);
 await p.locator('#seasons').scrollIntoViewIfNeeded();await p.evaluate(()=>scrollBy(0,-120));await p.screenshot({path:`${SP}/../shots-out/${w}-4-graphics-thanks-es.png`});
 await p.locator('#out_season').scrollIntoViewIfNeeded();await p.waitForTimeout(200);await p.screenshot({path:`${SP}/../shots-out/${w}-5-caption-es.png`});
 await p.setInputFiles('#f_before',`${SP}/before.jpg`);await p.setInputFiles('#f_after',`${SP}/after.jpg`);await p.waitForTimeout(900);
 const [dl3]=await Promise.all([p.waitForEvent('download'),p.click('[data-save=ba]')]);const f3=`${SP}/../shots-out/dl-${w}-ba.png`;await dl3.saveAs(f3);
 ok(dl3.suggestedFilename().endsWith('-before-after.png')&&png(f3).join()==='1080,1350',`${w} before/after save`);
 for(const t of ['b','m','w','g']){await p.click(`[data-tab=${t}]`);await p.waitForTimeout(150);await ovf('tab '+t)}
 await p.reload();await p.waitForTimeout(1200);ok(await p.isVisible('#kit'),`${w} kit persists`);ok((await p.inputValue('#f_head'))==='Gracias, vecinos.',`${w} season persists`);
 ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('enm-starter-v1')).season==='thanks'),`${w} saved under original key`);ok(await p.isVisible('#gimg'),`${w} image persists`);
 ok(!reqs.length,`${w} no outside requests ${reqs}`);ok(!errs.length,`${w} errors ${errs}`);
 await ctx.close()}
const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();
await p.addInitScript(()=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('enm-starter-v1',JSON.stringify({lang:"es",name:"Viejo Negocio",service:"landscaping",screen:"kit",tab:"g",tpl:1,pal:1,hlIdx:0,ctaIdx:0,headline:"Mi título",hlEdited:true}))}});
await p.goto(URL);await p.waitForTimeout(1000);ok((await p.inputValue('#f_head'))==='Mi título',`legacy headline kept`);
ok((await p.textContent('#seasons .chip[aria-checked=true]'))==='Todo el año',`legacy state opens on everyday`);
await b.close();console.log(`${checks-fails}/${checks} browser checks passed`);process.exit(fails?1:0)})();
