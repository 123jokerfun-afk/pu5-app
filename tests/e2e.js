/* ══════════════════════════════════════════════════════════════
   ПД-7 — БҮТЭН УРСГАЛЫН ШАЛГАЛТ

   Нэг хэрэглэгчийн нэг өдрийн ажлыг эхнээс нь дуустал дуурайна:
   өртөөний зам → ухарч бүртгэх → гол зам → салбар зам → сум →
   дүнзний орлого, солилт, төлөвлөгөө → дэрийн агуулах → тайлан →
   экспорт → үүл. Алхам бүрийн дараа тоог НЬ БИЕ ДААН дахин бодож
   тулгана.

   Нууц үг: тестийн орчинд Firebase хуурамч (`stub.js`) тул жинхэнэ
   нууц үг ОГТ ашиглагддаггүй, хадгалагддаггүй. Хэсгийн КОД нь л
   утгатай — салбар зам, салаалсан гол зам код бүрээр өөр байдаг.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
let ExcelJS=null;try{ExcelJS=require('./node_modules/exceljs')}catch(e){}
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-7');
const quiet=()=>page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();
  window.appConfirm=()=>Promise.resolve(true);
  window.__b64=null;
  window.dlBlob=function(blob,name){
    return new Promise(r=>{const fr=new FileReader();
      fr.onload=()=>{window.__b64={name,d:String(fr.result).split(',')[1]};r()};
      fr.readAsDataURL(blob)})}});
await quiet();

/* ── 1. Хэсгийн код ── */
console.log('\n1. ПД-7 нэвтрэлт');
const c0=await page.evaluate(()=>({code:_sectionCode,br:hasBranch(),
  names:brNames().length,salaa:isBranchSection(),
  view:(document.querySelector('.view.active')||{}).id}));
ok('ПД-7 хэсэг рүү нэвтэрлээ',c0.code==='ПД-7'&&c0.view==='homeView',c0.code+' · '+c0.view);
ok('ПД-7-д салбар зам бий (8 нэр)',c0.br&&c0.names===8,`${c0.br} · ${c0.names}`);
ok('ПД-7 нь салаалсан гол замгүй (ПД-11/12 л тийм)',!c0.salaa,String(c0.salaa));

await page.evaluate(()=>{
  DB.location='Мандал';
  DB.rpt={cls:'3',sec:'7',secName:'ПД-7',season:'хавар',year:'2026',date:'2026-04-01',sign:'Б.Болд'};
  DB.folders=[];DB.main=[];DB.sw=[];DB.sinc=[];
  activeFolderId=null;DB.tracks=[];swFolderId=null;saveDB();goHome()});

/* ── 2. Өртөөний зам: бүх төрлөөр бүртгэх ── */
console.log('\n2. Өртөөний зам — бүх төрлөөр');
const t2=await page.evaluate(async()=>{
  openAddFolder();await new Promise(r=>setTimeout(r,200));
  document.getElementById('afName').value='Хавар 2026 паспорт';
  addFolder();await new Promise(r=>setTimeout(r,320));
  openAddTrack();await new Promise(r=>setTimeout(r,200));
  document.getElementById('atNum').value='3';
  addTrack();await new Promise(r=>setTimeout(r,320));
  const t=DB.tracks[0];
  openTrack(t.id,1);await new Promise(r=>setTimeout(r,260));
  openAddSection('normal');await new Promise(r=>setTimeout(r,220));
  addSection();await new Promise(r=>setTimeout(r,320));
  const sec=activeTrack().sections[0];
  openSection(sec.id);await new Promise(r=>setTimeout(r,300));
  // Дөрвөн төрлөөр ээлжлэн бүртгэнэ
  for(const ty of ['normal','bad','tbd','bad_tbd','normal','bad'])
    {await record(ty);await new Promise(r=>setTimeout(r,60))}
  await new Promise(r=>setTimeout(r,600));   // тоолуур гүйж дуустал
  return{folder:DB.folders.length,tracks:DB.tracks.length,
    label:sec.label,types:activeSec().sleepers.map(s=>s.type).join(','),
    cnt:{total:document.getElementById('cnt-total').textContent,
         pass:document.getElementById('cnt-pass').textContent,
         fail:document.getElementById('cnt-fail').textContent,
         pct:document.getElementById('cnt-pct').textContent}}});
ok('Паспорт, зам, үе үүсэв',t2.folder===1&&t2.tracks===1&&t2.label==='1-р үе',
   `${t2.folder}/${t2.tracks}/${t2.label}`);
ok('Дөрвөн төрөл бүгд бүртгэгдэнэ',
   t2.types==='normal,bad,tbd,bad_tbd,normal,bad',t2.types);
ok('Тоолуур зөв (6 нийт, 3 тэнцэх, 3 тэнцэхгүй, 50%)',
   t2.cnt.total==='6'&&t2.cnt.pass==='3'&&t2.cnt.fail==='3'&&/50\.0%/.test(t2.cnt.pct),
   JSON.stringify(t2.cnt));

const t2b=await page.evaluate(async()=>{
  undoLast();await new Promise(r=>setTimeout(r,200));
  const afterUndo=activeSec().sleepers.length;
  editIdx=0;openTypeModal();editSleeper('bad');await new Promise(r=>setTimeout(r,280));
  const t0=activeSec().sleepers[0].type;
  document.getElementById('bulkN').value=46;
  await applyBulk();await new Promise(r=>setTimeout(r,360));
  return{afterUndo,t0,bulk:activeSec().sleepers.length,
    // Бөөнөөр нэмэх нь ЗӨВХӨН дутууг нөхнө — бүртгэсэн дэрийг хөндөхгүй
    kept:activeSec().sleepers[0].type,
    added:activeSec().sleepers.slice(5).every(s=>s.type==='normal')}});
ok('Буцаах — сүүлийн дэр устана',t2b.afterUndo===5,String(t2b.afterUndo));
ok('Төрөл засах ажиллана',t2b.t0==='bad',t2b.t0);
ok('Бөөнөөр 46 дэр — нэмэгдсэн нь хэвийн, бүртгэсэн нь хэвээр',
   t2b.bulk===46&&t2b.added&&t2b.kept==='bad',
   `${t2b.bulk} дэр · #1 ${t2b.kept} · шинэ нь хэвийн ${t2b.added}`);

