/* ══════════════════════════════════════════════════════════════
   ПУ-5 ДЭВТЭР — апп доторх маягт (pu5View)

   · Доод таб: Сумууд ба Мэдэгдэл хооронд «ПУ-5 дэвтэр»
   · Анхдагч — СҮҮЛИЙН дэрийн паспорт, Дэр маягт; гол зам орохгүй
   · Зам бүр 10 үеэр доош цувна; тэмдэглэгээ Excel-ийн ПУ-5 дэвтэртэй
     ижил (эх төлөв, дараалсан шар, үе дамнасан ягаан хүрээ, сольсон
     он/сар + С/У, төлөвлөсөн «?»)
   · Жижиг сум товч → паспортын жагсаалт, гулсуулж тааруулсан
     паспортоор маягт бөглөгдөнө
   · Дүнз: сум бүр уртаар бүлэглэсэн маягт, доор нь Д/Д, пог/м
   · Доош гүйлгэхэд толгой, доод таб нуугдана; хурдан 2 товшвол гарна
   · Зөвхөн харах дэлгэц — өгөгдлийг өөрчлөхгүй
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),{seedP5}=require('./p5seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');
await seedP5(page);
const before=await page.evaluate(()=>JSON.stringify(_packDB(DB)));

/* ── 1. Таб ба анхдагч төлөв ── */
await page.click('#tabP5');await page.waitForTimeout(450);
let s=await page.evaluate(()=>{_p5Flush();return {
  view:(document.querySelector('.view.active')||{}).id,
  cur:document.getElementById('tabP5').getAttribute('aria-current'),
  der:document.getElementById('p5TabDer').getAttribute('aria-pressed'),
  sw:document.getElementById('p5TabSw').getAttribute('aria-pressed'),
  name:document.getElementById('p5PickName').textContent,
  trk:[...document.querySelectorAll('#p5Body .p5-trk')].map(e=>e.textContent),
  caps:[...document.querySelectorAll('#p5Body .p5-cap')].map(e=>e.textContent)}});
ok('ПУ-5 дэвтэр таб дарахад pu5View нээгдэнэ',s.view==='pu5View'&&s.cur==='true',JSON.stringify([s.view,s.cur]));
ok('Анхдагч нь Дэр маягт',s.der==='true'&&s.sw==='false');
ok('Анхдагч нь СҮҮЛИЙН паспорт (намар)',/^Намар паспорт/.test(s.name),s.name);
ok('Зам дугаараар эрэмбэлэгдэж, гол зам орохгүй',JSON.stringify(s.trk)==='["2-р зам","3-р зам"]',JSON.stringify(s.trk));
ok('2-р зам: 12 үе → 1–10, 11–12 гэсэн хоёр блок, дараа нь холбох хэсэг',
   JSON.stringify(s.caps.slice(0,3))===JSON.stringify(['2-р зам · 1–10-р үе','2-р зам · 11–12-р үе','2-р зам · Холбох хэсэг']),JSON.stringify(s.caps));

/* ── 2. Тэмдэглэгээ эх төлөвтэй ижил ── */
const m=await page.evaluate(()=>{
  const f=DB.folders.find(x=>x.id==='FNEW'),t=f.tracks.find(x=>x.id==='TN2');
  const os=origSections(t).filter(x=>!isTurnout(x));
  const expBad=os.reduce((a,x)=>a+analyzeSection(x).totalBad,0);
  const expRun=os.filter(x=>x.type!=='connecting').reduce((a,x)=>a+findConsecutiveBad(x).reduce((b,g)=>b+g.items.length,0),0);
  const blks=[...document.querySelectorAll('#p5Body .p5-blk')].slice(0,3);
  const q=sel=>blks.reduce((a,b)=>a+b.querySelectorAll(sel).length,0);
  const cell=(bi,row,col)=>{const tr=blks[bi].querySelectorAll('tbody tr')[row-1];return tr?tr.children[col].textContent:''};
  const sum=blks[0].querySelector('tr.p5-sum').children[1].textContent;
  return {expBad,expRun,bad:q('td.b,td.tt'),tbd:q('td.t'),hi:q('td.hi'),cr:q('td.cr'),
    r17:cell(0,7,1),r21:cell(0,1,2),r211:cell(0,11,2),r23:cell(0,3,2),sum,
    tot:blks[0].querySelector('.p5-tot').textContent}});
