/* ══════════════════════════════════════════════════════════════
   СОЛИХООР ТӨЛӨВЛӨХ + ДЭРИЙН АГУУЛАХ

   Төлөвлөгөө бол "энэ тэнцэхгүй дэр/дүнзийг ийм зүйлээр солино"
   гэсэн санамж. Үнэхээр солиход төлөвлөгөө нь ӨӨРӨӨ арилах ёстой —
   эс тэгвэл нэг дэр төлөвлөгөө болон солилт хоёулангид тоологдоно.

   Дэрийн агуулах нь ХЭСГИЙН түвшинд ганц: гол зам, өртөө, салаалсан,
   салбар зам бүгд түүнээс дэр авна. Зарлага нь солилтоос гарна.
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

/* ── 1. ДЭР: төлөвлөх товч байрлал ── */
console.log('\nДэр — төлөвлөх');
const pos=await page.evaluate(async()=>{
  openFolder('f-test1');await new Promise(r=>setTimeout(r,300));
  openTrack('t1',1);await new Promise(r=>setTimeout(r,260));
  openSection(activeTrack().sections[0].id);await new Promise(r=>setTimeout(r,300));
  openEditSleeper(5);await new Promise(r=>setTimeout(r,260));
  const btns=[...document.querySelectorAll('#editSleeperModal .etb')].map(b=>b.id||'');
  const pb=document.getElementById('planBtn'),rb=document.getElementById('replBtn');
  return{btns,lbl:pb.textContent.trim(),
    above:pb.compareDocumentPosition(rb)&Node.DOCUMENT_POSITION_FOLLOWING?1:0}});
ok('Дэр засах цонхонд "Солихоор төлөвлөх" гарна',
   pos.btns.indexOf('planBtn')>=0,JSON.stringify(pos.btns));
ok('Төлөвлөх нь сольсон мэдээллийн ДЭЭР байна',pos.above===1,String(pos.above));

const pl=await page.evaluate(async()=>{
  openPlanModal();await new Promise(r=>setTimeout(r,280));
  const opts=[...document.querySelectorAll('#planModal .edit-grid .etb')].map(b=>b.textContent.trim());
  const stock=document.getElementById('planStock').textContent;
  savePlan('tbd');await new Promise(r=>setTimeout(r,300));
  const sec=activeSec();
  return{opts,stock,plan:sec.plan&&sec.plan[5],n:planTotalCount(),
    type:sec.sleepers[5].type}});
ok('Зөвхөн ЯМАР ТӨРЛӨӨР солихыг сонгоно (Модон / ТБД)',
   pl.opts.length===2&&/Модон/.test(pl.opts[0])&&/ТБД/.test(pl.opts[1]),JSON.stringify(pl.opts));
ok('Агуулах хөтлөөгүй бол зөвлөмж өгнө',/агуулах хөтлөөгүй/i.test(pl.stock),pl.stock.slice(0,44));
ok('Төлөвлөгөө хадгалагдана',pl.plan==='tbd'&&pl.n===1,`${pl.plan} · ${pl.n}`);
ok('Төлөвлөх нь дэрийн ТӨРЛИЙГ өөрчлөхгүй',pl.type==='bad',pl.type);

/* Жагсаалт дээр ЦЭНХЭР ХҮРЭЭГЭЭР ялгагдана */
const mark=await page.evaluate(async()=>{
  renderRecordView(5);await new Promise(r=>setTimeout(r,320));
  const rows=[...document.querySelectorAll('#rvLog .drow.dr-rec')];
  const cs=getComputedStyle(rows[5]);
  return{on:rows[5].className,off:rows[4].className,
    col:cs.borderTopColor,w:cs.borderTopWidth,
    w4:getComputedStyle(rows[4]).borderTopWidth,
    keep:/dr-bad/.test(rows[5].className)}});
ok('Төлөвлөсөн дэр жагсаалт дээр тэмдэглэгдэнэ',
   /dr-plan/.test(mark.on)&&!/dr-plan/.test(mark.off),mark.on);