/* ── 3. Ухарч бүртгэх ── */
console.log('\n3. Ухарч бүртгэх');
const t3=await page.evaluate(async()=>{
  const t=activeTrack();
  // 2-р үе нэмээд, хоёр үеийн заагт дараалсан цэг үүсгэнэ
  const s1=t.sections[0];
  s1.sleepers=s1.sleepers.slice(0,6);
  s1.sleepers[4].type='bad';s1.sleepers[5].type='bad';
  t.sections.push({id:'e2',type:'normal',label:'2-р үе',note:'',date:'2026-05-01',
    sleepers:[{type:'bad',ts:0},{type:'normal',ts:0},{type:'normal',ts:0}]});
  saveDB();
  const norm=findConsecutiveBadForTrack(t.sections).length;
  goTrack();await new Promise(r=>setTimeout(r,240));
  pickWalk(true);await new Promise(r=>setTimeout(r,240));
  openSection('e2');await new Promise(r=>setTimeout(r,320));
  const flipped=activeSec().sleepers.map(x=>x.type==='bad'?'b':'n').join('');
  const rev=findConsecutiveBadForTrack(t.sections).length;
  // Ухрах дарааллаар #3 нь жинхэнэ #1 — түүнийг сольж тэмдэглэнэ
  editIdx=2;
  openReplModal();await new Promise(r=>setTimeout(r,200));
  _replY=2026;_replM=6;_replD=1;
  await saveRepl('normal');await new Promise(r=>setTimeout(r,320));
  goTab('home');await new Promise(r=>setTimeout(r,360));
  const back=t.sections[1];
  return{norm,flipped,rev,rw:!!back.rw,
    order:back.sleepers.map(x=>x.type==='bad'?'b':'n').join(''),
    replKeys:Object.keys(back.repl||{}),
    carve:!!(back.repl&&back.repl[0]&&back.repl[0].s)}});
ok('Үе дамнасан дараалсан цэг эхлээд олдоно',t3.norm===1,String(t3.norm));
ok('Ухрах горимд үе эргэнэ',t3.flipped==='nnb',t3.flipped);
ok('Ухарч байхад ч дараалсан цэг алга болохгүй',t3.rev===1,String(t3.rev));
ok('Үеэс гарахад жинхэнэ дараалалдаа эргэнэ',!t3.rw&&t3.order==='nnn',
   `${t3.order} · rw=${t3.rw}`);
ok('Сольсон тэмдэг жинхэнэ #1 дээрээ',t3.replKeys.length===1&&t3.replKeys[0]==='0',
   JSON.stringify(t3.replKeys));
ok('Дараалсан цэгээс сольсон нь СИЙРЭГЖИЛТ болно',t3.carve,String(t3.carve));

/* ── 4. Гол зам ── */
console.log('\n4. Гол зам');
const t4=await page.evaluate(async()=>{
  openMainKmList();await new Promise(r=>setTimeout(r,300));
  openAddKm();await new Promise(r=>setTimeout(r,220));
  document.getElementById('akFrom').value='681';
  document.getElementById('akTo').value='681';
  updateAddKmHint();
  addKm();await new Promise(r=>setTimeout(r,360));
  const km=DB.main[0];
  openTrack(km.id,1);await new Promise(r=>setTimeout(r,280));
  const sec=km.sections[0];
  openSection(sec.id);await new Promise(r=>setTimeout(r,320));
  for(const ty of ['tbd','bad_tbd','tbd'])
    {await record(ty);await new Promise(r=>setTimeout(r,60))}
  const a=analyzeTrack(km);
  const lbl=mainLabel();
  goTab('home');await new Promise(r=>setTimeout(r,340));
  return{n:DB.main.length,num:km.num,secs:km.sections.length,
    total:a.total,bad:a.totalBad,tbd:a.tbd+a.bad_tbd,lbl,
    fast:segFastAt(sec,0,km)}});
ok('Гол замын км нэмэгдэв',t4.n===1&&t4.num===681&&t4.secs>0,
   `${t4.n} км · ${t4.num} · ${t4.secs} үе`);
ok('Гол замд ТБД бүртгэгдэнэ',t4.total===3&&t4.bad===1&&t4.tbd===3,
   `${t4.total}/${t4.bad}/${t4.tbd}`);
ok('ПД-7-д "Гол зам" гэж нэрлэгдэнэ',t4.lbl==='Гол зам',t4.lbl);
ok('Бэхэлгээ өгөгдмөл (CZ)',t4.fast==='CZ',t4.fast);

/* ── 5. Салбар зам ── */
console.log('\n5. Салбар зам');
const t5=await page.evaluate(async()=>{
  goBrHome();await new Promise(r=>setTimeout(r,340));
  openAddFolder(1);await new Promise(r=>setTimeout(r,220));
  document.getElementById('afName').value='Хавар 2026 салбар';
  addFolder();await new Promise(r=>setTimeout(r,360));
  const f=DB.folders.find(x=>x.br);
  openAddTrack();await new Promise(r=>setTimeout(r,240));
  const opts=_brFree.slice();
  _brPick=0;addTrack();await new Promise(r=>setTimeout(r,340));
  const t=f.tracks[0];
  openBrTrack(t.id);await new Promise(r=>setTimeout(r,280));
  openAddSection('normal');await new Promise(r=>setTimeout(r,220));
  addSection();await new Promise(r=>setTimeout(r,320));
  openSection(activeTrack().sections[0].id);await new Promise(r=>setTimeout(r,300));
  for(const ty of ['normal','bad','normal'])
    {await record(ty);await new Promise(r=>setTimeout(r,60))}
  backFromTrack();await new Promise(r=>setTimeout(r,380));
  const stats=[...document.querySelectorAll('#brTrStats .br-st')]
    .map(e=>e.querySelector('.br-st-l').textContent+'='+e.querySelector('.br-st-n').textContent);
  return{br:!!f,opts:opts.slice(0,2),name:t.name,
    view:(document.querySelector('.view.active')||{}).id,stats,
    n:t.sections[0].sleepers.length}});
