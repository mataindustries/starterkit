/* Capture only the unmodified local product. No HTML/CSS injection or mocked UI. */
const fs = require('node:fs');
const path = require('node:path');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(__dirname,'.cache/browsers');
const {chromium} = require('playwright');
const http = require('node:http');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const ASSET = path.join(__dirname, 'assets');
fs.mkdirSync(ASSET, {recursive:true});
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const baseline = Object.fromEntries(['index.html','_headers','README.md'].map(p=>[p,hash(p)]));
const source = fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const events = [];
async function main(){
  // Reuse the installed FFmpeg binary rather than downloading another copy.
  const browsers=JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('playwright-core')),'browsers.json'))).browsers;
  const revision=browsers.find(x=>x.name==='ffmpeg').revision;
  const videoEncoder=path.join(process.env.PLAYWRIGHT_BROWSERS_PATH,'ffmpeg-'+revision,'ffmpeg-linux');
  fs.mkdirSync(path.dirname(videoEncoder),{recursive:true});
  if(!fs.existsSync(videoEncoder))fs.symlinkSync('/usr/bin/ffmpeg',videoEncoder);
  const server = http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(source)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const context = await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2,locale:'en-US',recordVideo:{dir:path.join(__dirname,'.cache/capture'),size:{width:412,height:915}},acceptDownloads:true});
  const page = await context.newPage();
  const video = page.video();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const start=Date.now();
  const event = n=>events.push({name:n,seconds:(Date.now()-start)/1000});
  const shot = async(name,loc)=>{await page.evaluate(()=>window.ENMStarter.fontsReady);await (loc||page).screenshot({path:path.join(ASSET,name+'.png')});};
  const wait=ms=>page.waitForTimeout(ms);
  const base='http://127.0.0.1:'+server.address().port;
  try{
    await page.goto(base);await page.evaluate(()=>window.ENMStarter.fontsReady);
    // Initial preparatory details are genuine form entries; film uses a time-compressed cut.
    await page.locator('#f_area').fill('San Gabriel Valley');
    await page.locator('#f_phone').fill('6265550142');
    await page.locator('#f_name').scrollIntoViewIfNeeded();await wait(400);
    event('typing-start');
    await page.locator('#f_name').pressSequentially('Luna Cleaning',{delay:90});
    event('typing-end');await wait(450);
    await shot('setup');
    await page.locator('[data-svc="cleaning"]').click();
    await page.locator('#b_go').scrollIntoViewIfNeeded();await wait(300);
    event('make-kit');await page.locator('#b_go').click();await wait(900);
    event('kit-visible');
    await page.locator('[data-pal="0"]').click();await wait(800);
    await shot('kit');
    const copy={};
    for(const lang of ['en','es']){
      await page.locator('[data-lang="'+lang+'"]').click();await wait(900);
      for(const kind of ['post','story']){
        const downloadPromise=page.waitForEvent('download');
        await page.locator('[data-save="'+kind+'"]').click();
        const download=await downloadPromise;
        await download.saveAs(path.join(ASSET,kind+'-'+lang+'.png'));
      }
      copy[lang] = await page.evaluate(()=>{
        const a=window.ENMStarter,s=JSON.parse(localStorage.getItem('enm-starter-v1'));
        const d=a.deriveData(s,null);
        return {state:s,headline:d.headline,cta:d.cta,copy:a.buildCopy(d)};
      });
      for(const [tab,name,sel] of [['b','bio','#out_b .out'],['m','messages','#out_m .out'],['w','week','#out_w .out']]){
        await page.locator('[data-tab="'+tab+'"]').click();await wait(220);
        await shot(name+'-'+lang,page.locator(sel).nth(name==='messages'?1:0));
        await shot('ui-'+name+'-'+lang);
      }
      if(lang==='en'){
        await page.locator('[data-tab="g"]').click();await page.evaluate(()=>scrollTo(0,0));await wait(300);
        event('spanish-switch');await page.locator('[data-lang="es"]').click();await wait(600);
        await shot('language-switch');
      }
    }
    fs.writeFileSync(path.join(ASSET,'outputs.json'),JSON.stringify(copy,null,2)+'\n');
    const testPage=await browser.newPage();await testPage.goto(base+'/#selftest');
    await testPage.waitForFunction(()=>document.querySelector('#selftest li')&&!document.querySelector('#selftest').innerText.includes('Running'));
    const selftest=await testPage.locator('#selftest').innerText();
    fs.writeFileSync(path.join(ASSET,'product-selftest.txt'),selftest+'\n');await testPage.close();
    await context.close();await video.saveAs(path.join(ASSET,'real-session.webm'));
    const manifest={product:'NextCustomer / Starter Kit',sourceCommit:spawnSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).stdout.trim(),baseline,viewport:{width:412,height:915,deviceScaleFactor:2},fictionalBusiness:true,examplePhone:'US reserved fictional range 555-0100–0199',events,errors,selftestSummary:selftest.split('\n').find(x=>x.includes('passed')),exports:{post:[1080,1350],story:[1080,1920]},capture:'Real Playwright UI interaction and Save image downloads from the unchanged local index.html; no mock UI.'};
    fs.writeFileSync(path.join(ASSET,'capture-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
    // Extract the original embedded WOFFs, without alteration or external assets.
    const fontdir=path.join(ASSET,'fonts');fs.mkdirSync(fontdir,{recursive:true});
    const re=/@font-face\{font-family:"([^"]+)";font-weight:(\d+);font-style:(\w+);[^}]*base64,([^\)]+)/g;
    for(const match of source.matchAll(re)){
      fs.writeFileSync(path.join(fontdir,match[1].replaceAll(' ','')+'-'+match[2]+'-'+match[3]+'.woff'),Buffer.from(match[4],'base64'));
    }
    console.log(JSON.stringify(manifest,null,2));
  }finally{
    await browser.close();await new Promise(r=>server.close(r));
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
