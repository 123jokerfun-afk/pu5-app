const B=require('./base'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs,ctx}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page,'ПЧ-1'); await S.seed(page);
await page.waitForTimeout(2200);
ok('Эхлээд бүх зүйл илгээгдсэн',await page.evaluate(()=>!_dirtyAt()),'dirty='+await page.evaluate(()=>_dirtyAt()));

// ── Сүлжээгүй болгож ажил хийх ──
await page.evaluate(()=>{
  window.__sent=0;
  const orig=fbDb.collection;
  fbDb.collection=function(c){const r=orig.call(fbDb,c);const od=r.doc;
    r.doc=function(id){const d=od.call(r,id);const os=d.set;
      d.set=function(v){if(window.__offline)return Promise.reject(new Error('offline'));
        window.__sent++;return os.call(d,v)};return d};return r}});
await page.evaluate(()=>{window.__offline=true;
  openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);
  record('bad',null);record('bad',null)});
await page.waitForTimeout(1500);
ok('Сүлжээгүйд "илгээгдээгүй" тэмдэг асав',await page.evaluate(()=>!!_dirtyAt()),'dirty='+await page.evaluate(()=>_dirtyAt()));
ok('Утсанд хадгалагдав',await page.evaluate(()=>{const d=_lsRead();return !!d}));
const badge=await page.evaluate(()=>{const b=document.querySelector('.save-badge');return b?b.textContent.replace(/\s+/g,' ').trim():'алга'});
ok('Тэмдэг хэрэглэгчид харагдав',/лгээгдээгүй/.test(badge),badge);

// ── Апп хаагаад дахин нээх (шинэ хуудас, ижил хадгалалт) ──
const nSent=await page.evaluate(()=>window.__sent);
await page.evaluate(()=>{window.__offline=false});
await page.evaluate(()=>{window.dispatchEvent(new Event('online'))});
await page.waitForTimeout(1200);
ok('Сүлжээ ормогц өөрөө илгээгдэв',await page.evaluate(()=>window.__sent)>nSent,
   'sent '+nSent+' → '+await page.evaluate(()=>window.__sent));
ok('Тэмдэг унтрав',await page.evaluate(()=>!_dirtyAt()),'dirty='+await page.evaluate(()=>_dirtyAt()));

// ── Дахин нээхэд ажил алдагдаагүй ──
const n1=await page.evaluate(()=>DB.folders[0].tracks[0].sections[0].sleepers.length);
await page.reload({waitUntil:'load'});
await B.login(page,'ПЧ-1');
await page.waitForTimeout(800);
const n2=await page.evaluate(()=>{const f=DB.folders.find(x=>x.id==='f-test1');return f?f.tracks[0].sections[0].sleepers.length:-1});
ok('Дахин нээхэд ажил бүрэн үлдэв',n1===n2,n1+' → '+n2);

console.log('\nERRORS:',JSON.stringify(errs.slice(0,3),null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