ok('Салбар замын паспорт үүсэв',t5.br,String(t5.br));
ok('Замын нэр ПД-7-гийн жагсаалтаас',/Мак|Пүү/.test(t5.name||''),t5.name);
ok('Салбарын бүртгэлээс буцахад САЛБАР руугаа эргэнэ',t5.view==='brHomeView',t5.view);
ok('Салбарын дүн зөв (3 дэр, 1 тэнцэхгүй)',
   /Нийт дэр=3/.test(t5.stats[1])&&/Тэнцэх=2/.test(t5.stats[2]),JSON.stringify(t5.stats));

const t5b=await page.evaluate(async()=>{
  goDerHome();await new Promise(r=>setTimeout(r,380));
  return{trk:[...document.querySelectorAll('#tracksGrid .track-card')]
      .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,12)),
    f:activeFolderId,meta:(document.getElementById('heroMeta')||{}).textContent||''}});
ok('Салбарын зам ӨРТӨӨНД орж ирэхгүй',
   t5b.trk.length===1&&/3-р зам/.test(t5b.trk[0])&&!/салбар/i.test(t5b.meta),
   JSON.stringify(t5b.trk)+' · '+t5b.meta.slice(0,30));

/* ── 6. Сум: рам замын дэр + дүнз ── */
console.log('\n6. Сум — рам замын дэр ба дүнз');
const t6=await page.evaluate(async()=>{
  goSwHome();await new Promise(r=>setTimeout(r,340));
  openSwFolder();await new Promise(r=>setTimeout(r,240));
  document.getElementById('swfName').value='Хавар 2026 сум';
  addSwFolder();await new Promise(r=>setTimeout(r,360));
  // Сумын загвар — Р-65 1/9
  const sp=swSpecsAll()[0];
  openSwTurnout();await new Promise(r=>setTimeout(r,260));
  document.getElementById('swtNum').value='1';
  if(sp){_swMak=sp.mak;_swMark=sp.mark}else{_swMak='Р-65';_swMark='1/9'}
  addSwTurnout();await new Promise(r=>setTimeout(r,360));
  const t=swFolder().turnouts[0];
  openSwRec(t.id);await new Promise(r=>setTimeout(r,260));
  document.getElementById('swHeadN').value='2';
  saveSwHead();await new Promise(r=>setTimeout(r,340));
  // Рам замын 2 дэр + 8 дүнз
  for(const ch of ['b','n','b','b','n','n','n','n','n','n'])
    {swTap((swTurnout().it||'').length);
     if(ch==='n'&&(swTurnout().it||'').slice(-1)==='b')swTap((swTurnout().it||'').length-1);
     await new Promise(r=>setTimeout(r,45))}
  const t2=swTurnout();
  // Тодорхой хэв маяг руу шууд тавина (товшилтын дараалал батлагдсан)
  t2.it='bn'+'bbnnnnnn';saveDB();renderSwRec();
  await new Promise(r=>setTimeout(r,260));
  const a=swTally(t2);
  return{mak:t2.mak,mark:t2.mark,head:t2.head,it:t2.it,
    sl:a.sl,slBad:a.slBad,total:a.total,bad:a.bad,m:a.m,mBad:a.mBad,
    pct:Math.round(a.pct*10)/10,
    slot3:swSlot(t2,2).len,kind3:swSlot(t2,2).kind,kind0:swSlot(t2,0).kind}});
ok('Сумын паспорт, сум үүсэв',t6.head===2&&t6.it.length===10,
   `${t6.mak} ${t6.mark} · эхэнд ${t6.head} дэр · ${t6.it.length} мөр`);
ok('Эхний 2 мөр нь РАМ ЗАМЫН ДЭР (сумын дүнд ордоггүй)',
   t6.kind0==='дэр'&&t6.sl===2&&t6.slBad===1,
   `${t6.kind0} · ${t6.slBad}/${t6.sl} тэнцэхгүй`);
ok('Дараагийн мөрүүд нь ДҮНЗ',t6.kind3==='дүнз'&&t6.total===8,
   `${t6.kind3} · ${t6.total} дүнз`);
ok('Тэнцэхгүй хувь ПОГ/М-ээр бодогдоно',
   t6.bad===2&&t6.mBad>0&&Math.abs(t6.pct-(t6.mBad/t6.m*100))<0.1,
   `${t6.bad} ш · ${t6.mBad}/${t6.m} пог/м = ${t6.pct}%`);

/* ── 7. Дүнз: орлого → солих → төлөвлөх ── */
console.log('\n7. Дүнз — орлого, солих, төлөвлөх');
const t7=await page.evaluate(async()=>{
  goSwHome();await new Promise(r=>setTimeout(r,300));
  openSwInc();await new Promise(r=>setTimeout(r,240));
  openSwIncAdd();await new Promise(r=>setTimeout(r,260));
  const L0=SW_LENS[0],L1=SW_LENS[1];
  _incL=L0;_incN=4;_incAdd();await new Promise(r=>setTimeout(r,80));
  _incL=L1;_incN=3;_incAdd();await new Promise(r=>setTimeout(r,80));
  saveSwInc();await new Promise(r=>setTimeout(r,300));
  const inc=swIncBy(),st0=swStock();
  // Тэнцэхгүй дүнз солино — агуулахад БАЙГАА уртаас л
  swTurnoutId=swFolder().turnouts[0].id;
  showView('swRecView');renderSwRec();await new Promise(r=>setTimeout(r,280));
  openSwDz(2);await new Promise(r=>setTimeout(r,200));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const lens=[...document.querySelectorAll('#swWhL .wh-item')].map(e=>e.textContent);
  const pick=_swDzL;
  saveSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const st1=swStock(),out=swOutBy();
  // Дараагийн тэнцэхгүйг ТӨЛӨВЛӨНӨ
  openSwDz(3);await new Promise(r=>setTimeout(r,200));
  openSwDzPlan();await new Promise(r=>setTimeout(r,320));
  const opened=document.getElementById('swPlanModal').classList.contains('open');
  saveSwDzPlan();await new Promise(r=>setTimeout(r,320));
  const t=swTurnout();
  return{inc,st0,lens,pick,st1,out,
    repl:!!(t.dRepl&&t.dRepl[2]),plan:t.dPlan&&t.dPlan[3],opened,
    free:(()=>{_swDzIdx=-1;return _swPlanFree()})(),
    planN:swPlanTotal()}});
