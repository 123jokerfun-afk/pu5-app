/* ══════════════════════════════════════════════════════════════
   СОЛИХООР ТӨЛӨВЛӨХ + ДЭРИЙН АГУУЛАХ

   Төлөвлөгөө бол "энэ тэнцэхгүй дэр/дүнзийг ийм зүйлээр солино"
   гэсэн санамж. Үнэхээр солиход төлөвлөгөө нь ӨӨРӨӨ арилах ёстой —
   эс тэгвэл нэг дэр төлөвлөгөө болон солилт хоёулангид тоологдоно.

   Дэрийн агуулах нь ХЭСГИЙН түвшинд ганц: гол зам, өртөө, салаалсан,
   салбар зам бүгд түүнээс дэр авна. Зарлага нь солилтоос гарна.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
// Цэнхэр эсэхийг нэрээр нь биш, ЦЭНХЭР СУВАГ нь давамгайлж байгаагаар шалгана
const _isBlue=c=>{const m=String(c).match(/\d+/g);return !!m&&+m[2]>+m[0]+40&&+m[2]>=+m[1]};
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
ok('Хүрээ нь цэнхэр, зузаан',
   _isBlue(mark.col)&&parseFloat(mark.w)>parseFloat(mark.w4),
   `${mark.col} · ${mark.w} vs ${mark.w4}`);
ok('Төрлийн өнгө (тэнцэхгүй) хэвээр үлдэнэ',mark.keep,mark.on);
/* Хүрээ нь ганцаараа тод биш байсан тул ТӨРЛИЙН АРД цэнхэр хадаасны
   тэмдэг тавьсан. Эможи биш SVG — утас бүрт ижил өнгө, ижил хэмжээ. */
const pin=await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('#rvLog .drow.dr-rec')];
  const p=rows[5].querySelector('.pl-pin');
  const cs=p?getComputedStyle(p):null;
  return{has:!!p,none:!rows[4].querySelector('.pl-pin'),
    svg:!!(p&&p.querySelector('svg')),col:cs&&cs.color,
    order:[...rows[5].children].map(e=>e.className.split(' ')[0])}});
ok('Төлөвлөсөн дэр дээр цэнхэр хадаасны тэмдэг гарна',
   pin.has&&pin.none&&pin.svg,JSON.stringify(pin.order));
ok('Тэмдэг нь ТӨРЛИЙН АРД байрлана',
   pin.order[1]==='drum-badge'&&pin.order[2]==='pl-pin',JSON.stringify(pin.order));
ok('Тэмдгийн өнгө цэнхэр',_isBlue(pin.col),pin.col);