// Цэнхэр эсэхийг нэрээр нь биш, ЦЭНХЭР СУВАГ нь давамгайлж байгаагаар шалгана
const _isBlue=c=>{const m=c.match(/\d+/g);return m&&+m[2]>+m[0]+40&&+m[2]>=+m[1]};
ok('Хүрээ нь цэнхэр, зузаан',
   _isBlue(mark.col)&&parseFloat(mark.w)>parseFloat(mark.w4),
   `${mark.col} · ${mark.w} vs ${mark.w4}`);
ok('Төрлийн өнгө (тэнцэхгүй) хэвээр үлдэнэ',mark.keep,mark.on);

/* ── 2. Төлөвлөсөн дэрийн жагсаалт ── */
const rep=await page.evaluate(async()=>{
  // Хоёр дахь үед бас нэгийг төлөвлөнө
  openSection(activeTrack().sections[1].id);await new Promise(r=>setTimeout(r,280));
  openEditSleeper(2);await new Promise(r=>setTimeout(r,220));
  openPlanModal();await new Promise(r=>setTimeout(r,240));
  savePlan('wood');await new Promise(r=>setTimeout(r,280));
  goHome();await new Promise(r=>setTimeout(r,320));
  const cards=[...document.querySelectorAll('#replFolderWrap .folder-card')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+
            e.querySelector('.folder-meta').textContent.trim());
  openPlanReport();await new Promise(r=>setTimeout(r,300));
  const rows=[...document.querySelectorAll('#planRepBody .pl-row')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  const tot=(document.querySelector('#planRepBody .rp-total')||{}).textContent||'';
  const subs=[...document.querySelectorAll('#planRepBody .rp-sub')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  return{cards,rows,tot,subs}});
ok('Паспортад "Төлөвлөсөн дэр" карт нэмэгдэв',
   rep.cards.some(x=>/^Төлөвлөсөн дэр\|2 дэр/.test(x)),JSON.stringify(rep.cards));
ok('Жагсаалт нь зам · үе · дэрийн дугаартай',
   rep.rows.length===2&&/1-р үе #6 ТБД/.test(rep.rows[0])&&/2-р үе #3 Модон/.test(rep.rows[1]),
   JSON.stringify(rep.rows));
ok('Доор нь нийт дэр гарна',/Нийт төлөвлөсөн/.test(rep.tot)&&/2 дэр/.test(rep.tot),rep.tot);
ok('Модон / ТБД задаргаа гарна',
   rep.subs.some(x=>/Модон 1 дэр/.test(x)&&/ТБД 1 дэр/.test(x)),JSON.stringify(rep.subs));

/* ── 3. Мөр дээр дарвал тэр үе рүү шууд очно ── */
const jump=await page.evaluate(async()=>{
  document.querySelectorAll('#planRepBody .pl-row')[1].click();
  await new Promise(r=>setTimeout(r,420));
  return{view:document.querySelector('.view.active')?document.querySelector('.view.active').id:'',
    sec:activeSec()?activeSec().label:'',trk:activeTrack()?activeTrack().num:0,
    open:document.getElementById('planRepModal').classList.contains('open')}});
ok('Төлөвлөсөн мөр дарахад дэрийн жагсаалт руу очно',
   jump.view==='recordView'&&jump.sec==='2-р үе'&&jump.trk===3,
   `${jump.view} · ${jump.trk}-р зам · ${jump.sec}`);
ok('Жагсаалтын цонх хаагдана',!jump.open,String(jump.open));

/* ── 4. Үнэхээр солиход төлөвлөгөө нь арилна ── */
const done=await page.evaluate(async()=>{
  openEditSleeper(2);await new Promise(r=>setTimeout(r,220));
  openReplModal();await new Promise(r=>setTimeout(r,260));
  await saveRepl('normal');await new Promise(r=>setTimeout(r,340));
  const sec=activeSec();
  return{plan:!!(sec.plan&&sec.plan[2]),repl:!!(sec.repl&&sec.repl[2]),n:planTotalCount()}});
ok('Сольсны дараа төлөвлөгөө нь өөрөө арилна',
   !done.plan&&done.repl&&done.n===1,`төлөвлөгөө ${done.plan} · солилт ${done.repl}`);
const unmark=await page.evaluate(async()=>{
  renderRecordView(2);await new Promise(r=>setTimeout(r,300));
  return[...document.querySelectorAll('#rvLog .drow.dr-rec')][2].className});
ok('Сольсны дараа цэнхэр хүрээ нь арилна',!/dr-plan/.test(unmark),unmark);

/* ── 5. ДЭРИЙН АГУУЛАХ ── */
console.log('\nДэрийн агуулах');
const der=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,320));
  const cards=[...document.querySelectorAll('#derWrap .folder-card')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+
            e.querySelector('.folder-meta').textContent.trim());
  openDerInc();await new Promise(r=>setTimeout(r,260));
  const empty=document.getElementById('derIncBody').textContent.trim();
  openDerIncAdd();await new Promise(r=>setTimeout(r,260));
  setDerIncN(200);await new Promise(r=>setTimeout(r,90));
  const prev=document.getElementById('derIncPrev').textContent;
  saveDerInc();await new Promise(r=>setTimeout(r,300));
  return{cards,empty,prev,inc:derIncN(),out:derOutN(),st:derStock(),
    open:document.getElementById('derIncAddModal').classList.contains('open'),
    body:document.getElementById('derIncBody').textContent.replace(/\s+/g,' ').trim()}});