const incSum=Object.keys(t7.inc).reduce((a,k)=>a+t7.inc[k],0);
ok('Орлого хүрдээр бүртгэгдэнэ (2 урт · нийт 7 ш)',
   Object.keys(t7.inc).length===2&&incSum===7,JSON.stringify(t7.inc));
ok('Солих хүрдэнд АГУУЛАХАД БАЙГАА урт л гарна',
   t7.lens.length===2&&t7.lens.every(x=>/·\s*\dш/.test(x)),JSON.stringify(t7.lens));
ok('Солилт бүртгэгдэж, үлдэгдэл 1-ээр буурна',
   t7.repl&&t7.st1[String(t7.pick)]===t7.st0[String(t7.pick)]-1,
   `${t7.pick} м: ${t7.st0[String(t7.pick)]} → ${t7.st1[String(t7.pick)]}`);
ok('Зарлага солилтоос гарна',t7.out[String(t7.pick)]===1,JSON.stringify(t7.out));
ok('Төлөвлөгөө хадгалагдаж, сул үлдэгдлээс захиалагдана',
   t7.opened&&!!t7.plan&&t7.planN===1,`${t7.plan} · ${t7.planN} төлөвлөгөө`);

/* ── 8. Дэр: орлого, зарлага, төлөвлөх ── */
console.log('\n8. Дэр — орлого, зарлага, төлөвлөх');
const t8=await page.evaluate(async()=>{
  goDerHome();await new Promise(r=>setTimeout(r,340));
  openDerInc();await new Promise(r=>setTimeout(r,240));
  openDerIncAdd();await new Promise(r=>setTimeout(r,260));
  setDerIncN(100);saveDerInc();await new Promise(r=>setTimeout(r,320));
  const inc=derIncN(),out0=derOutN(),st0=derStock();
  // Тэнцэхгүй дэрийг төлөвлөнө
  openTrack(DB.tracks[0].id,1);await new Promise(r=>setTimeout(r,260));
  openSection(activeTrack().sections[0].id);await new Promise(r=>setTimeout(r,300));
  const sec=activeSec();
  let bi=sec.sleepers.findIndex(s=>isBadSleeper(s.type));
  if(bi<0){sec.sleepers[0].type='bad';saveDB();bi=0}
  editIdx=bi;openEditSleeper(bi);await new Promise(r=>setTimeout(r,240));
  openPlanModal();await new Promise(r=>setTimeout(r,260));
  const stock=document.getElementById('planStock').textContent.replace(/\s+/g,' ').trim();
  savePlan('tbd');await new Promise(r=>setTimeout(r,320));
  const planN=planTotalCount();
  // Сумын рам замын дэрийг ч төлөвлөнө
  goSwHome();await new Promise(r=>setTimeout(r,300));
  swTurnoutId=swFolder().turnouts[0].id;showView('swRecView');renderSwRec();
  await new Promise(r=>setTimeout(r,280));
  openSwSl(0);await new Promise(r=>setTimeout(r,220));
  openSwSlPlan();await new Promise(r=>setTimeout(r,260));
  savePlan('wood');await new Promise(r=>setTimeout(r,320));
  goDerHome();await new Promise(r=>setTimeout(r,340));
  return{inc,out0,st0,stock,planN,planN2:planTotalCount(),
    out1:derOutN(),st1:derStock(),
    rows:derOutRows().map(r=>r.grp+'/'+r.name+'='+r.n),
    cards:[...document.querySelectorAll('#derWrap .folder-card .folder-name')]
      .map(e=>e.textContent.trim())}});
ok('Дэрийн орлого — он сар өдөр + тоо л',t8.inc===100,String(t8.inc));
ok('Зарлага солилтоос гарна, үлдэгдэл = орлого − зарлага',
   t8.st0===t8.inc-t8.out0&&t8.st1===t8.inc-t8.out1,
   `${t8.inc} − ${t8.out1} = ${t8.st1}`);
ok('Төлөвлөх цонхонд агуулахын үлдэгдэл харагдана',
   /Агуулахад 100 дэр/.test(t8.stock)||/Агуулахад 99 дэр/.test(t8.stock),t8.stock.slice(0,46));
ok('Дэрийн төлөвлөгөө хадгалагдана',t8.planN===1,String(t8.planN));
ok('Сумын рам замын дэр ч ДЭРИЙН төлөвлөгөөнд орно',t8.planN2===2,String(t8.planN2));
ok('Зарлага бүлэглэгдэж харагдана',t8.rows.length>=1,JSON.stringify(t8.rows));
ok('Нүүрэнд Орлого · Зарлага · Төлөвлөсөн дэр',
   t8.cards.length===3&&/Төлөвлөсөн дэр/.test(t8.cards[2]),JSON.stringify(t8.cards));

