/* ══════════════════════════════════════════════════════════════
   ДҮНЗНИЙ АГУУЛАХ — ОРЛОГО / ЗАРЛАГА

   Зарлага нь ТУСАД НЬ бүртгэгддэггүй: сумын дүнз солих бүрт тухайн
   урт агуулахаас гарна. Ингэснээр тоо хоёр газраас гарахгүй —
   солилт бол ганц эх сурвалж. Энэ тест тэр холбоог хамгаална.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const w=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  const b=document.getElementById('__errbar');if(b)b.remove();
  const e=document.getElementById('errBanner');if(e)e.remove();
  window.appConfirm=()=>Promise.resolve(true)});

/* Р-65 1/9 сум ×2. Эхний 2 нь рам замын дэр, дараа нь 68 дүнз. */
await page.evaluate(()=>{
  let it='nn';for(let i=0;i<68;i++)it+=[0,1,2,19].includes(i)?'b':'n';
  const to=(id,num)=>({id,num,station:'Шивээговь',mak:'Р-65',mark:'1/9',proj:'2766',
    head:2,it,dRepl:{}});
  DB.sw=[{id:'sf',name:'Хавар 2026 сум',season:'хавар',year:'2026',date:'2026-04-10',
    sc:'ПД-6',turnouts:[to('w1',1),to('w3',3)]}];
  swFolderId='sf';saveDB()});

/* ── 1. Орлого авах ── */
console.log('\nОрлого');
const inc=await page.evaluate(async()=>{
  openSwInc();await new Promise(r=>setTimeout(r,250));
  const empty=document.getElementById('swIncBody').textContent.trim();
  openSwIncAdd();await new Promise(r=>setTimeout(r,250));
  const n0=document.querySelectorAll('#swIncRows .inc-row').length;
  // Урт ба ширхэг нь бичихгүй, ХҮРДЭЭР сонгогдоно
  const lw=[...document.querySelectorAll('#swIncWhL .wh-item')].map(e=>e.textContent);
  const nw=document.querySelectorAll('#swIncWhN .wh-item').length;
  const inp=document.querySelectorAll('#swIncAddModal input,#swIncAddModal select').length;
  _incL=3;_incN=10;_incAdd();await new Promise(r=>setTimeout(r,90));
  const n1=document.querySelectorAll('#swIncRows .inc-row').length;
  _incL=3.25;_incN=4;_incAdd();await new Promise(r=>setTimeout(r,90));
  const n2=document.querySelectorAll('#swIncRows .inc-row').length;
  // Нэг уртыг дахин нэмэхэд шинэ мөр гарахгүй, ХУРААГДАНА
  _incL=3;_incN=2;_incAdd();await new Promise(r=>setTimeout(r,90));
  const n3=document.querySelectorAll('#swIncRows .inc-row').length;
  const sum3=(_incRows.find(r=>+r.L===3)||{}).n;
  _incDel(_incRows.findIndex(r=>+r.L===3));await new Promise(r=>setTimeout(r,60));
  _incL=3;_incN=10;_incAdd();await new Promise(r=>setTimeout(r,60));
  const sumN=document.getElementById('swIncSumN').textContent;
  const sumM=document.getElementById('swIncSumM').textContent;
  saveSwInc();await new Promise(r=>setTimeout(r,250));
  return{empty,n0,n1,n2,n3,sum3,lw,nw,inp,sumN,sumM,
    open:document.getElementById('swIncAddModal').classList.contains('open'),
    by:swIncBy(),st:swStock(),n:swInc().length}});
ok('Эхэндээ орлого хоосон',/Орлого бүртгээгүй/.test(inc.empty),inc.empty.slice(0,30));
ok('Эхлээд жагсаалт хоосон',inc.n0===0,String(inc.n0));
ok('Урт ба ширхэг нь хүрдтэй',
   inc.lw.length===11&&/^3 м$/.test(inc.lw[0])&&/^5,5 м$/.test(inc.lw[10])&&inc.nw===200,
   `${inc.lw.length} урт · ${inc.nw} ширхэг`);
ok('Гараар бичих талбар үлдээгүй',inc.inp===0,String(inc.inp));
ok('Нэмэх бүрд жагсаалтад мөр нэмэгдэнэ',
   inc.n1===1&&inc.n2===2,`${inc.n0} → ${inc.n1} → ${inc.n2}`);
ok('Нэг уртыг дахин нэмэхэд хураагдана',
   inc.n3===2&&inc.sum3===12,`${inc.n3} мөр · 3 м → ${inc.sum3} ш`);
ok('Нийт ш ба нийт пог/м авто бодогдоно (10×3 + 4×3,25 = 43)',
   inc.sumN==='14 ш'&&/^43 пог\/м$/.test(inc.sumM),`${inc.sumN} · ${inc.sumM}`);
ok('Орлого хадгалагдаж, цонх хаагдана',inc.n===1&&!inc.open,inc.n+' баримт');
ok('Урт тус бүрийн орлого',
   inc.by['3']===10&&inc.by['3.25']===4,JSON.stringify(inc.by));