ok('Нүүр хуудсанд Орлого, Зарлага карт гарна',
   der.cards.length===2&&/^Орлого\|/.test(der.cards[0])&&/^Зарлага\|/.test(der.cards[1]),
   JSON.stringify(der.cards));
ok('Эхэндээ орлого хоосон',/Орлого бүртгээгүй/.test(der.empty),der.empty.slice(0,30));
ok('Орлого авахад он сар өдөр + дэрийн тоо л хэрэгтэй',der.inc===200,String(der.inc));
ok('Цонх хаагдаж, жагсаалтад орно',!der.open&&/200 дэр/.test(der.body),der.body.slice(0,60));
ok('Зарлага нь СОЛИЛТООС гарна',der.out===1,String(der.out));
ok('Үлдэгдэл = орлого − зарлага',der.st===199,String(der.st));

const dout=await page.evaluate(async()=>{
  closeModal('derIncModal');await new Promise(r=>setTimeout(r,200));
  openDerOut();await new Promise(r=>setTimeout(r,280));
  const rows=[...document.querySelectorAll('#derOutBody .out-tr')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  const tot=(document.querySelector('#derOutBody .rp-total')||{}).textContent||'';
  closeModal('derOutModal');
  return{rows,tot}});
ok('Зарлага зам тус бүрээр харагдана',
   dout.rows.length===1&&/3-р зам/.test(dout.rows[0])&&/1 дэр/.test(dout.rows[0]),
   JSON.stringify(dout.rows));
ok('Нийт зарлага гарна',/Нийт зарлага/.test(dout.tot)&&/1 дэр/.test(dout.tot),dout.tot);

const st2=await page.evaluate(async()=>{
  // Агуулах хөтлөгдсөн тул төлөвлөх цонх одоо ҮЛДЭГДЭЛ харуулна
  openTrack('t1',1);await new Promise(r=>setTimeout(r,240));
  openSection(activeTrack().sections[0].id);await new Promise(r=>setTimeout(r,280));
  openEditSleeper(6);await new Promise(r=>setTimeout(r,220));
  openPlanModal();await new Promise(r=>setTimeout(r,260));
  const txt=document.getElementById('planStock').textContent.replace(/\s+/g,' ').trim();
  closeModal('planModal');return txt});
ok('Төлөвлөхөд дэрийн ҮЛДЭГДЭЛ харагдана',
   /199/.test(st2)&&/төлөвлөсөн 1/.test(st2)&&/үлдэх 198/.test(st2),st2);

/* ── 6. ДҮНЗ: төлөвлөх ── */
console.log('\nДүнз — төлөвлөх');
await page.evaluate(()=>{
  let it='nn';for(let i=0;i<68;i++)it+=[0,1,2,19].includes(i)?'b':'n';
  DB.sw=[{id:'sf',name:'Хавар 2026 сум',season:'хавар',year:'2026',date:'2026-04-10',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,station:'Шивээговь',mak:'Р-65',mark:'1/9',proj:'2766',head:2,it,dRepl:{}}],
    inc:[{id:'i1',d:'2026-05-01',items:[{L:3,n:2},{L:3.5,n:1}]}]}];
  swFolderId='sf';saveDB()});
