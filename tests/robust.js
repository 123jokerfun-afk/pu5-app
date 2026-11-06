/* Найдвартай байдлын гурван алдааны хамгаалалт:
   1) Огноо — toISOString() нь UTC тул УБ-ын 00:00–07:59-д өчигдрийн огноо
      гардаг байсан. Утасны цагийг УБ-ын шөнийн 01:30 болгож шалгана.
   2) Утсанд бичиж чадаагүй (санах ой дүүрсэн) үед дуугүй өнгөрдөг байсан.
   3) Хэрэглэгчийн бичсэн салбар замын нэр, үеийн нэр HTML-ээр escape
      хийгдэлгүй солилтын тайланд ордог байсан. */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');

// ── 1. Огноо: 2026-09-24T17:30Z = УБ-ын 2026-09-25 01:30 ──
console.log('\nОгноо (УБ-ын шөнө)');
await page.clock.setFixedTime(new Date('2026-09-24T17:30:00Z'));
const dt=await page.evaluate(()=>{
  const out={today:mnTodayStr()};
  openAddFolder();out.af=document.getElementById('afDate').value;closeModal('addFolderModal');
  openSwFolder();out.swf=document.getElementById('swfDate').value;closeModal('swFolderModal');
  return out});
ok('mnTodayStr() УБ-ын өнөөдөр', dt.today==='2026-09-25', dt.today);
ok('Шинэ дэрийн паспортын огноо өчигдөр биш', dt.af==='2026-09-25', dt.af);
ok('Шинэ сумын паспортын огноо өчигдөр биш', dt.swf==='2026-09-25', dt.swf);
await page.clock.setFixedTime(new Date('2026-09-25T09:00:00Z'));   // УБ 17:00
ok('Өдрийн цагт ч зөв', await page.evaluate(()=>mnTodayStr())==='2026-09-25');
const leftover=await page.evaluate(()=>[...document.scripts].map(s=>s.textContent).join('')
  .split('new Date().toISOString().slice(0,10)').length-1);
ok('UTC огнооны хуучин хэлбэр кодонд үлдээгүй', leftover===0, leftover);

// ── 2. Утсанд бичиж чадаагүй ──
console.log('\nУтасны санах ой дүүрэх');
const ls=await page.evaluate(()=>{
  const e0=document.getElementById('errBanner');if(e0)e0.remove();
  _lsWarnAt=0;
  const orig=Storage.prototype.setItem;
  Storage.prototype.setItem=function(){const e=new Error('quota');e.name='QuotaExceededError';throw e};
  let threw=false;
  try{saveDB()}catch(e){threw=true}
  const b1=document.getElementById('errBanner');
  const t1=b1?b1.textContent:'';
  if(b1)b1.remove();
  saveDB();                                   // минут дотор дахин — давтахгүй
  const again=!!document.getElementById('errBanner');
  Storage.prototype.setItem=orig;
  clearTimeout(_saveTimer);
  return {threw,t1,again}});
ok('saveDB алдаа шидэхгүй', !ls.threw);
ok('Хэрэглэгчид мэдэгдэнэ', /хадгалж чадсангүй/.test(ls.t1), ls.t1.slice(0,60));
ok('Дэр товших бүрд давтагдахгүй', !ls.again);

// ── 3. HTML тарилга ──
console.log('\nHTML тарилга');
const x=await page.evaluate(()=>{
  window.__xss=0;
  const evil='<img src=x onerror="window.__xss=1">';
  const sec={id:'X1',label:'1-р үе'+evil,type:'normal',note:'',
    sleepers:Array.from({length:6},()=>({type:'normal',ts:0})),
    repl:{1:{d:'2026-09-20',t:'normal',m:'wood',o:1},2:{d:'2026-09-21',t:'normal',m:'wood',o:1,s:1}}};
  DB.folders=[{id:'FX',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
    tracks:[{id:'TX',num:9,name:'Нефть'+evil,kind:'station',note:'',sections:[sec]}]}];
  activeFolderId='FX';DB.tracks=DB.folders[0].tracks;saveDB();clearTimeout(_saveTimer);
  openReplReport();
  const body=document.getElementById('replReportBody');
  const html=body.innerHTML;
  return {imgs:body.querySelectorAll('img').length,shown:/Нефть&lt;img/.test(html),
    txt:body.textContent.includes('Нефть<img')}});
await page.waitForTimeout(300);
const fired=await page.evaluate(()=>window.__xss);
ok('Солилтын тайланд <img> элемент үүсэхгүй', x.imgs===0, x.imgs);
ok('Нэр нь текстээрээ харагдана', x.shown&&x.txt);
ok('Скрипт ажиллаагүй', fired===0, fired);
const rp=await page.evaluate(()=>{
  window.__xss=0;
  document.getElementById('rptSecName').value='ПД<img src=x onerror="window.__xss=2">';
  updateRptPreview();
  return document.getElementById('rptPreview').querySelectorAll('img').length});