ok('Солилт хийгээгүй тул үлдэгдэл = орлого',
   inc.st['3']===10&&inc.st['3.25']===4,JSON.stringify(inc.st));

/* "Нэмэх" дарахаа мартсан ч хүрдэн дээрх сонголт нь алдагдахгүй */
const bad0=await page.evaluate(async()=>{
  openSwIncAdd();await new Promise(r=>setTimeout(r,220));
  _incL=5.5;_incN=2;
  saveSwInc();await new Promise(r=>setTimeout(r,220));
  const o={n:swInc().length,st:swStock(),
    open:document.getElementById('swIncAddModal').classList.contains('open')};
  // Тестийн цаашдын тооцоог эвдэхгүйн тулд буцааж устгана
  const f=swFolder();f.inc=f.inc.filter(r=>r.items.every(i=>+i.L!==5.5));saveDB();
  closeModal('swIncAddModal');return o});
ok('Нэмэх дараагүй ч хүрдний сонголт орлогод орно',
   bad0.n===2&&!bad0.open&&bad0.st['5.5']===2,`${bad0.n} баримт · ${JSON.stringify(bad0.st)}`);

/* ── 2. Солилт — агуулахаас сонгож, үлдэгдэл буурна ── */
console.log('\nСолилт ↔ агуулах');
const rep=await page.evaluate(async()=>{
  swTurnoutId='w1';showView('swRecView');renderSwRec();
  await new Promise(r=>setTimeout(r,300));
  openSwDz(2);await new Promise(r=>setTimeout(r,180));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const items=[...document.querySelectorAll('#swWhL .wh-item')].map(e=>e.textContent);
  saveSwDzRepl();await new Promise(r=>setTimeout(r,300));
  return{items,st:swStock(),out:swOutBy()}});
ok('Сольсон уртыг АГУУЛАХАД байгаагаас л сонгоно',
   rep.items.length===2,JSON.stringify(rep.items));
ok('Урт бүрийн ард ҮЛДЭГДЭЛ харагдана',
   /^3 · 10ш$/.test(rep.items[0])&&/^3,25 · 4ш$/.test(rep.items[1]),
   JSON.stringify(rep.items));
ok('Солилт хийхэд агуулахын үлдэгдэл буурна',
   rep.st['3']===9&&rep.st['3.25']===4,JSON.stringify(rep.st));
ok('Зарлага солилтоос автоматаар гарна',rep.out['3']===1,JSON.stringify(rep.out));

/* Өөр урт сонгоход тэр нь зарлагадана */
const rep2=await page.evaluate(async()=>{
  openSwDz(3);await new Promise(r=>setTimeout(r,180));
  openSwDzRepl();await new Promise(r=>setTimeout(r,300));
  const l=_swDzLens();
  _swDzL=3.25;saveSwDzRepl();await new Promise(r=>setTimeout(r,280));
  return{l,st:swStock(),out:swOutBy()}});
ok('3,25 м-ээр сольвол тэр нь зарлагадана',
   rep2.out['3.25']===1&&rep2.st['3.25']===3,
   JSON.stringify(rep2.out)+' · '+JSON.stringify(rep2.st));

/* Тэмдэглэгээг арилгахад агуулахад БУЦАЖ ОРНО */
const back=await page.evaluate(async()=>{
  openSwDz(3);await new Promise(r=>setTimeout(r,180));
  openSwDzRepl();await new Promise(r=>setTimeout(r,280));
  clearSwDzRepl();await new Promise(r=>setTimeout(r,280));
  return{st:swStock(),out:swOutBy()}});
ok('Солилтыг арилгахад дүнз агуулахад буцна',
   back.st['3.25']===4&&!back.out['3.25'],
   JSON.stringify(back.st)+' · '+JSON.stringify(back.out));

/* ── 3. Зарлагын цонх ── */
console.log('\nЗарлага');
const out=await page.evaluate(async()=>{
  openSwOut();await new Promise(r=>setTimeout(r,260));
  const rows=[...document.querySelectorAll('#swOutBody .out-tr')]
    .map(e=>[...e.children].map(c=>c.textContent.trim()));
  const tot=(document.querySelector('#swOutBody .rp-total')||{}).textContent||'';
  closeModal('swOutModal');
  return{rows,tot,pct:swTally(swAllTurnouts()[0]).pct}});
ok('Зарлагын толгой: сум, пог/м, ш, нийт пог/м, тэнцэхгүй',
   out.rows[0]&&/Сум/.test(out.rows[0][0])&&/пог\/м/.test(out.rows[0][1])
   &&/ш/.test(out.rows[0][2])&&/Тэнцэхгүй/.test(out.rows[0][4]),
   JSON.stringify(out.rows[0]));
ok('Мөрөнд сум №, урт, ширхэг, нийт пог/м',
   out.rows[1]&&/Сум 1/.test(out.rows[1][0])&&/^3 м$/.test(out.rows[1][1])
   &&/^1 ш$/.test(out.rows[1][2])&&/^3 пог\/м$/.test(out.rows[1][3]),
   JSON.stringify(out.rows[1]));