/* ── 2. Төлөвлөсөн дэрийн жагсаалт ── */
const rep=await page.evaluate(async()=>{
  // Хоёр дахь үед бас нэгийг төлөвлөнө
  openSection(activeTrack().sections[1].id);await new Promise(r=>setTimeout(r,280));
  openEditSleeper(2);await new Promise(r=>setTimeout(r,220));
  openPlanModal();await new Promise(r=>setTimeout(r,240));
  savePlan('wood');await new Promise(r=>setTimeout(r,280));
  goHome();await new Promise(r=>setTimeout(r,320));
  // v141: төлөвлөгөөний хавтас нь паспортоос гарч, агуулахын доор очсон
  const cards=[...document.querySelectorAll('#derWrap .folder-card')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+
            e.querySelector('.folder-meta').textContent.trim());
  const inPass=[...document.querySelectorAll('#replFolderWrap .folder-name')]
    .map(e=>e.textContent.trim());
  openPlanReport();await new Promise(r=>setTimeout(r,300));
  const rows=[...document.querySelectorAll('#planRepBody .pl-row')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  const ue=[...document.querySelectorAll('#planRepBody .pl-ue')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  const tot=(document.querySelector('#planRepBody .rp-total')||{}).textContent||'';
  const subs=[...document.querySelectorAll('#planRepBody .rp-sub')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  return{cards,inPass,rows,ue,tot,subs}});
ok('"Төлөвлөсөн дэр" карт нь Дэрийн агуулахын доор байна',
   rep.cards.some(x=>/^Төлөвлөсөн дэр\|2 дэр/.test(x)),JSON.stringify(rep.cards));
ok('Орлого · Зарлага · Төлөвлөсөн дэр гэсэн дараалалтай',
   /^Орлого\|/.test(rep.cards[0])&&/^Зарлага\|/.test(rep.cards[1])
   &&/^Төлөвлөсөн дэр\|/.test(rep.cards[2]),JSON.stringify(rep.cards.map(x=>x.split('|')[0])));
ok('Паспортын хавтаснуудад төлөвлөгөө БАЙХГҮЙ',
   !rep.inPass.some(x=>/Төлөвлөсөн/.test(x)),JSON.stringify(rep.inPass));
// Үеийн нэр нь бүлгийн мөрөнд байгаа тул мөрөнд давтагдахгүй:
// "#6 Тэнцэхгүй → ТБД" гэж одоогийн төрөл нь харагдана
ok('Мөр нь дугаар · одоогийн төрөл · төлөвлөсөн төрлөөр гарна',
   rep.rows.length===2&&/^#6 Тэнцэхгүй → ТБД/.test(rep.rows[0])
   &&/^#3 Тэнцэхгүй → Модон/.test(rep.rows[1]),JSON.stringify(rep.rows));
ok('Үеийн нэр нь бүлгийн мөрөнд л байна',
   rep.ue.length===2&&/^1-р үе/.test(rep.ue[0])&&/^2-р үе/.test(rep.ue[1]),
   JSON.stringify(rep.ue));
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
  const r=[...document.querySelectorAll('#rvLog .drow.dr-rec')][2];
  return{cls:r.className,pin:!!r.querySelector('.pl-pin')}});
ok('Сольсны дараа цэнхэр хүрээ нь арилна',!/dr-plan/.test(unmark.cls),unmark.cls);
ok('Сольсны дараа хадаасны тэмдэг ч арилна',!unmark.pin,String(unmark.pin));

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
ok('Нүүр хуудсанд Орлого · Зарлага · Төлөвлөсөн дэр гэсэн 3 карт',
   der.cards.length===3&&/^Орлого\|/.test(der.cards[0])&&/^Зарлага\|/.test(der.cards[1])
   &&/^Төлөвлөсөн дэр\|/.test(der.cards[2]),JSON.stringify(der.cards));
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
    w3:getComputedStyle(rows[3]).borderTopWidth,
    pin:!!rows[2].querySelector('.pl-pin')&&!rows[3].querySelector('.pl-pin'),
    pinOrder:[...rows[2].children].map(e=>e.className.split(' ')[0])}});
ok('Төлөвлөсөн дүнз дээр ч хадаасны тэмдэг гарна',
   smark.pin&&smark.pinOrder[2]==='sw-state'&&smark.pinOrder[3]==='pl-pin',
   JSON.stringify(smark.pinOrder));
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
  const cards=[...document.querySelectorAll('#swIncWrap .folder-card')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+
            e.querySelector('.folder-meta').textContent.trim());
  openSwPlanRep();await new Promise(r=>setTimeout(r,320));
  const rows=[...document.querySelectorAll('#swPlanRepBody .pl-row')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
  const body=document.getElementById('swPlanRepBody').textContent.replace(/\s+/g,' ');
  const tot=(document.querySelector('#swPlanRepBody .rp-total')||{}).textContent||'';
  return{cards,rows,body,tot}});
ok('"Төлөвлөсөн дүнз" карт нь Дүнзний агуулахын доор байна',
   srep.cards.length===3&&/^Орлого\|/.test(srep.cards[0])&&/^Зарлага\|/.test(srep.cards[1])
   &&/^Төлөвлөсөн дүнз\|1 ш · 3,5 пог\/м$/.test(srep.cards[2]),JSON.stringify(srep.cards));
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

/* ── 9. Сумын рам замын дэр (2,75 м) ──
   Сумын дүнд ордоггүй ч ДЭР л тул төлөвлөгөө нь дүнзнийхтэй биш,
   ДЭРИЙН төлөвлөгөөтэй нийлж, дэрийн агуулахаас гарна. */