ok('Тэнцэхгүй тэмдэг (— ба ТТБД) эх төлөвийн тоотой ижил',m.bad===m.expBad,m.bad+' / '+m.expBad);
ok('ТБД тэмдэглэгдсэн',m.tbd===1,m.tbd);
ok('Дараалсан (3+) дэр шараар — findConsecutiveBad-тэй ижил',m.hi===m.expRun,m.hi+' / '+m.expRun);
ok('Үе дамнасан дараалал ягаан хүрээтэй (3-р үеийн сүүл 2 + 4-р үеийн эх 1)',m.cr===3,m.cr);
ok('Сийрэгжүүлж сольсон дэр: дээр 26/9, доор С',/^26\/9—С$/.test(m.r17),JSON.stringify(m.r17));
ok('Бусад шалтгаанаар сольсон дэр: дээр 26/10, доор У',/^26\/10—У$/.test(m.r21),JSON.stringify(m.r21));
ok('Солихоор төлөвлөсөн дэр: дээр "?"',m.r211==='?—',JSON.stringify(m.r211));
ok('ТТБД тэмдэглэгдсэн',m.r23==='ТТБД',JSON.stringify(m.r23));
ok('Дүн мөр: 1-р үе 3/20, дараалсан цэг 1',m.sum==='3/20дар: 1',JSON.stringify(m.sum));
ok('Блокийн нийт мөр',/^1–10-р үеийн нийт тэнцэхгүй: \d+\/200 \(\d+\.\d%\)$/.test(m.tot),m.tot);

/* ── 3. Паспорт сонгогч ── */
const pk=await page.evaluate(async()=>{
  p5TogglePick();await new Promise(r=>setTimeout(r,150));
  const items=[...document.querySelectorAll('#p5PickList .p5-pick-it')].map(e=>e.textContent);
  const open=document.getElementById('p5Pick').classList.contains('open');
  const L=document.getElementById('p5PickList');L.scrollTop=44;
  await new Promise(r=>setTimeout(r,450));
  _p5Flush();
  return {items,open,name:document.getElementById('p5PickName').textContent,
    on:(document.querySelector('#p5PickList .p5-pick-it.on')||{}).textContent,
    blks:document.querySelectorAll('#p5Body .p5-blk').length,
    bad:document.querySelectorAll('#p5Body td.b').length}});
ok('Сум товч дарахад паспортын жагсаалт нээгдэнэ, шинээс хуучин руу',
   pk.open&&pk.items.length===2&&/^Намар/.test(pk.items[0])&&/^Хавар/.test(pk.items[1]),JSON.stringify(pk.items));
ok('Гулсуулж тааруулсан паспортоор (хавар) маягт бөглөгдөнө',/^Хавар паспорт/.test(pk.name)&&/^Хавар/.test(pk.on),pk.name);
ok('Хаврын паспортын бүртгэл: 1 блок, 4 тэнцэхгүй',pk.blks===1&&pk.bad===4,JSON.stringify([pk.blks,pk.bad]));
const closed=await page.evaluate(()=>{p5PickTap(1);return document.getElementById('p5Pick').classList.contains('open')});
ok('Таарсан мөрийг дахин товшиход жагсаалт хаагдана',closed===false);

/* ── 4. Дүнз ── */
const sw=await page.evaluate(()=>{
  p5SetMode('sw');_p5Flush();
  const blks=[...document.querySelectorAll('#p5Body .p5-blk')];
  const b0=blks[0];
  const to=DB.sw.find(f=>f.id==='SWNEW').turnouts.find(t=>t.id==='W1');
  const orig=swFullOrigIt(to),expBad=[...orig].filter(isBadCh).length;
  const rows=[...b0.querySelectorAll('tr.p5-sum')].map(r=>[r.children[0].textContent,r.lastElementChild.textContent]);
  const lens=swSpec(to.mak,to.mark).sch.reduce((a,[l,n])=>a+l*n,0);
  return {pressed:document.getElementById('p5TabSw').getAttribute('aria-pressed'),
    name:document.getElementById('p5PickName').textContent,
    trk:blks.map(b=>b.querySelector('.p5-trk').textContent),
    bad:b0.querySelectorAll('td.b').length,expBad,hi:b0.querySelectorAll('td.hi').length,
    repl:[...b0.querySelectorAll('td.b')].map(td=>td.textContent).filter(t=>/26\/10/.test(t)),
    plan:[...b0.querySelectorAll('td.b')].some(td=>td.textContent==='?—'),
    rows,expM:swM(lens)}});
ok('Дүнз цонх идэвхжинэ, сүүлийн сумын паспорт',sw.pressed==='true'&&/^Намар сум/.test(sw.name),sw.name);
ok('Сум бүр тусдаа маягт (8-р, 9-р сум)',JSON.stringify(sw.trk)==='["8-р сум · Р-65 1/11","9-р сум · Р-65 1/9"]',JSON.stringify(sw.trk));
ok('8-р сум: тэнцэхгүй тэмдэг эх төлөвтэй ижил',sw.bad===sw.expBad,sw.bad+' / '+sw.expBad);
ok('8-р сум: дараалсан 3 дүнз шараар',sw.hi===3,sw.hi);
ok('Сольсон дүнз: дээр 26/10, доор С (дараалсан)',sw.repl.length===1&&sw.repl[0]==='26/10—С',JSON.stringify(sw.repl));
ok('Солихоор төлөвлөсөн дүнз "?"',sw.plan);
ok('Доод мөрүүд Д/Д, Пог/м, Тэнц. ш, Тэнц. пог/м',
   JSON.stringify(sw.rows.map(r=>r[0]))==='["Д/Д","Пог/м","Тэнц. ш","Тэнц. пог/м"]',JSON.stringify(sw.rows));
