const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:360,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://127.0.0.1:8765/#selftest');await p.waitForFunction(()=>window.__selftest,null,{timeout:120000});
const r=await p.evaluate(()=>window.__selftest);console.log(`${r.pass}/${r.total}`);r.results.filter(x=>!x.pass).forEach(x=>console.log('FAIL',x.n,x.info));
console.log('title',await p.title());console.log('errors',errs);await b.close()})();