const sp=await page.evaluate(async()=>{
  swTurnoutId='w1';showView('swRecView');renderSwRec();await new Promise(r=>setTimeout(r,300));
  openSwDz(2);await new Promise(r=>setTimeout(r,200));
  const btns=[...document.querySelectorAll('#swDzModal .etb')].map(b=>b.id||'');
  const pb=document.getElementById('swDzPlanBtn'),rb=document.getElementById('swDzReplBtn');
  const above=pb.compareDocumentPosition(rb)&Node.DOCUMENT_POSITION_FOLLOWING?1:0;
  openSwDzPlan();await new Promise(r=>setTimeout(r,340));
  const items=[...document.querySelectorAll('#swPlWhL .wh-item')].map(e=>e.textContent);
  _swPlL=3.5;saveSwDzPlan();await new Promise(r=>setTimeout(r,320));
  const t=swTurnout();
  return{btns,above,items,plan:t.dPlan&&t.dPlan[2],by:swPlanBy(),st:swStock()}});
ok('Дүнз засах цонхонд "Солихоор төлөвлөх" гарна',
   sp.btns.indexOf('swDzPlanBtn')>=0,JSON.stringify(sp.btns));
ok('Төлөвлөх нь сольсон мэдээллийн ДЭЭР байна',sp.above===1,String(sp.above));
ok('Төлөвлөхөд ОРЛОГОД байгаа дүнз л сонгогдоно, ард нь үлдэгдэл',
   sp.items.length===2&&/^3 · 2ш$/.test(sp.items[0])&&/^3,5 · 1ш$/.test(sp.items[1]),
   JSON.stringify(sp.items));
ok('Дүнзний төлөвлөгөө хадгалагдана',+sp.plan===3.5,String(sp.plan));
const smark=await page.evaluate(async()=>{
  renderSwRec(2);await new Promise(r=>setTimeout(r,320));
  const rows=[...document.querySelectorAll('#swLog .drow.dr-rec')];
  return{on:rows[2].className,off:rows[3].className,
    col:getComputedStyle(rows[2]).borderTopColor,
    w:getComputedStyle(rows[2]).borderTopWidth,
    w3:getComputedStyle(rows[3]).borderTopWidth}});
ok('Төлөвлөсөн дүнз жагсаалт дээр цэнхэр хүрээтэй',
   /dr-plan/.test(smark.on)&&!/dr-plan/.test(smark.off)
   &&_isBlue(smark.col)&&parseFloat(smark.w)>parseFloat(smark.w3),
   `${smark.on} · ${smark.col} ${smark.w}`);
// Төлөвлөх нь агуулахаас дүнз ГАРГАХГҮЙ — зөвхөн сул үлдэгдлийг "захиалдаг".
// Бодит үлдэгдэл зөвхөн СОЛИХОД буурна.
ok('Төлөвлөсөн дүнз захиалагдана, үлдэгдэл нь хэвээр',
   sp.by['3.5']===1&&sp.st['3.5']===1,
   JSON.stringify(sp.by)+' · '+JSON.stringify(sp.st));

const sp2=await page.evaluate(async()=>{
  // Сул үлдэгдэлгүй болсон 3,5-г өөр дүнз дээр дахин төлөвлөж болохгүй
  openSwDz(3);await new Promise(r=>setTimeout(r,200));
  openSwDzPlan();await new Promise(r=>setTimeout(r,320));
  const items=[...document.querySelectorAll('#swPlWhL .wh-item')].map(e=>e.textContent);
  _swPlL=3.5;saveSwDzPlan();await new Promise(r=>setTimeout(r,300));
  const t=swTurnout();
  closeModal('swPlanModal');closeModal('swDzModal');
  return{items,has3:!!(t.dPlan&&t.dPlan[3])}});
ok('Аль хэдийн төлөвлөсөн дүнз дахин санал болгогдохгүй',
   sp2.items.length===1&&/^3 · 2ш$/.test(sp2.items[0]),JSON.stringify(sp2.items));
ok('Сул үлдэгдэлгүй уртаар төлөвлөх боломжгүй',!sp2.has3,String(sp2.has3));