console.log('\nСумын рам замын дэр');
await page.evaluate(()=>{
  let it='bbn';for(let i=0;i<40;i++)it+=i<3?'b':'n';
  DB.sw=[{id:'sfh',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-10',sc:'ПД-6',
    turnouts:[{id:'wh',num:3,station:'Шивээговь',mak:'Р-65',mark:'1/9',head:3,it,dRepl:{},dPlan:{}}],
    inc:[{id:'i1',d:'2026-05-01',items:[{L:3,n:6}]}]}];
  swFolderId='sfh';DB.sinc=[{id:'dh',d:'2026-05-01',n:50}];
  // Өмнөх шалгалтуудын дэрийн төлөвлөгөө, солилтоос салгана
  const wipe=t=>(t.sections||[]).forEach(x=>{delete x.repl;delete x.plan});
  (DB.folders||[]).forEach(f=>(f.tracks||[]).forEach(wipe));
  (DB.main||[]).forEach(wipe);
  activeFolderId='f-test1';DB.tracks=DB.folders[0].tracks;saveDB()});
const slp=await page.evaluate(async()=>{
  swTurnoutId='wh';showView('swRecView');renderSwRec();await new Promise(r=>setTimeout(r,340));
  openSwSl(1);await new Promise(r=>setTimeout(r,240));
  const btns=[...document.querySelectorAll('#swSlModal .etb')].map(b=>b.id||'');
  const pb=document.getElementById('swSlPlanBtn'),rb=document.getElementById('swSlReplBtn');
  const above=pb.compareDocumentPosition(rb)&Node.DOCUMENT_POSITION_FOLLOWING?1:0;
  openSwSlPlan();await new Promise(r=>setTimeout(r,300));
  const title=document.getElementById('planTitle').textContent;
  const stock=document.getElementById('planStock').textContent.replace(/\s+/g,' ').trim();
  savePlan('tbd');await new Promise(r=>setTimeout(r,320));
  const t=swTurnout(),rows=[...document.querySelectorAll('#swLog .drow.dr-rec')];
  return{btns,above,title,stock,plan:t.slPlan&&t.slPlan[1],n:planTotalCount(),
    pin:!!rows[1].querySelector('.pl-pin'),none:!rows[0].querySelector('.pl-pin'),
    cls:rows[1].className,swN:swPlanTotal()}});
ok('Рам замын дэр засах цонхонд "Солихоор төлөвлөх" гарна',
   slp.btns.indexOf('swSlPlanBtn')>=0,JSON.stringify(slp.btns));
ok('Сольсон мэдээллийн ДЭЭР байна',slp.above===1,String(slp.above));
ok('Гарчиг нь сум, рам замыг заана',/Сум 3 · рам зам төмөр #2/.test(slp.title),slp.title);
ok('ДЭРИЙН агуулахын үлдэгдэл харагдана',/Агуулахад 50 дэр/.test(slp.stock),slp.stock.slice(0,52));
ok('Төлөвлөгөө хадгалагдана',slp.plan==='tbd',String(slp.plan));
ok('ДЭРИЙН төлөвлөгөөнд тоологдоно, дүнзнийхэд ОРОХГҮЙ',
   slp.n===1&&slp.swN===0,`дэр ${slp.n} · дүнз ${slp.swN}`);
ok('Жагсаалт дээр хадаас, цэнхэр хүрээ гарна',
   slp.pin&&slp.none&&/dr-plan/.test(slp.cls),slp.cls);

const slrep=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,340));
  openPlanReport();await new Promise(r=>setTimeout(r,320));
  return{heads:[...document.querySelectorAll('#planRepBody .rp-track-hd')].map(e=>e.textContent.trim()),
    rows:[...document.querySelectorAll('#planRepBody .pl-row')].map(e=>e.textContent.replace(/\s+/g,' ').trim()),
    tot:(document.querySelector('#planRepBody .rp-total')||{}).textContent||''}});
// Толгойд нь одоо "одоо % → дараа %" хамт гардаг тул нэрээр нь л шүүнэ
ok('Төлөвлөсөн дэрийн жагсаалтад "3-р сум" бүлэг гарна',
   slrep.heads.some(x=>/^3-р сум/.test(x)),JSON.stringify(slrep.heads));