await page.waitForTimeout(200);
ok('Тайлангийн тохиргооны урьдчилсан харагдац хамгаалагдсан', rp===0&&await page.evaluate(()=>window.__xss)===0);
const eb=await page.evaluate(()=>{
  _errBanner('<b>t</b>','<img src=x onerror="window.__xss=3">');
  const b=document.getElementById('errBanner');const n=b.querySelectorAll('img,b').length;b.remove();return n});
ok('Алдааны мөр HTML тайлбарлахгүй', eb===0, eb);

// ── 5. Гарахад илгээгдээгүй өөрчлөлт ──
console.log('\nГарах үеийн илгээлт');
{
  const r=await page.evaluate(async()=>{
    window.__order=[];
    const o1=_pushCloud;_pushCloud=p=>o1(p).then(x=>{__order.push('write');return x});
    const o2=fbAuth.signOut.bind(fbAuth);fbAuth.signOut=()=>{__order.push('out');return o2()};
    DB.folders[0].name='Гарахын өмнөх өөрчлөлт';saveDB();
    const key='sg_der_dirty_'+_sectionCode;
    const before=!!localStorage.getItem(key);
    _doLogoutCore();
    await new Promise(r=>setTimeout(r,1500));
    _pushCloud=o1;
    return {before,after:!!localStorage.getItem(key),order:__order.join(','),loaded:_cloudLoaded,had:_cloudHadData}});
  ok('Гарахаас өмнө илгээгдээгүй тэмдэг байсан', r.before);
  ok('Илгээлт дууссаны ДАРАА нэвтрэлтээс гарна', r.order==='write,out', r.order);
  ok('ПД-6-ийн илгээгдээгүй тэмдэг арилна', !r.after);
  ok('Гарсны дараа "үүл уншсан" тэмдэг үлдэхгүй', r.loaded===false&&r.had===false, JSON.stringify([r.loaded,r.had]));
  await B.login(page,'ПД-6');
}
{
  // Гарсны дараа илгээлт дуусахаас өмнө ИЖИЛ хэсгээр дахин нэвтэрвэл
  // хойшлогдсон гаралт шинэ сессийг гаргах ёсгүй
  await page.evaluate(()=>{
    const o1=_pushCloud;window.__o1=o1;
    _pushCloud=p=>new Promise(r=>setTimeout(r,3000)).then(()=>o1(p));
    DB.folders[0].name='Удаан илгээлт';saveDB();_doLogoutCore()});
  await B.login(page,'ПД-6');
  await page.waitForTimeout(2500);
  const st=await page.evaluate(()=>{_pushCloud=window.__o1;
    return {user:!!fbAuth.currentUser,home:document.getElementById('homeView').classList.contains('active')}});
  ok('Шууд дахин нэвтэрсэн сесс хойшлогдсон гаралтад унахгүй', st.user&&st.home, JSON.stringify(st));
}

// ── 6. Нийт дэр оруулах — андуурч хэт их тоо ──
console.log('\nНийт дэр оруулах');
{
  const r=await page.evaluate(async()=>{
    const sec={id:'BX',label:'1-р үе',type:'normal',note:'',sleepers:[]};
    DB.folders=[{id:'FB',name:'Б',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
      tracks:[{id:'TB',num:2,kind:'station',note:'',sections:[sec]}]}];
    activeFolderId='FB';DB.tracks=DB.folders[0].tracks;openTrack('TB',1);openSection('BX',0);
    const o=window.appConfirm;let asked='';
    window.appConfirm=m=>{asked=m;return Promise.resolve(false)};
    document.getElementById('bulkN').value='4600';await applyBulk();
    const refused=activeSec().sleepers.length;
    window.appConfirm=()=>Promise.resolve(true);
    document.getElementById('bulkN').value='46';await applyBulk();
    const normal=activeSec().sleepers.length;
    window.appConfirm=o;clearTimeout(_saveTimer);
    return {asked,refused,normal}});
  ok('200-аас их тоонд баталгаажуулалт асууна', /4600 дэр/.test(r.asked), r.asked);
  ok('Татгалзвал дэр нэмэгдэхгүй', r.refused===0, r.refused);
  ok('Энгийн тоо (46) асуулгүй орно', r.normal===46, r.normal);
}

// ── 4. Шинэчлэлтийн ?v= хаягт үлдэхгүй ──
console.log('\nШинэчлэлтийн хаяг');
{
  const base=await B.ensureServer();
  const ctx=await br.newContext();await ctx.addInitScript(B.STUB);
  const p2=await ctx.newPage();
  await p2.goto(base+'/index.html?v=2099.01.01-1',{waitUntil:'load'});
  const q=await p2.evaluate(()=>location.search);
  ok('Ачаалсны дараа ?v= арилна', q==='', q);
  await ctx.close();
}

// 2-р хэсгийн санаатай мэдэгдлийг алдаанд тооцохгүй
const real=errs.filter(e=>!/Утсанд хадгалж чадсангүй/.test(e));
ok('JS алдаагүй', real.length===0, real.slice(0,2).join(' | '));
const p=R.filter(Boolean).length;
console.log(`\nSUMMARY ${p}/${R.length}`);
await br.close();process.exit(p===R.length?0:1);
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
