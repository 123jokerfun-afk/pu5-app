/* ══════════════════════════════════════════════════════════════
   ХУРД БА ГАРАХ ТОВЧ (v107)

   · service worker бүртгэгдэж, кэшилж, version.txt-г кэшлэхгүй
   · ExcelJS зөвхөн экспорт дарахад л татагдана
   · Нүүрэн дээр гарах товч БАЙХГҮЙ
   · Профайлын гарах товч Тийм/Үгүй-гээр баталгаажина
   ══════════════════════════════════════════════════════════════ */
const fs=require('fs'),path=require('path');
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

/* ── Эх кодын шалгалт: ачаалалтыг хаадаг зүйл үлдсэн эсэх ── */
const H=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
ok('ExcelJS ачаалалтын үед ТАТАГДАХГҮЙ',
   !/<script[^>]*exceljs[^>]*>/i.test(H),
   (H.match(/<script[^>]*exceljs[^>]*>/i)||[''])[0]);
ok('sw.js байгаа',fs.existsSync(path.join(__dirname,'..','sw.js')));
const SW=fs.existsSync(path.join(__dirname,'..','sw.js'))
  ?fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'):'';
ok('sw.js нь version.txt-г кэшлэхгүй',/version\\\.txt/.test(SW)&&/return/.test(SW));
ok('sw.js өөр хувилбарын кэшийг устгана',/caches\.delete/.test(SW));
ok('Аппад кэш хаях аврах гарц бий',/PU5_CLEAR/.test(H)&&/PU5_CLEAR/.test(SW));

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

/* ── 1. ExcelJS нээлтэд ачаалагдаагүй байх ёстой ── */
const before=await page.evaluate(()=>({has:!!window.ExcelJS,
  tag:!![...document.scripts].find(s=>/exceljs/.test(s.src||''))}));
ok('Нээхэд ExcelJS ачаалагдаагүй',!before.has&&!before.tag,JSON.stringify(before));

/* ── 2. Экспорт дарахад л татагдана ── */
const after=await page.evaluate(async()=>{
  const t0=performance.now();
  const okk=await ensureExcel();
  return {okk,has:!!window.ExcelJS,ms:Math.round(performance.now()-t0),
    tag:!![...document.scripts].find(s=>/exceljs/.test(s.src||''))}});
ok('ensureExcel татаж, ExcelJS бэлэн болов',after.okk&&after.has&&after.tag,
   after.ms+' мс');
const twice=await page.evaluate(async()=>{
  const n=[...document.scripts].filter(s=>/exceljs/.test(s.src||'')).length;
  await ensureExcel();
  return {n,n2:[...document.scripts].filter(s=>/exceljs/.test(s.src||'')).length}});
ok('Дахин дуудахад давхар татахгүй',twice.n===twice.n2,JSON.stringify(twice));

/* ── 3. Экспорт бүтэн ажиллана (ачаалагчаар дамжин) ── */
const exp=await page.evaluate(async()=>{
  window.__dl=null;
  window.dlBlob=(b,n)=>{window.__dl={name:n,size:b&&b.size||0}};
  window.__realConfirm=window.appConfirm;
  window.appConfirm=()=>Promise.resolve(true);
  delete window.ExcelJS;              // огт татаагүй байдалд буцаана
  const mk=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},(_,i)=>({type:i%7===0?'bad':'normal',ts:0}))});
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  DB.folders=[{id:'fx',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'t1',num:1,kind:'station',sections:[mk('s1',46)]}]}];
  activeFolderId='fx';DB.tracks=DB.folders[0].tracks;
  await exportPu5Book('folder');
  await new Promise(r=>setTimeout(r,600));
  return window.__dl});
ok('ExcelJS-гүй байдлаас экспорт бүтэн гарна',
   !!exp&&/\.xlsx$/.test(exp.name)&&exp.size>0,JSON.stringify(exp));