const srep=await page.evaluate(async()=>{
  goSwHome();await new Promise(r=>setTimeout(r,320));
  const cards=[...document.querySelectorAll('#swFolderWrap .folder-card')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+
            e.querySelector('.folder-meta').textContent.trim());
  openSwPlanRep();await new Promise(r=>setTimeout(r,320));
  const rows=[...document.querySelectorAll('#swPlanRepBody .pl-row')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  const body=document.getElementById('swPlanRepBody').textContent.replace(/\s+/g,' ');
  const tot=(document.querySelector('#swPlanRepBody .rp-total')||{}).textContent||'';
  return{cards,rows,body,tot}});
ok('Сумын паспортад "Төлөвлөсөн дүнз" карт нэмэгдэв',
   srep.cards.some(x=>/^Төлөвлөсөн дүнз\|1 ш · 3,5 пог\/м$/.test(x)),JSON.stringify(srep.cards));
ok('Жагсаалт нь дүнзний дугаар, одоогийн ба төлөвлөсөн уртыг харуулна',
   srep.rows.length===1&&/#1/.test(srep.rows[0])&&/3,5 м/.test(srep.rows[0]),
   JSON.stringify(srep.rows));
ok('Уртаар нь ш · нийт пог/м гарна',/3,5 м 1 ш 3,5 пог\/м/.test(srep.body),
   (srep.body.match(/Уртаар нь.{0,60}/)||[''])[0]);
ok('Доор нь нийт ш ба нийт пог/м',/1 ш · 3,5 пог\/м/.test(srep.tot),srep.tot);

const sj=await page.evaluate(async()=>{
  document.querySelector('#swPlanRepBody .pl-row').click();
  await new Promise(r=>setTimeout(r,420));
  return{view:document.querySelector('.view.active')?document.querySelector('.view.active').id:'',
    tid:swTurnoutId,open:document.getElementById('swPlanRepModal').classList.contains('open')}});
ok('Төлөвлөсөн дүнз дарахад тэр сумын дүнзний жагсаалт руу очно',
   sj.view==='swRecView'&&sj.tid==='w1'&&!sj.open,`${sj.view} · ${sj.tid}`);

const sdone=await page.evaluate(async()=>{
  openSwDz(2);await new Promise(r=>setTimeout(r,200));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  _swDzL=3.5;saveSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const t=swTurnout();
  return{plan:!!(t.dPlan&&t.dPlan[2]),repl:!!(t.dRepl&&t.dRepl[2]),n:swPlanTotal()}});
ok('Дүнз сольсны дараа төлөвлөгөө нь өөрөө арилна',
   !sdone.plan&&sdone.repl&&sdone.n===0,`төлөвлөгөө ${sdone.plan} · солилт ${sdone.repl}`);

/* ── 7. Шахалт/задаргаа, үүлний хэсэг ── */
const pk=await page.evaluate(()=>{
  const p=_packDB(DB),parts=_splitDB(p),j=_joinParts(parts);
  const sec=(p.folders[0].tracks[0].sections||[])[0];
  return{sinc:(j.sinc||[]).length,meta:!!parts.meta.sinc,plan:sec&&sec.plan?sec.plan['5']:null}});
ok('Дэрийн орлого үүлний meta хэсэгт очно',pk.meta&&pk.sinc===1,`${pk.sinc} баримт`);
ok('Төлөвлөгөө шахалтад алдагдахгүй',pk.plan==='tbd',String(pk.plan));

/* ── 8. Захын тохиолдол ── */
console.log('\nЗахын тохиолдол');

/* Зарлага нь БҮХ паспортыг хамарна. DB.tracks нь идэвхтэй паспортын
   tracks-тай НЭГ объект тул паспортуудыг гүйхэд давхардах эрсдэлтэй. */
const dup=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,300));
  // Өмнөх шалгалтуудын үлдэгдлээс салгаж, мэдэгдэх байдлаас эхэлнэ
  const wipe=t=>(t.sections||[]).forEach(s=>{delete s.repl;delete s.plan});
  (DB.folders||[]).forEach(f=>(f.tracks||[]).forEach(wipe));
  (DB.main||[]).forEach(wipe);
  const f1=DB.folders[0],f2=DB.folders[1];
  f1.tracks[0].sections[0].repl={5:{d:'2026-06-01',t:'normal',m:'wood'}};
  f2.tracks[0].sections[0].repl={5:{d:'2026-06-02',t:'tbd',m:'tbd'},
                                 6:{d:'2026-06-03',t:'normal',m:'wood'}};
  DB.main[0].sections[0].repl={7:{d:'2026-06-04',t:'normal',m:'wood'}};
  DB.sinc=[{id:'d1',d:'2026-05-01',n:10}];saveDB();
  return{same:DB.tracks===DB.folders[0].tracks,out:derOutN(),st:derStock(),
    rows:derOutRows().map(r=>r.grp+'/'+r.name+'='+r.n)}});