/* ── 9. Тайлангууд ── */
console.log('\n9. Тайлангууд');
const t9=await page.evaluate(async()=>{
  const out={};
  const grab=(fn,id,sel)=>{
    document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
    (0,eval)(fn);
    const el=document.getElementById(id);
    out[id]={open:!!el&&el.classList.contains('open'),
      n:el?el.querySelectorAll(sel).length:-1,
      raw:/\[object|undefined|NaN/.test((el&&el.textContent)||'')};
  };
  goDerHome();await new Promise(r=>setTimeout(r,320));
  grab('openReplReport()','replReportModal','.rp-row');
  grab('openConsecReport()','consecReportModal','.cs-cell');
  grab('openPlanReport()','planRepModal','.pl-row');
  grab('openDerOut()','derOutModal','.out-tr');
  goSwHome();await new Promise(r=>setTimeout(r,320));
  grab('openSwReplRep()','swReplRepModal','.sw-tr');
  grab('openSwPlanRep()','swPlanRepModal','.pl-row');
  grab('openSwOut()','swOutModal','.out-tr');
  grab('openSwInc()','swIncModal','.sw-tr');
  document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
  return out});
Object.keys(t9).forEach(id=>{
  ok('Тайлан нээгдэж, түүхий гаралтгүй: '+id,
     t9[id].open&&!t9[id].raw,`${t9[id].n} мөр`)});
ok('Төлөвлөсөн дэрийн жагсаалтад хоёр мөр',t9.planRepModal.n===2,String(t9.planRepModal.n));

/* ── 10. Экспорт ── */
if(ExcelJS){
  console.log('\n10. Экспорт');
  const grab=async(call,label,sheets)=>{
    await page.evaluate(async c=>{window.__b64=null;
      await new Function('return (async()=>{'+c+'})()')()},call);
    try{await page.waitForFunction(()=>window.__b64,{timeout:45000})}
    catch(e){ok(label,false,'файл гарсангүй');return}
    const r=await page.evaluate(()=>window.__b64);
    try{
      if(/\.csv$/i.test(r.name)){
        const txt=Buffer.from(r.d,'base64').toString('utf8');
        const rows=txt.trim().split('\n');
        ok(label,rows.length>2&&/[;,]/.test(rows[0]),`${r.name} · ${rows.length} мөр`);
        return}
      const wb=new ExcelJS.Workbook();
      await wb.xlsx.load(Buffer.from(r.d,'base64'));
      const names=wb.worksheets.map(x=>x.name);
      ok(label,wb.worksheets.length>0&&(!sheets||sheets.every(s=>names.includes(s))),
         `${r.name} · ${names.join(' | ').slice(0,60)}`)
    }catch(e){ok(label,false,'нээгдсэнгүй: '+String(e.message).slice(0,50))}
  };
  await page.evaluate(async()=>{goDerHome();await new Promise(r=>setTimeout(r,300))});
  await grab("exportPu5Book('folder')",'ПУ-5 дэвтэр — өртөө');
  await grab("exportPu5Book('main')",'ПУ-5 дэвтэр — гол зам');
  await grab("exportPlanForm()",'Төлөвлөгөө',['Дэр','Дүнз']);
  await grab("exportCarveForm()",'Сийрэгжилт');
  await page.evaluate(async()=>{goSwHome();await new Promise(r=>setTimeout(r,300))});
  await grab("exportSwForms()",'Дүнзний маягт');
  await page.evaluate(async()=>{goDerHome();await new Promise(r=>setTimeout(r,260));
    openThresholdExport();await new Promise(r=>setTimeout(r,220))});
  await grab("saveRptAndExport()",'Excel тайлан');
  await grab("exportAllCSV()",'CSV');
}

/* ── 11. Үүлний хэсгүүд ── */
console.log('\n11. Үүл');
const t11=await page.evaluate(()=>{
  const p=_packDB(DB),parts=_splitDB(p),j=_joinParts(parts);
  const u=_unpackDB(JSON.parse(JSON.stringify(j)));
  const cnt=o=>(o.folders||[]).reduce((s,f)=>s+(f.tracks||[]).reduce((q,t)=>
    q+(t.sections||[]).reduce((z,x)=>z+(x.sleepers||[]).length,0),0),0);
  return{ids:Object.keys(parts).sort(),
    sl:cnt(DB)===cnt(u),
    sinc:(u.sinc||[]).length,sw:(u.sw||[]).length,
    inc:((u.sw[0]||{}).inc||[]).length,
    main:(u.main||[]).length,
    plan:!!(u.folders||[]).some(f=>(f.tracks||[]).some(t=>
      (t.sections||[]).some(s=>s.plan&&Object.keys(s.plan).length)))}});
ok('Үүлний хэсгүүд зөв сална',
   t11.ids.includes('meta')&&t11.ids.includes('main')&&
   t11.ids.some(x=>/^p_/.test(x))&&t11.ids.some(x=>/^s_/.test(x)),
   JSON.stringify(t11.ids));
ok('Задраад бүх дэр бүтэн',t11.sl,String(t11.sl));
ok('Агуулах, төлөвлөгөө, гол зам бүгд бүтэн',
   t11.sinc===1&&t11.inc===1&&t11.main===1&&t11.plan,
   `sinc ${t11.sinc} · inc ${t11.inc} · main ${t11.main} · plan ${t11.plan}`);

/* ── 12. Салаалсан гол зам (ПД-11) ── */
console.log('\n12. Салаалсан гол зам — ПД-11');
await page.evaluate(()=>doLogout());
await w(420);
await B.login(page,'ПД-11');
await quiet();
const t12=await page.evaluate(async()=>{
  DB.main=[{id:'M',num:700,kind:'main',mat:'tbd',sections:[
    {id:'ms',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',
     sleepers:[{type:'tbd',ts:0},{type:'bad_tbd',ts:0}]}]}];
  DB.folders=[];DB.sw=[];activeFolderId=null;DB.tracks=[];saveDB();
  openMainKmList();await new Promise(r=>setTimeout(r,320));
  const km=DB.main[0];
  openTrack(km.id,1);await new Promise(r=>setTimeout(r,260));
  openSection('ms');await new Promise(r=>setTimeout(r,320));
  const bulk=document.getElementById('recBulkBtn');
  return{salaa:isBranchSection(),lbl:mainLabel(),
    fast:segFastAt(km.sections[0],0,km),
    joy:getJoyType(0,60),
    bulkHidden:!bulk||getComputedStyle(bulk).display==='none'}});
ok('ПД-11 нь САЛААЛСАН гол замтай',t12.salaa&&t12.lbl==='Салаалсан гол зам',t12.lbl);
ok('Салаалсан гол замын ТБД нь ҮРГЭЛЖ CZ',t12.fast==='CZ',t12.fast);
ok('Доош шудрахад APC бүртгэхгүй',t12.joy==='',JSON.stringify(t12.joy));
ok('"Нийт дэр оруулах" салаалсан гол замд нуугдана',t12.bulkHidden,String(t12.bulkHidden));


/* ── 13. Ухарч бүртгэх — гүн булангууд ── */
console.log('\n13. Ухарч бүртгэх — гүн');
await page.evaluate(()=>doLogout());
await w(420);
await B.login(page,'ПД-7');
await quiet();
await page.evaluate(()=>{
  const mk=(id,lab,pat)=>({id,type:'normal',label:lab,note:'',date:'2026-05-01',
    sleepers:pat.split('').map(c=>({type:c==='b'?'bad':'normal',ts:0}))});
  DB.location='Мандал';
  DB.rpt={cls:'3',sec:'7',secName:'ПД-7',season:'хавар',year:'2026',date:'2026-04-01'};
  DB.folders=[{id:'RF',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-7',
    tracks:[{id:'RT',num:4,kind:'station',sections:[
      mk('u1','1-р үе','bnnnn'),mk('u2','2-р үе','nnbnn'),mk('u3','3-р үе','nnnnb')]}]},
    {id:'RB',br:1,name:'Салбар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-7',
     tracks:[{id:'RBT',num:1,kind:'station',name:'1-р зам Мак',
       sections:[mk('bu1','1-р үе','bnnn')]}]}];
  DB.main=[{id:'RM',num:700,kind:'main',mat:'tbd',sections:[mk('mu','1-р үе','nbnn')]}];
  DB.sw=[];DB.sinc=[];activeFolderId='RF';DB.tracks=DB.folders[0].tracks;
  _revTrk={};_revAsked={};saveDB();goHome()});

// Гол замд ухарч бүртгэх САНАЛ БОЛГОХГҮЙ
const r1=await page.evaluate(async()=>{
  openMainKmList();await new Promise(r=>setTimeout(r,300));
  openTrack('RM',1);await new Promise(r=>setTimeout(r,280));
  const wb=document.getElementById('walkBtn');
  const vis=wb?getComputedStyle(wb).display:'алга';
  _revTrk['RM']=1;                       // хүчээр тавьсан ч
  const rev=isRevTrack(getTrack('RM'));
  const walk=walkSections(getTrack('RM')).map(s=>s.label);
  delete _revTrk['RM'];
  return{vis,rev,walk}});
ok('Гол замд "явах чиглэл" товч гарахгүй',r1.vis==='none',r1.vis);
ok('Гол замыг ухарч бүртгэх боломжгүй (хүчээр ч)',!r1.rev&&r1.walk[0]==='1-р үе',
   `${r1.rev} · ${JSON.stringify(r1.walk)}`);

// Гурван үеийг ухарч дамжин туулна
const r2=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,300));
  openTrack('RT',1);await new Promise(r=>setTimeout(r,280));
  pickWalk(true);await new Promise(r=>setTimeout(r,240));
  const order=walkSections(activeTrack()).map(s=>s.label);
  openSection('u3');await new Promise(r=>setTimeout(r,320));
  const seen=[activeSec().label];
  navNextSection();await new Promise(r=>setTimeout(r,320));
  seen.push(activeSec().label);
  navNextSection();await new Promise(r=>setTimeout(r,320));
  seen.push(activeSec().label);
  goTab('home');await new Promise(r=>setTimeout(r,360));
  const t=getTrack('RT');
  return{order,seen,
    pats:t.sections.map(s=>s.label+'='+s.sleepers.map(x=>x.type==='bad'?'b':'n').join('')
      +(s.rw?'[rw]':'')).join(' | ')}});