ok('Рам замын дэрийн хувь ч "одоо → дараа" гэж гарна',
   slrep.heads.some(x=>/%.*→.*%/.test(x)),JSON.stringify(slrep.heads));
ok('Мөр нь "#2 · Тэнцэхгүй → ТБД" гэж гарна',
   slrep.rows.some(x=>/^#2 Тэнцэхгүй → ТБД/.test(x)),JSON.stringify(slrep.rows));
ok('Нийт төлөвлөсөн дэрд тоологдоно',/1 дэр/.test(slrep.tot),slrep.tot);

const sljump=await page.evaluate(async()=>{
  document.querySelector('#planRepBody .pl-row').click();
  await new Promise(r=>setTimeout(r,440));
  return{view:document.querySelector('.view.active').id,tid:swTurnoutId,
    open:document.getElementById('planRepModal').classList.contains('open')}});
ok('Мөр дарахад тэр сумын бүртгэл рүү шууд очно',
   sljump.view==='swRecView'&&sljump.tid==='wh'&&!sljump.open,
   `${sljump.view} · ${sljump.tid}`);

const sldone=await page.evaluate(async()=>{
  openSwSl(1);await new Promise(r=>setTimeout(r,220));
  openSwSlRepl();await new Promise(r=>setTimeout(r,300));
  await saveRepl('tbd');await new Promise(r=>setTimeout(r,340));
  const t=swTurnout(),rows=[...document.querySelectorAll('#swLog .drow.dr-rec')];
  return{plan:!!(t.slPlan&&t.slPlan[1]),repl:!!(t.slRepl&&t.slRepl[1]),
    n:planTotalCount(),pin:!!rows[1].querySelector('.pl-pin'),
    out:derOutN(),rows:derOutRows().map(r=>r.grp+'/'+r.name+'='+r.n),st:derStock()}});
ok('Сольсны дараа төлөвлөгөө, тэмдэг хоёулаа арилна',
   !sldone.plan&&sldone.repl&&sldone.n===0&&!sldone.pin,
   `төлөвлөгөө ${sldone.plan} · солилт ${sldone.repl} · тэмдэг ${sldone.pin}`);
ok('Рам замын солилт ДЭРИЙН зарлагад орж, үлдэгдэл буурна',
   sldone.out===1&&sldone.rows.some(x=>/Сумын рам зам\/3-р сум=1/.test(x))&&sldone.st===49,
   JSON.stringify(sldone.rows)+' · үлдэгдэл '+sldone.st);

/* ── 10. "Сольсны дараа хэдэн хувь болох" ──
   Төлөвлөгөө бол шийдвэр гаргах хэрэгсэл: тэнцэхгүй хувь нь хэд болж
   буурахыг тэр дороо харуулах ёстой. Төлөвлөсөн дэр нь ТЭНЦЭХГҮЙ
   байсан үед л хувь буурна — хэвийн дэрийг солихоор төлөвлөсөн нь
   дүнг өөрчлөхгүй. */
console.log('\nТөлөвлөснөөр хэдэн хувь болох');
await page.evaluate(()=>{
  const mk=(id,lab,pat)=>({id,type:'normal',label:lab,note:'',date:'2026-05-01',
    sleepers:pat.split('').map(c=>({type:c==='b'?'bad':'normal',ts:0}))});
  DB.folders=[{id:'fp',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'tp',num:2,kind:'station',note:'',sections:[
      mk('p1','1-р үе','bbbbnnnnnn'),   // 4/10 = 40%
      mk('p2','2-р үе','bbnnnnnnnn')]}]}]; // 2/10 = 20%
  DB.main=[];activeFolderId='fp';DB.tracks=DB.folders[0].tracks;
  // 1-р үеэс 2 тэнцэхгүй, 2-р үеэс 1 тэнцэхгүй + 1 ХЭВИЙН дэр
  DB.folders[0].tracks[0].sections[0].plan={0:'tbd',1:'wood'};
  DB.folders[0].tracks[0].sections[1].plan={0:'tbd',5:'wood'};
  DB.sw=[];saveDB()});
