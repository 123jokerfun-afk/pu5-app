/* ══════════════════════════════════════════════════════════════
   ДҮНЗ БҮРТГЭХ — ДЭРТЭЙ ИЖИЛ ЗАРЧИМ

   v107 хүртэл swPut нь бөмбөрөгийн байрлалыг үл тоон ҮРГЭЛЖ
   төгсгөлд нэмдэг байв: бүртгэсэн дүнз дээр тааруулаад дарахад
   шууд доош гүйж ШИНЭ дүнз бүртгэдэг байлаа.

   Дэрийн бүртгэлийн зарчим (record):
     · тааруулсан мөр дээр бүртгэнэ
     · өмнөх бүртгэлтэй ИЖИЛ бол дараагийн мөр рүү шилжинэ
     · ЗӨРВӨЛ асууна; болих бол хэвээр үлдэнэ
   Энэ шалгалт хоёуланг нь ижил хувилбараар туршиж тулгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

/* Сум бэлдэж, бүртгэлийн дэлгэц нээнэ. head=4 → эхний 4 нь дэр. */
await page.evaluate(async()=>{
  let it='';for(let i=0;i<12;i++)it+='n';       // 12 мөр бүртгэсэн
  DB.sw=[{id:'sf',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,station:'Шивээговь',mak:'Р-65',mark:'1/11',proj:'2764',
      head:4,it}]}];
  swFolderId='sf';swTurnoutId='w1';saveDB();
  openSwRec&&0;                                  // (нэр өөр байж болзошгүй)
});
// Бүртгэлийн дэлгэцийг нээнэ
const opened=await page.evaluate(async()=>{
  swTurnoutId='w1';showView('swRecView');renderSwRec();
  await new Promise(r=>setTimeout(r,600));
  return {view:(document.querySelector('.view.active')||{}).id,
    n:(swTurnout().it||'').length}});
ok('Дүнз бүртгэлийн дэлгэц нээгдэв',opened.view==='swRecView'&&opened.n===12,
   JSON.stringify(opened));

// Бөмбөрөгийг тодорхой мөр дээр тааруулна
const aim=async i=>await page.evaluate(async(i)=>{
  DRM.target=DRM.pos=i;DRM.vel=0;
  await new Promise(r=>setTimeout(r,250));
  return drumCursor()},i);

/* ── 1. Бүртгэсэн мөр дээр ИЖИЛ утга — өөрчлөхгүй, дараагийнх руу ── */
await aim(6);
const same=await page.evaluate(async()=>{
  const t=swTurnout();const before=t.it;
  await swPut('n');                       // #6 нь аль хэдийн 'n'
  await new Promise(r=>setTimeout(r,450));
  return {before,after:swTurnout().it,cur:drumCursor(),
    urt:swTurnout().it.length}});
ok('Ижил утга — бичлэг өөрчлөгдөхгүй',same.before===same.after,
   same.before+' → '+same.after);
ok('Ижил утга — ШИНЭ мөр НЭМЭГДЭХГҮЙ',same.urt===12,same.urt+' мөр');
ok('Ижил утга — дараагийн мөр рүү шилжинэ',same.cur===7,'заагч='+same.cur);

/* ── 2. Бүртгэсэн мөр дээр ӨӨР утга — асууна ── */
await aim(6);
const ask=await page.evaluate(async()=>{
  swPut('b');                             // #6 нь 'n' — зөрнө
  await new Promise(r=>setTimeout(r,450));
  const m=document.getElementById('appConfirmModal');
  return {open:m.classList.contains('open'),
    msg:document.getElementById('appConfirmMsg').textContent,
    ok:document.getElementById('appConfirmOkBtn').textContent}});