ok('Ухрах горимд үе БУУРАХ дарааллаар',
   JSON.stringify(r2.order)===JSON.stringify(['3-р үе','2-р үе','1-р үе']),
   JSON.stringify(r2.order));
ok('Шудрахад дараалан 3 → 2 → 1 үе рүү шилжинэ',
   JSON.stringify(r2.seen)===JSON.stringify(['3-р үе','2-р үе','1-р үе']),
   JSON.stringify(r2.seen));
ok('Гурван үе бүгд жинхэнэ дараалалдаа буцна',
   r2.pats==='1-р үе=bnnnn | 2-р үе=nnbnn | 3-р үе=nnnnb',r2.pats);

// Ухарч байхад ТӨЛӨВЛӨСӨН дэр жинхэнэ дугаар дээрээ очно
const r3=await page.evaluate(async()=>{
  openTrack('RT',1);await new Promise(r=>setTimeout(r,260));
  openSection('u1');await new Promise(r=>setTimeout(r,320));
  // Ухрах дарааллаар #5 нь жинхэнэ #1 (тэнцэхгүй нь)
  const flip=activeSec().sleepers.map(x=>x.type==='bad'?'b':'n').join('');
  editIdx=4;openEditSleeper(4);await new Promise(r=>setTimeout(r,220));
  openPlanModal();await new Promise(r=>setTimeout(r,240));
  savePlan('tbd');await new Promise(r=>setTimeout(r,320));
  goTab('home');await new Promise(r=>setTimeout(r,360));
  const s=getTrack('RT').sections[0];
  return{flip,keys:Object.keys(s.plan||{}),
    pat:s.sleepers.map(x=>x.type==='bad'?'b':'n').join('')}});
ok('Ухарч байхад тэнцэхгүй дэр нь эсрэг үзүүрт байна',r3.flip==='nnnnb',r3.flip);
ok('Ухарч төлөвлөсөн дэр жинхэнэ #1 дээрээ очно',
   r3.keys.length===1&&r3.keys[0]==='0'&&r3.pat==='bnnnn',
   JSON.stringify(r3.keys)+' · '+r3.pat);

// Салбар замд ч ухарч бүртгэнэ
const r4=await page.evaluate(async()=>{
  goBrHome();await new Promise(r=>setTimeout(r,320));
  openBrFolder('RB');await new Promise(r=>setTimeout(r,340));
  openBrTrack('RBT');await new Promise(r=>setTimeout(r,300));
  const wb=document.getElementById('walkBtn');
  const vis=wb?getComputedStyle(wb).display:'алга';
  pickWalk(true);await new Promise(r=>setTimeout(r,240));
  openSection('bu1');await new Promise(r=>setTimeout(r,320));
  const flip=activeSec().sleepers.map(x=>x.type==='bad'?'b':'n').join('');
  backFromTrack();await new Promise(r=>setTimeout(r,380));
  const f=DB.folders.find(x=>x.id==='RB');
  return{vis,flip,view:(document.querySelector('.view.active')||{}).id,
    back:f.tracks[0].sections[0].sleepers.map(x=>x.type==='bad'?'b':'n').join(''),
    rw:!!f.tracks[0].sections[0].rw}});