ok('DB.tracks нь идэвхтэй паспортын tracks-тай НЭГ объект',dup.same,String(dup.same));
ok('Зарлага бүх паспортыг хамарна, давхардахгүй (1+2+1=4)',
   dup.out===4,dup.out+' · '+JSON.stringify(dup.rows));
ok('Үлдэгдэл = орлого − зарлага (10−4)',dup.st===6,String(dup.st));
const neg=await page.evaluate(()=>{DB.sinc=[{id:'d1',d:'2026-05-01',n:2}];saveDB();return derStock()});
ok('Орлогоос их сольвол сөрөг үлдэгдэл ил гарна (2−4)',neg===-2,String(neg));

/* Дэрийн тоо өөрчлөгдөхөд төлөвлөгөө нь дагаж зөв дэр дээрээ үлдэнэ */
const bulk=await page.evaluate(async()=>{
  openTrack('t1',1);await new Promise(r=>setTimeout(r,300));
  const sec=activeTrack().sections[0];
  openSection(sec.id);await new Promise(r=>setTimeout(r,320));
  sec.plan={};secPlan(sec)[20]='tbd';secPlan(sec)[3]='wood';saveDB();
  document.getElementById('bulkN').value=10;
  await applyBulk();await new Promise(r=>setTimeout(r,420));
  return Object.keys(activeSec().plan||{})});
ok('Дэр цөөрүүлэхэд гадуур үлдсэн төлөвлөгөө арилна',
   bulk.length===1&&bulk[0]==='3',JSON.stringify(bulk));
const dl=await page.evaluate(async()=>{
  const sec=activeSec();
  sec.plan={5:'tbd'};sec.repl={5:{d:'2026-06-01',t:'normal',m:'wood'}};saveDB();
  editIdx=2;await deleteSleeper();await new Promise(r=>setTimeout(r,380));
  const s=activeSec();
  return{plan:Object.keys(s.plan||{}),repl:Object.keys(s.repl||{})}});
ok('Дунд нь дэр устгахад төлөвлөгөө солилттой хамт 1-ээр ухарна',
   dl.plan.length===1&&dl.plan[0]==='4'&&dl.repl[0]==='4',
   JSON.stringify(dl.plan)+' · '+JSON.stringify(dl.repl));
const rv=await page.evaluate(()=>{
  const sec=activeSec(),n=sec.sleepers.length;
  sec.plan={0:'tbd'};delete sec.repl;saveDB();
  _revSwap(sec);const a=Object.keys(sec.plan)[0];
  _revSwap(sec);return{n,a,back:Object.keys(sec.plan)[0]}});
ok('Ухарч бүртгэхэд төлөвлөгөө дугаартайгаа хамт эргэнэ',
   +rv.a===rv.n-1&&rv.back==='0',`#1 → #${+rv.a+1} → #${+rv.back+1}`);

/* Сум устахад түүний дүнзний төлөвлөгөө хамт алга болно */
const swd=await page.evaluate(()=>{
  const f=swFolder();
  f.turnouts.push({id:'w9',num:9,mak:'Р-65',mark:'1/9',head:2,it:f.turnouts[0].it,
    dRepl:{},dPlan:{5:3}});saveDB();
  const a=swPlanTotal();
  f.turnouts=f.turnouts.filter(t=>t.id!=='w9');saveDB();
  return{a,b:swPlanTotal()}});
ok('Сум устахад түүний дүнзний төлөвлөгөө хамт арилна',
   swd.a===1&&swd.b===0,`${swd.a} → ${swd.b}`);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