ok('НИЙТ пог/м сумын хуваарийн нийлбэртэй ижил',sw.rows[1]&&sw.rows[1][1]===sw.expM,JSON.stringify([sw.rows[1],sw.expM]));
const back=await page.evaluate(()=>{p5SetMode('der');return document.getElementById('p5PickName').textContent});
ok('Дэр рүү буцахад өмнө сонгосон (хаврын) паспорт хэвээр',/^Хавар паспорт/.test(back),back);

/* ── 5. Гүйлгэхэд нуугдах, хурдан 2 товшиж гаргах ── */
await page.evaluate(()=>{_p5Fid.der=null;renderPu5();_p5Flush()});
const im=await page.evaluate(async()=>{
  const sc=document.getElementById('p5Scroll'),bar=document.getElementById('tabbar'),hd=document.getElementById('p5Hdr');
  sc.scrollTop=0;await new Promise(r=>setTimeout(r,80));
  sc.scrollTop=400;await new Promise(r=>setTimeout(r,420));
  const o={imm:document.body.classList.contains('p5-imm'),bar:getComputedStyle(bar).transform,
    hd:hd.getBoundingClientRect().bottom};
  const tap=(x,y)=>{const t=new Touch({identifier:1,target:sc,clientX:x,clientY:y});
    sc.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],bubbles:true}));
    sc.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],bubbles:true}))};
  tap(180,400);await new Promise(r=>setTimeout(r,60));
  o.afterOne=document.body.classList.contains('p5-imm');
  tap(182,402);await new Promise(r=>setTimeout(r,320));
  o.afterTwo=document.body.classList.contains('p5-imm');o.bar2=getComputedStyle(bar).transform;
  return o});
ok('Доош гүйлгэхэд толгой ба доод таб нуугдана',im.imm&&im.bar!=='none'&&im.hd<=1,JSON.stringify(im));
ok('Нэг товшилт нуусан хэвээр үлдээнэ',im.afterOne===true);
ok('Хурдан 2 товшвол толгой, доод таб буцаж гарна',im.afterTwo===false&&(im.bar2==='none'||/, 0\)$/.test(im.bar2)),JSON.stringify([im.afterTwo,im.bar2]));
const top=await page.evaluate(async()=>{
  const sc=document.getElementById('p5Scroll');sc.scrollTop=0;await new Promise(r=>setTimeout(r,60));
  sc.scrollTop=500;await new Promise(r=>setTimeout(r,200));
  const was=document.body.classList.contains('p5-imm');
  sc.scrollTop=0;await new Promise(r=>setTimeout(r,200));
  return {was,now:document.body.classList.contains('p5-imm')}});
ok('Хамгийн дээр буцаж гүйлгэхэд толгой өөрөө гарна (хоосон зай үлдэхгүй)',top.was&&!top.now,JSON.stringify(top));
const leave=await page.evaluate(async()=>{
  const sc=document.getElementById('p5Scroll');sc.scrollTop=0;await new Promise(r=>setTimeout(r,60));
  sc.scrollTop=500;await new Promise(r=>setTimeout(r,200));
  const was=document.body.classList.contains('p5-imm');
  goTab('home');await new Promise(r=>setTimeout(r,300));
  return {was,now:document.body.classList.contains('p5-imm')}});
ok('ПУ-5-аас гарахад доод таб буцаж гарна',leave.was&&!leave.now,JSON.stringify(leave));

/* ── 6. Буцах товч ── */
const bk=await page.evaluate(async()=>{
  openPu5();p5TogglePick();
  const a=_appBack(),openAfter=document.getElementById('p5Pick').classList.contains('open');
  const b=_appBack();await new Promise(r=>setTimeout(r,300));
  return {a,openAfter,b,view:(document.querySelector('.view.active')||{}).id}});
ok('Буцах: эхлээд паспортын жагсаалт хаагдана, дараа нь Нүүр',
   bk.a&&!bk.openAfter&&bk.b&&bk.view==='homeView',JSON.stringify(bk));

/* ── 7. Хоосон төлөв ба өгөгдөл хөндөгдөөгүй ── */
const after=await page.evaluate(()=>JSON.stringify(_packDB(DB)));
ok('Зөвхөн харах дэлгэц — бүртгэл огт өөрчлөгдөөгүй',after===before);
const em=await page.evaluate(()=>{
  const keep=DB.sw;DB.sw=[];openPu5();p5SetMode('sw');
  const t=document.getElementById('p5Body').textContent;
  DB.sw=keep;p5SetMode('der');return t});
ok('Сумын паспортгүй үед хоосон төлөв',/Сумын паспорт алга/.test(em),em);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