const prj=await page.evaluate(()=>{
  const p=collectPlan()[0];
  return{n:p.n,tot:p.total,bad:p.bad,bad2:p.bad2,
    secs:p.secs.map(x=>`${x.label}:${x.bad}/${x.total}→${x.bad2}`)}});
ok('Замын дүн: 20 дэр, 6 тэнцэхгүй → 3 үлдэнэ',
   prj.tot===20&&prj.bad===6&&prj.bad2===3,`${prj.bad}/${prj.tot}→${prj.bad2}`);
ok('ХЭВИЙН дэрийг төлөвлөсөн нь хувийг бууруулахгүй',
   prj.secs[1]==='2-р үе:2/10→1',JSON.stringify(prj.secs));
const prui=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,340));
  openPlanReport();await new Promise(r=>setTimeout(r,340));
  return{hd:document.querySelector('#planRepBody .pl-hd').textContent.replace(/\s+/g,' ').trim(),
    ue:[...document.querySelectorAll('#planRepBody .pl-ue')].map(e=>e.textContent.replace(/\s+/g,' ').trim()),
    pcts:[...document.querySelectorAll('#planRepBody .pl-pct')].map(e=>e.textContent.replace(/\s+/g,'')),
    rows:[...document.querySelectorAll('#planRepBody .pl-row')].length}});
ok('Замын толгойд 30,0% → 15,0% гарна',
   /2-р зам\s*30\.0%\s*→\s*15\.0%/.test(prui.hd),prui.hd);
ok('Дэрүүд нь ҮЕ-ээрээ бүлэглэгдэж, үе бүр өөрийн хувьтай',
   prui.ue.length===2&&/1-р үе/.test(prui.ue[0])&&/2-р үе/.test(prui.ue[1]),
   JSON.stringify(prui.ue));
ok('1-р үе 40,0% → 20,0%',/^40\.0%→20\.0%$/.test(prui.pcts[1]),prui.pcts[1]);
ok('2-р үе 20,0% → 10,0%',/^20\.0%→10\.0%$/.test(prui.pcts[2]),prui.pcts[2]);
ok('Мөрийн тоо хэвээр',prui.rows===4,String(prui.rows));

/* Дүнз — хувь нь ПОГ/М-ээр бодогдоно */
const swp=await page.evaluate(async()=>{
  let it='nn';for(let i=0;i<8;i++)it+=i<4?'b':'n';
  DB.sw=[{id:'sp',name:'Намар',season:'намар',year:'2026',date:'2026-09-10',sc:'ПД-6',
    turnouts:[{id:'ws',num:5,mak:'Р-65',mark:'1/9',head:2,it,dRepl:{},
      dPlan:{2:3,3:3.5,7:3}}],       // #2,#3 тэнцэхгүй; #7 нь ХЭВИЙН
    inc:[{id:'i1',d:'2026-05-01',items:[{L:3,n:9},{L:3.5,n:9}]}]}];
  swFolderId='sp';saveDB();
  const c=collectSwPlan()[0];
  openSwPlanRep();await new Promise(r=>setTimeout(r,340));
  return{m:c.m,mBad:c.mBad,mBad2:c.mBad2,
    hd:document.querySelector('#swPlanRepBody .pl-hd').textContent.replace(/\s+/g,' ').trim(),
    sub:[...document.querySelectorAll('#swPlanRepBody .rp-sub')]
      .map(e=>e.textContent.replace(/\s+/g,' ').trim())[0]}});
ok('Тэнцэхгүй пог/м нь АНХНЫ уртаар хасагдана (12 → 6)',
   swp.m===24&&swp.mBad===12&&swp.mBad2===6,`${swp.mBad}→${swp.mBad2} / ${swp.m}`);
ok('Сумын толгойд 50,0% → 25,0% гарна',
   /50\.0%\s*→\s*25\.0%/.test(swp.hd),swp.hd);
ok('Хөл мөрөнд тэнцэхгүй пог/м-ийн өөрчлөлт гарна',
   /12 → 6 тэнцэхгүй пог\/м/.test(swp.sub||''),swp.sub);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