ok('Сумын ОДООГИЙН тэнцэхгүй хувь харагдана',
   out.rows[1]&&out.rows[1][4]===out.pct.toFixed(1)+'%',
   `${out.rows[1]&&out.rows[1][4]} / ${out.pct.toFixed(1)}%`);
ok('Нийт зарлага гарна',/1 ш/.test(out.tot)&&/3 пог\/м/.test(out.tot),out.tot);

/* ── 4. Паспортын картууд ── */
const cards=await page.evaluate(async()=>{
  goSwHome();await new Promise(r=>setTimeout(r,320));
  // v138: агуулах нь паспортын хавтаснуудаас гарч тусдаа хэсэг болсон
  return[...document.querySelectorAll('#swIncWrap .folder-card')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+
            e.querySelector('.folder-meta').textContent.trim())});
// v141: төлөвлөгөөний хавтас ч паспортоос гарч, агуулахын доор орсон
ok('Дүнзний агуулахын хэсэгт Орлого, Зарлага, Төлөвлөсөн карт байна',
   cards.length===3&&/^Орлого\|/.test(cards[0])&&/^Зарлага\|/.test(cards[1])
   &&/^Төлөвлөсөн дүнз\|/.test(cards[2]),JSON.stringify(cards));
ok('Орлогын карт дүнгээ харуулна',
   cards.some(x=>/^Орлого\|14 ш · 43 пог\/м$/.test(x)),
   JSON.stringify(cards.filter(x=>/Орлого/.test(x))));

/* ── 5. Орлого устгах ── */
const del=await page.evaluate(async()=>{
  openSwInc();await new Promise(r=>setTimeout(r,250));
  const id=swInc()[0].id;
  await delSwInc(id);await new Promise(r=>setTimeout(r,280));
  const o={n:swInc().length,st:swStock()};
  closeModal('swIncModal');return o});
ok('Орлого устгахад агуулах хоосорно',del.n===0,`${del.n} баримт`);
ok('Устгасны дараа зөвхөн зарлага үлдэнэ (сөрөг үлдэгдэл харагдана)',
   del.st['3']===-1,JSON.stringify(del.st));

/* ── Үлдэгдэлгүй уртыг СОНГУУЛАХГҮЙ ── */
console.log('\nҮлдэгдэлгүй урт');
const zero=await page.evaluate(async()=>{
  // Зөвхөн 3,5 м ганц ширхэг байхаар агуулахыг цэвэрхэн тавина
  const f=swFolder();
  (f.turnouts||[]).forEach(t=>{t.dRepl={}});
  f.inc=[{id:'i-z',d:'2026-05-01',items:[{L:3.5,n:1}]}];saveDB();
  swTurnoutId='w3';showView('swRecView');renderSwRec();
  await new Promise(r=>setTimeout(r,280));
  openSwDz(2);await new Promise(r=>setTimeout(r,170));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const first=[...document.querySelectorAll('#swWhL .wh-item')].map(e=>e.textContent);
  const pick1=_swDzL;
  saveSwDzRepl();await new Promise(r=>setTimeout(r,280));   // ганц 3,5 нь дуусна
  openSwDz(3);await new Promise(r=>setTimeout(r,170));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const opened=document.getElementById('swDzReplModal').classList.contains('open');
  // Хүчээр байхгүй уртыг тавиад хадгалахыг оролдоно
  _swDzIdx=3;_swDzL=3.5;saveSwDzRepl();await new Promise(r=>setTimeout(r,240));
  const t=swTurnout(),has3=!!(t.dRepl&&t.dRepl[3]);
  closeModal('swDzReplModal');closeModal('swDzModal');
  // Засварлахад ӨӨРИЙНХ нь урт жагсаалтаас алга болохгүй
  openSwDz(2);await new Promise(r=>setTimeout(r,170));
  openSwDzRepl();await new Promise(r=>setTimeout(r,320));
  const edit=[...document.querySelectorAll('#swWhL .wh-item')].map(e=>e.textContent);
  closeModal('swDzReplModal');closeModal('swDzModal');
  return{first,pick1,opened,has3,edit,st:swStock()}});
ok('Агуулахад байгаа ганц урт л хүрдэнд гарна',
   zero.first.length===1&&/^3,5 · 1ш$/.test(zero.first[0]),JSON.stringify(zero.first));
ok('Анхдагч сонголт нь агуулахад БАЙГАА урт',zero.pick1===3.5,String(zero.pick1));
ok('Үлдэгдэл дуусахад сольсон мэдээллийн цонх нээгдэхгүй',!zero.opened,String(zero.opened));
ok('Байхгүй дүнзээр сольсон бүртгэл ҮҮСЭХГҮЙ',!zero.has3,String(zero.has3));
ok('Засварлахад өөрийнх нь урт жагсаалтаас алга болохгүй',
   zero.edit.length===1&&/^3,5 · 1ш$/.test(zero.edit[0]),JSON.stringify(zero.edit));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