/* ── 4. Нүүрэн дээр гарах товч БАЙХГҮЙ ── */
const home=await page.evaluate(async()=>{
  window.appConfirm=window.__realConfirm;   // жинхэнэ асуултыг сэргээнэ
  goHome();await new Promise(r=>setTimeout(r,400));
  const hero=document.querySelector('#homeView .hero');
  return {heroLogout:[...hero.querySelectorAll('button')]
      .filter(b=>/Гарах/.test(b.getAttribute('aria-label')||'')||/Гарах/.test(b.textContent)).length,
    heroBtns:[...hero.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')||b.textContent.trim().slice(0,12))}});
ok('Нүүрэн дээр гарах товч алга',home.heroLogout===0,JSON.stringify(home.heroBtns));

/* ── 5. Профайлын гарах товч Тийм/Үгүй-гээр асууна ── */
const q=await page.evaluate(async()=>{
  openProfSheet();await new Promise(r=>setTimeout(r,350));
  const row=[...document.querySelectorAll('#profBody .pf-row')]
    .find(b=>/Гарах/.test(b.textContent));
  if(!row)return {err:'Профайл дээр гарах товч алга'};
  row.click();
  await new Promise(r=>setTimeout(r,450));
  const m=document.getElementById('appConfirmModal');
  return {open:m.classList.contains('open'),
    msg:document.getElementById('appConfirmMsg').textContent,
    ok:document.getElementById('appConfirmOkBtn').textContent,
    cancel:document.getElementById('appConfirmCancelBtn').textContent}});
ok('Гарах дарахад асуух самбар гарна',q.open===true,JSON.stringify(q));
ok('Товчнууд "Тийм" / "Үгүй"',q.ok==='Тийм'&&q.cancel==='Үгүй',
   JSON.stringify([q.ok,q.cancel]));

/* ── 6. "Үгүй" дарвал ГАРАХГҮЙ ── */
const no=await page.evaluate(async()=>{
  document.getElementById('appConfirmCancelBtn').click();
  await new Promise(r=>setTimeout(r,500));
  return {view:(document.querySelector('.view.active')||{}).id,code:_sectionCode}});
ok('"Үгүй" дарвал нэвтэрсэн хэвээр',no.view!=='loginView'&&!!no.code,JSON.stringify(no));

/* ── 7. "Тийм" дарвал ГАРНА ── */
const yes=await page.evaluate(async()=>{
  doLogout();
  await new Promise(r=>setTimeout(r,400));
  document.getElementById('appConfirmOkBtn').click();
  await new Promise(r=>setTimeout(r,700));
  return {view:(document.querySelector('.view.active')||{}).id,code:_sectionCode}});
ok('"Тийм" дарвал нэвтрэх дэлгэц рүү гарна',
   yes.view==='loginView'&&!yes.code,JSON.stringify(yes));

/* ── 8. Service worker жинхэнээсээ ажиллаж, офлайн болгож байна уу ──
   Тусдаа контекст: base.js-ийн stub нь Firebase-г орлуулдаг ч SW нь
   нэг гарлын файлуудыг өөрөө кэшилнэ. */
const swr=await (async()=>{
  const base=await B.ensureServer();
  const ctx2=await br.newContext();
  const p2=await ctx2.newPage();
  await p2.goto(base+'/index.html',{waitUntil:'load'});
  // Идэвхжтэл нь хүлээнэ
  let act=false;
  try{
    await p2.waitForFunction(async()=>{
      const r=await navigator.serviceWorker.getRegistration();
      return !!(r&&r.active)},{timeout:15000});
    act=true
  }catch(e){}
  const cached=await p2.evaluate(async()=>{
    const ks=await caches.keys();
    const pu5=ks.filter(k=>k.startsWith('pu5-'));
    let hasIdx=false,hasVer=false;
    for(const k of pu5){
      const c=await caches.open(k);
      if(await c.match('index.html'))hasIdx=true;
      const all=await c.keys();
      if(all.some(r=>/version\.txt/.test(r.url)))hasVer=true;
    }
    return {keys:pu5,hasIdx,hasVer}});
  // Сүлжээ таслаад дахин нээнэ — кэшнээс гарах ёстой
  await ctx2.setOffline(true);
  let offline=false,offErr='';
  try{
    await p2.goto(base+'/index.html',{waitUntil:'domcontentloaded',timeout:15000});
    offline=await p2.evaluate(()=>!!document.getElementById('loginView'));
  }catch(e){offErr=(e&&e.message||'').split('\n')[0]}
  await ctx2.setOffline(false);
  await ctx2.close();
  return {act,...cached,offline,offErr}
})();
ok('Service worker идэвхжив',swr.act,JSON.stringify(swr.keys));
ok('index.html кэшлэгдсэн',swr.hasIdx);
ok('version.txt кэшлэгдээгүй',!swr.hasVer);
ok('Сүлжээгүй үед апп кэшнээс нээгдэнэ',swr.offline,swr.offErr);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
