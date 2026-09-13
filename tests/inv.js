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
  _incSet(0,'L','3');_incSet(0,'n','10');await new Promise(r=>setTimeout(r,90));
  const n1=document.querySelectorAll('#swIncRows .inc-row').length;
  _incSet(1,'L','3.25');_incSet(1,'n','4');await new Promise(r=>setTimeout(r,90));
  const n2=document.querySelectorAll('#swIncRows .inc-row').length;
  // Аль хэдийн сонгосон уртыг дахин санал болгохгүй
  const dis=[...document.querySelectorAll('#swIncRows .inc-row:last-child option')]
    .filter(o=>o.disabled).map(o=>o.value);
  const sumN=document.getElementById('swIncSumN').textContent;
  const sumM=document.getElementById('swIncSumM').textContent;
  saveSwInc();await new Promise(r=>setTimeout(r,250));
  return{empty,n0,n1,n2,dis,sumN,sumM,open:document.getElementById('swIncAddModal').classList.contains('open'),
    by:swIncBy(),st:swStock(),n:swInc().length}});
ok('Эхэндээ орлого хоосон',/Орлого бүртгээгүй/.test(inc.empty),inc.empty.slice(0,30));
ok('Эхлээд нэг мөр',inc.n0===1,String(inc.n0));
ok('Урт+ширхэг бөглөхөд ДООР нь шинэ мөр өөрөө нэмэгдэнэ',
   inc.n1===2&&inc.n2===3,`${inc.n0} → ${inc.n1} → ${inc.n2}`);
ok('Сонгосон уртыг дахин санал болгохгүй',
   inc.dis.indexOf('3')>=0&&inc.dis.indexOf('3.25')>=0,JSON.stringify(inc.dis));
ok('Нийт ш ба нийт пог/м авто бодогдоно (10×3 + 4×3,25 = 43)',
   inc.sumN==='14 ш'&&/^43 пог\/м$/.test(inc.sumM),`${inc.sumN} · ${inc.sumM}`);
ok('Орлого хадгалагдаж, цонх хаагдана',inc.n===1&&!inc.open,inc.n+' баримт');
ok('Урт тус бүрийн орлого',
   inc.by['3']===10&&inc.by['3.25']===4,JSON.stringify(inc.by));
ok('Солилт хийгээгүй тул үлдэгдэл = орлого',
   inc.st['3']===10&&inc.st['3.25']===4,JSON.stringify(inc.st));

/* Хоосон мөрөөр хадгалахгүй */
const bad0=await page.evaluate(async()=>{
  openSwIncAdd();await new Promise(r=>setTimeout(r,220));
  saveSwInc();await new Promise(r=>setTimeout(r,200));
  const o={n:swInc().length,open:document.getElementById('swIncAddModal').classList.contains('open')};
  closeModal('swIncAddModal');return o});
ok('Хоосон орлого хадгалагдахгүй',bad0.n===1&&bad0.open,`${bad0.n} баримт`);

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
  return[...document.querySelectorAll('#swFolderWrap .folder-card')]
    .map(e=>e.querySelector('.folder-name').textContent.trim()+'|'+
            e.querySelector('.folder-meta').textContent.trim())});
ok('Сумын паспортад Орлого, Зарлага карт нэмэгдэв',
   cards.some(x=>/^Орлого\|/.test(x))&&cards.some(x=>/^Зарлага\|/.test(x)),
   JSON.stringify(cards));
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

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