ok('Зөрвөл асуух самбар гарна',ask.open===true,JSON.stringify(ask.msg));
ok('Асуултад дугаар ба өмнөх байдал бичигдэнэ',
   /#3 дүнзийг/.test(ask.msg)&&/Хэвийн/.test(ask.msg),ask.msg);
ok('Товч "Өөрчлөх"',ask.ok==='Өөрчлөх',ask.ok);

/* ── 3. Болих дарвал ХЭВЭЭР ── */
const cancel=await page.evaluate(async()=>{
  document.getElementById('appConfirmCancelBtn').click();
  await new Promise(r=>setTimeout(r,450));
  return {it:swTurnout().it,cur:drumCursor()}});
ok('Болих — бичлэг хэвээр',cancel.it[6]==='n',cancel.it);
ok('Болих — заагч хөдлөхгүй',cancel.cur===6,'заагч='+cancel.cur);

/* ── 4. Өөрчлөх дарвал ЯГ ТЭР мөр солигдоно ── */
await aim(6);
const chg=await page.evaluate(async()=>{
  swPut('b');
  await new Promise(r=>setTimeout(r,400));
  document.getElementById('appConfirmOkBtn').click();
  await new Promise(r=>setTimeout(r,550));
  const t=swTurnout();
  return {it:t.it,urt:t.it.length,cur:drumCursor()}});
ok('Өөрчлөх — ЯГ #6 мөр солигдов',chg.it[6]==='b',chg.it);
ok('Өөрчлөх — бусад мөр хөндөгдөөгүй',
   chg.it.split('').filter(c=>c==='b').length===1,chg.it);
ok('Өөрчлөх — мөрийн тоо нэмэгдээгүй',chg.urt===12,chg.urt+' мөр');
ok('Өөрчлөх — дараагийн мөр рүү шилжинэ',chg.cur===7,'заагч='+chg.cur);

/* ── 5. Төгсгөлд тааруулбал ШИНЭ мөр нэмнэ ── */
await aim(12);
const add=await page.evaluate(async()=>{
  await swPut('b');
  await new Promise(r=>setTimeout(r,450));
  const t=swTurnout();
  return {urt:t.it.length,last:t.it[12]}});
ok('Төгсгөлд — шинэ мөр нэмэгдэнэ',add.urt===13&&add.last==='b',
   add.urt+' мөр, сүүлийнх='+add.last);

/* ── 6. Рам замын ДЭР дээр асуулт "дэр" гэж бичигдэнэ ── */
await aim(1);
const sl=await page.evaluate(async()=>{
  swPut('b');
  await new Promise(r=>setTimeout(r,450));
  const msg=document.getElementById('appConfirmMsg').textContent;
  document.getElementById('appConfirmCancelBtn').click();
  await new Promise(r=>setTimeout(r,250));
  return msg});
ok('Рам замын мөрийг "дэр" гэж нэрлэнэ',/#2 дэрийг/.test(sl),sl);

/* ── 7. ДЭРИЙН бүртгэл ижил зан төлөвтэй хэвээр (регресс) ── */
const der=await page.evaluate(async()=>{
  goHome();
  const sl=Array.from({length:10},()=>({type:'normal',ts:0}));
  DB.folders=[{id:'fr',name:'Б',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'tr',num:9,kind:'station',note:'',sections:[
      {id:'sr',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',sleepers:sl}]}]}];
  activeFolderId='fr';DB.tracks=DB.folders[0].tracks;
  openFolder('fr');openTrack('tr');openSection('sr');
  await new Promise(r=>setTimeout(r,600));
  DRM.target=DRM.pos=5;DRM.vel=0;
  await new Promise(r=>setTimeout(r,250));
  const n0=activeSec().sleepers.length;
  await record('normal');                 // ижил төрөл
  await new Promise(r=>setTimeout(r,400));
  const a={n:activeSec().sleepers.length,cur:drumCursor()};
  DRM.target=DRM.pos=5;DRM.vel=0;
  await new Promise(r=>setTimeout(r,250));
  record('bad');                          // өөр төрөл → асуух ёстой
  await new Promise(r=>setTimeout(r,450));
  const asked=document.getElementById('appConfirmModal').classList.contains('open');
  document.getElementById('appConfirmCancelBtn').click();
  await new Promise(r=>setTimeout(r,300));
  return {n0,a,asked,n1:activeSec().sleepers.length,
    type5:activeSec().sleepers[5].type}});
ok('Дэр: ижил төрөл — шинэ дэр нэмэгдэхгүй',der.a.n===der.n0,der.n0+' → '+der.a.n);
ok('Дэр: ижил төрөл — дараагийнх руу шилжинэ',der.a.cur===6,'заагч='+der.a.cur);
ok('Дэр: өөр төрөл — асууна',der.asked===true);
ok('Дэр: болих — хэвээр',der.type5==='normal'&&der.n1===10,
   der.type5+', '+der.n1+' дэр');

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