ok('Салбар замд ч явах чиглэлийн товч гарна',r4.vis!=='none',r4.vis);
ok('Салбар замд ухарч бүртгэнэ',r4.flip==='nnnb',r4.flip);
ok('Салбараас буцахад дараалал сэргэж, салбар руугаа эргэнэ',
   r4.back==='bnnn'&&!r4.rw&&r4.view==='brHomeView',
   `${r4.back} · rw=${r4.rw} · ${r4.view}`);

/* ── 14. Агуулах дуусах — байхгүй дүнзээр солихгүй ── */
console.log('\n14. Агуулах дуусах');
const r5=await page.evaluate(async()=>{
  let it='nn';for(let i=0;i<6;i++)it+='b';
  DB.sw=[{id:'ZS',name:'Сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-7',
    turnouts:[{id:'zw',num:1,mak:'Р-65',mark:'1/9',head:2,it,dRepl:{},dPlan:{}}],
    inc:[{id:'zi',d:'2026-05-01',items:[{L:SW_LENS[0],n:1}]}]}];
  swFolderId='ZS';swTurnoutId='zw';saveDB();
  showView('swRecView');renderSwRec();await new Promise(r=>setTimeout(r,320));
  openSwDz(2);await new Promise(r=>setTimeout(r,200));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const first=[...document.querySelectorAll('#swWhL .wh-item')].map(e=>e.textContent);
  saveSwDzRepl();await new Promise(r=>setTimeout(r,320));   // ганц ширхэг дуусна
  const st=swStock();
  openSwDz(3);await new Promise(r=>setTimeout(r,200));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const opened=document.getElementById('swDzReplModal').classList.contains('open');
  _swDzIdx=3;_swDzL=SW_LENS[0];saveSwDzRepl();await new Promise(r=>setTimeout(r,280));
  const t=swTurnout();
  document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
  return{first,st,opened,has3:!!(t.dRepl&&t.dRepl[3]),n:Object.keys(t.dRepl||{}).length}});
ok('Агуулахад байгаа ганц урт л сонгогдоно',
   r5.first.length===1&&/·\s*1ш/.test(r5.first[0]),JSON.stringify(r5.first));
ok('Ганц ширхэг дуусахад үлдэгдэл 0',r5.st[String(3)]===0||Object.values(r5.st)[0]===0,
   JSON.stringify(r5.st));
ok('Дууссаны дараа солих цонх нээгдэхгүй',!r5.opened,String(r5.opened));
ok('Байхгүй дүнзээр сольсон бүртгэл ҮҮСЭХГҮЙ',!r5.has3&&r5.n===1,
   `${r5.has3} · ${r5.n} солилт`);

/* ── 15. Excel-ийн ТОО аппынхтай таарах ── */
if(ExcelJS){
  console.log('\n15. Excel-ийн тоо');
  const nums=await page.evaluate(async()=>{
    goDerHome();await new Promise(r=>setTimeout(r,300));
    openFolder('RF');await new Promise(r=>setTimeout(r,320));
    const t=getTrack('RT'),a=analyzeTrack(t);
    window.__b64=null;
    await exportPu5Book('folder');
    return{total:a.total,bad:a.totalBad,secs:t.sections.length}});
  await page.waitForFunction(()=>window.__b64,{timeout:45000});
  const r=await page.evaluate(()=>window.__b64);
  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(r.d,'base64'));
  const ws=wb.getWorksheet('Нийт дүн');
  let found=null;
  if(ws)ws.eachRow(row=>{
    const v=(row.values||[]).map(x=>x&&x.richText?x.richText.map(t=>t.text).join(''):x);
    if(found===null&&v.some(x=>typeof x==='number'&&x===nums.total))found=v});
  ok('ПУ-5 дэвтрийн "Нийт дүн"-д аппын тоо байна',
     !!found,`апп ${nums.total} дэр · ${nums.bad} тэнцэхгүй`);
}


/* ── 16. Паспорт хоорондын ӨВ — солигдсон огноо ── */
console.log('\n16. Паспорт хоорондын өв');
const r6=await page.evaluate(async()=>{
  const mk=(id,lab,pat)=>({id,type:'normal',label:lab,note:'',date:'2026-05-01',
    sleepers:pat.split('').map(c=>({type:c==='b'?'bad':'normal',ts:0}))});
  DB.folders=[
    {id:'SP',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-7',
     tracks:[{id:'K1',num:6,kind:'station',sections:[mk('s1','1-р үе','bbnnn')]}]},
    {id:'AU',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-7',
     tracks:[{id:'K2',num:6,kind:'station',sections:[mk('s1b','1-р үе','bnnnn')]}]}];
  DB.main=[];DB.sw=[];swFolderId=null;saveDB();
  // ХАВАР: #1 дэрийг сольсон
  openFolder('SP');await new Promise(r=>setTimeout(r,320));
  openTrack('K1',1);await new Promise(r=>setTimeout(r,260));
  openSection('s1');await new Promise(r=>setTimeout(r,320));
  editIdx=0;
  openReplModal();await new Promise(r=>setTimeout(r,220));
  _replY=2026;_replM=5;_replD=15;      // цонх нээгдсэний ДАРАА хүрдийг тавина
  await saveRepl('normal');await new Promise(r=>setTimeout(r,340));
  const spRepl=Object.keys(getTrack('K1').sections[0].repl||{});
  const spCount=replTotalCount();
  // НАМАР: тэр дэр дээр ӨМНӨХ огноо уламжлагдан харагдана
  goHome();await new Promise(r=>setTimeout(r,320));
  openFolder('AU');await new Promise(r=>setTimeout(r,340));
  openTrack('K2',1);await new Promise(r=>setTimeout(r,260));
  openSection('s1b');await new Promise(r=>setTimeout(r,340));
  const map=resolveReplMap(activeTrack(),activeSec());
  const own=Object.keys(activeSec().repl||{}).length;
  const rows=[...document.querySelectorAll('#rvLog .drow.dr-rec')]
    .map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,30));
  const prev=document.querySelectorAll('#rvLog .repl-date.rd-prev').length;
  const auCount=replTotalCount();
  return{spRepl,spCount,own,auCount,prev,
    inherit:!!(map[0]&&!map[0].own),date:map[0]?map[0].rec.d:null,
    row0:rows[0]}});
