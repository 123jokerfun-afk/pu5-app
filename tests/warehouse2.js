/* ══════════════════════════════════════════════════════════════
   ДЭРИЙН АГУУЛАХ — ПАСПОРТ БҮРТ ТУСДАА

   Дэрийн агуулах цаашид паспорт бүрт ӨӨРИЙН тооцоотой (f.sinc,
   сумын f.inc-тэй ижил хэв загвар) — нэг паспортын орлого нөгөөд
   харагдахгүй. Гол зам (DB.sinc) болон сумын рам замын дэр ямар ч
   дэрийн паспортод харьяалагддаггүй тул НИЙТЛЭГ — паспорт бүрийн
   жагсаалт, үлдэгдэлд үргэлж цуг ордог.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();
  window.appConfirm=()=>Promise.resolve(true)});

/* ── 1. Паспорт бүр тусдаа орлого/зарлагатай ── */
console.log('\nПаспорт тус бүр тусдаа');
const iso=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,300));
  openFolder('f-test1');await new Promise(r=>setTimeout(r,260));
  openDerIncForFolder('f-test1');openDerIncAdd();await new Promise(r=>setTimeout(r,220));
  setDerIncN(40);saveDerInc();await new Promise(r=>setTimeout(r,260));
  closeModal('derIncAddModal');closeModal('derIncModal');
  const f1=getFolder('f-test1'),f2=getFolder('f-test2');
  const f1n=derIncNFor(f1),f2n=derIncNFor(f2);
  openFolder('f-test1');await new Promise(r=>setTimeout(r,260)); // f-test2-г хаана, f-test1-ийг нээнэ
  openFolder('f-test2');await new Promise(r=>setTimeout(r,260));
  const f2Card=[...document.querySelectorAll('#derWrapFolder .pill-item')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+e.querySelector('.folder-meta').textContent.trim());
  return{f1n,f2n,f2Card}});
ok('f-test1-д орсон орлого зөвхөн ТҮҮНД нь харагдана',iso.f1n===40&&iso.f2n===0,`${iso.f1n} · ${iso.f2n}`);
ok('f-test2 нээхэд f-test1-ийн орлого харагдахгүй',
   iso.f2Card[0]==='Орлого|Орлого бүртгээгүй',JSON.stringify(iso.f2Card));

/* ── 2. Гол зам — БҮХ паспортод нийтлэг ── */
console.log('\nГол зам нийтлэг');
const shared=await page.evaluate(async()=>{
  openDerInc();openDerIncAdd();await new Promise(r=>setTimeout(r,220));
  setDerIncN(15);saveDerInc();await new Promise(r=>setTimeout(r,260));
  closeModal('derIncAddModal');closeModal('derIncModal');
  const f1=getFolder('f-test1'),f2=getFolder('f-test2');
  return{st1:derStockFor(f1),st2:derStockFor(f2)}});
ok('Гол замын орлого ХОЁУЛАНГИЙН үлдэгдэлд нэмэгдэнэ (40+15=55, 0+15=15)',
   shared.st1===55&&shared.st2===15,`${shared.st1} · ${shared.st2}`);

/* ── 3. Сумын рам замын дэр — БҮХ паспортод нийтлэг ── */
console.log('\nСумын рам зам нийтлэг');
await page.evaluate(()=>{
  DB.sw=[{id:'wf1',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',
    turnouts:[{id:'wt1',num:9,mak:'Р-65',mark:'1/9',head:2,it:'bnnnnn',slRepl:{0:{d:'2026-06-01',t:'normal',m:'wood'}},slPlan:{},dRepl:{}}],inc:[]}];
  swFolderId='wf1'});
const swShared=await page.evaluate(()=>{
  const f1=getFolder('f-test1'),f2=getFolder('f-test2');
  return{
    rows1:derOutRowsFor(f1).map(r=>r.grp),
    rows2:derOutRowsFor(f2).map(r=>r.grp),
    out1:derOutNFor(f1),out2:derOutNFor(f2)}});
ok('"Сумын рам зам" мөр f-test1-ийн жагсаалтад ч гарна',
   swShared.rows1.includes('Сумын рам зам'),JSON.stringify(swShared.rows1));
ok('"Сумын рам зам" мөр f-test2-ийн жагсаалтад ч гарна (идэвхтэй биш ч)',
   swShared.rows2.includes('Сумын рам зам'),JSON.stringify(swShared.rows2));
ok('Хоёулангийн зарлагын тоонд адилхан нэмэгдэнэ',
   swShared.out1===swShared.out2&&swShared.out1>0,`${swShared.out1} · ${swShared.out2}`);

/* ── 4. Глобал тайлан (energyPlanReport) энэ өөрчлөлтийн дараа ч бүх паспортыг хамарна ── */
console.log('\nГлобал тайлан хэвээрээ');
await page.evaluate(()=>{
  const f1=getFolder('f-test1'),f2=getFolder('f-test2');
  f1.tracks[0].sections[0].plan={0:'tbd'};
  f2.tracks[0].sections[0].plan={0:'wood'}});
const glob=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,300));
  openPlanReport();await new Promise(r=>setTimeout(r,320));
  const heads=[...document.querySelectorAll('#planRepBody .rp-track-hd')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  const tot=(document.querySelector('#planRepBody .rp-total')||{}).textContent||'';
  closeModal('planRepModal');
  return{heads,tot,n:planTotalCount()}});
ok('Глобал тайлан ХОЁУЛАНГ паспортыг хамарсан хэвээр',
   glob.heads.length>=2,JSON.stringify(glob.heads));
ok('Нийт тоонд хоёулаа орно',/2 дэр/.test(glob.tot),glob.tot);

/* ── 5. Паспорт-тусгайлсан тайлан зөвхөн тухайн паспортыг хамарна ── */
console.log('\nПаспорт-тусгайлсан тайлан');
const fscoped=await page.evaluate(async()=>{
  openFolder('f-test1');await new Promise(r=>setTimeout(r,260));
  openPlanReport('f-test1');await new Promise(r=>setTimeout(r,320));
  const heads=[...document.querySelectorAll('#planRepBody .rp-track-hd')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  closeModal('planRepModal');
  return{heads,n:planTotalCountFor('f-test1')}});
ok('f-test1-ийн тайланд f-test2-ийн зам ОРОХГҮЙ',
   !fscoped.heads.some(x=>/4-р зам/.test(x)),JSON.stringify(fscoped.heads));
ok('f-test1-ийн өөрийнх нь тоо 1',fscoped.n===1,String(fscoped.n));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