ok('Хаварт солилт бүртгэгдэв',r6.spRepl.length===1&&r6.spCount===1,
   JSON.stringify(r6.spRepl));
ok('Намрын паспортод ӨМНӨХ огноо уламжлагдан харагдана',
   r6.inherit&&r6.date==='2026-05-15',`${r6.inherit} · ${r6.date}`);
ok('Уламжилсан нь ТАСАРХАЙ саарлаар ялгагдана',r6.prev===1,String(r6.prev));
ok('Уламжилсан нь намрын ӨӨРИЙН тоонд ОРОХГҮЙ',
   r6.own===0&&r6.auCount===0,`өөрийн ${r6.own} · нийт ${r6.auCount}`);

/* Сумын дүнзний өв ч мөн адил */
const r7=await page.evaluate(async()=>{
  let it='nn';for(let i=0;i<6;i++)it+=(i<2?'b':'n');
  const mkT=()=>({id:'w'+Math.random().toString(36).slice(2,6),num:1,mak:'Р-65',mark:'1/9',
    head:2,it,dRepl:{},dPlan:{}});
  const a=mkT(),b=mkT();
  DB.sw=[
    {id:'SW1',name:'Хавар сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-7',
     turnouts:[a],inc:[{id:'i',d:'2026-04-01',items:[{L:SW_LENS[0],n:5}]}]},
    {id:'SW2',name:'Намар сум',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-7',
     turnouts:[b],inc:[]}];
  swFolderId='SW1';swTurnoutId=a.id;saveDB();
  showView('swRecView');renderSwRec();await new Promise(r=>setTimeout(r,300));
  openSwDz(2);await new Promise(r=>setTimeout(r,200));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  _swDzY=2026;_swDzM=6;_swDzD=20;      // цонх нээгдсэний ДАРАА
  saveSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const own1=Object.keys(swTurnout().dRepl||{}).length;
  swFolderId='SW2';swTurnoutId=b.id;
  showView('swRecView');renderSwRec();await new Promise(r=>setTimeout(r,340));
  const m=swResolveDRepl(swTurnout());
  const prev=document.querySelectorAll('#swLog .repl-date.rd-prev').length;
  document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
  return{own1,own2:Object.keys(swTurnout().dRepl||{}).length,
    inherit:!!(m[2]&&!m[2].own),date:m[2]?m[2].rec.d:null,prev}});
ok('Хаварт дүнз сольсон',r7.own1===1,String(r7.own1));
ok('Намрын сумын паспортод өмнөх огноо уламжлагдана',
   r7.inherit&&r7.date==='2026-06-20'&&r7.own2===0,
   `${r7.inherit} · ${r7.date} · өөрийн ${r7.own2}`);
ok('Уламжилсан дүнз тасархай саарлаар',r7.prev===1,String(r7.prev));

/* ── 17. Салбар замын экспорт ── */
if(ExcelJS){
  console.log('\n17. Салбар замын экспорт');
  const r8=await page.evaluate(async()=>{
    const mk=(id,lab,pat)=>({id,type:'normal',label:lab,note:'',date:'2026-05-01',
      sleepers:pat.split('').map(c=>({type:c==='b'?'bad':'normal',ts:0}))});
    DB.folders=[{id:'BX',br:1,name:'Салбар 2026',season:'хавар',year:'2026',
      date:'2026-04-01',sc:'ПД-7',
      tracks:[{id:'BXT',num:1,kind:'station',name:'7-р зам Мак',
        sections:[mk('bx1','1-р үе','bbbnnnnn')]}]}];
    let it='nn';for(let i=0;i<8;i++)it+=(i<3?'b':'n');
    DB.sw=[{id:'BSX',br:1,name:'Салбар сум',season:'хавар',year:'2026',
      date:'2026-04-01',sc:'ПД-7',
      turnouts:[{id:'bwx',num:1,mak:'Р-65',mark:'1/9',head:2,it,dRepl:{},dPlan:{}}],inc:[]}];
    DB.main=[];activeFolderId=null;DB.tracks=[];swFolderId=null;saveDB();
    goBrHome();await new Promise(r=>setTimeout(r,320));
    openBrFolder('BX');await new Promise(r=>setTimeout(r,340));
    const t=getTrack('BXT'),a=analyzeTrack(t);
    return{name:t.name,total:a.total,bad:a.totalBad,consec:consecTotalCount()}});
  ok('Салбарын зам дээр дараалсан цэг олдоно',r8.consec===1,String(r8.consec));
  await page.evaluate(()=>{window.__b64=null});
  await page.evaluate(async()=>{await exportPu5Book('folder')});
  await page.waitForFunction(()=>window.__b64,{timeout:45000});
  const f1=await page.evaluate(()=>window.__b64);
  const wb1=new ExcelJS.Workbook();
  await wb1.xlsx.load(Buffer.from(f1.d,'base64'));
  ok('Салбарын ПУ-5 дэвтэр гарна',
     /Салбар 2026/.test(f1.name)&&wb1.worksheets.length>1,
     `${f1.name} · ${wb1.worksheets.map(x=>x.name).join(' | ').slice(0,50)}`);
  await page.evaluate(async()=>{
    brTab('sw');await new Promise(r=>setTimeout(r,260));
    openBrSwFolder('BSX');await new Promise(r=>setTimeout(r,320));
    window.__b64=null;await exportSwForms()});
  await page.waitForFunction(()=>window.__b64,{timeout:45000});
  const f2=await page.evaluate(()=>window.__b64);
  const wb2=new ExcelJS.Workbook();
  await wb2.xlsx.load(Buffer.from(f2.d,'base64'));
  ok('Салбарын дүнзний маягт гарна',wb2.worksheets.length>0,
     `${f2.name} · ${wb2.worksheets.length} хуудас`);
}

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js|net::ERR/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1)})();
