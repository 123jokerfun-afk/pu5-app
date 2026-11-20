/* ══════════════════════════════════════════════════════════════
   ПУ-5 ДЭВТЭР — апп доторх маягт (pu5View)

   · Доод таб: Сумууд ба Мэдэгдэл хооронд «ПУ-5»
   · Анхдагч — СҮҮЛИЙН дэрийн паспорт, Дэр маягт; гол зам орохгүй
   · Дээр нь зам (сум) бүрийн товч; нэг удаад нэг хуудас (10 үе / нэг
     сум); дэр дууссан хэсэг улаан хүрээтэй; тэмдэглэгээ Excel-ийн ПУ-5 дэвтэртэй
     ижил (эх төлөв, дараалсан шар, үе дамнасан ягаан хүрээ, сольсон
     он/сар + С/У, төлөвлөсөн «?»)
   · Жижиг сум товч → паспортын жагсаалт, гулсуулж тааруулсан
     паспортоор маягт бөглөгдөнө
   · Дүнз: сум бүр уртаар бүлэглэсэн маягт, доор нь Д/Д, пог/м
   · Гүйлгэхэд замын товч, «Дэр № | үе» мөр дээр тулж үлдэнэ
   · Хурдан 2 товшилт «зөвхөн маягт» горимыг асаана/унтраана; энэ
     горимд хажуу тийш шудрахад хуудас солигдоно
   · Дэрийн/үеийн дугаар дарахад мөр/багана тодорно
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
let s=await page.evaluate(()=>{
  const chips=[...document.querySelectorAll('#p5Trks .p5-trk-c')];
  const o={view:(document.querySelector('.view.active')||{}).id,
    cur:document.getElementById('tabP5').getAttribute('aria-current'),
    der:document.getElementById('p5TabDer').getAttribute('aria-pressed'),
    sw:document.getElementById('p5TabSw').getAttribute('aria-pressed'),
    name:document.getElementById('p5PickName').textContent,
    trk:chips.map(e=>e.textContent),
    sel:chips.filter(e=>e.getAttribute('aria-selected')==='true').map(e=>e.textContent),
    blks:document.querySelectorAll('#p5Body .p5-blk').length,caps:[],selAt:[]};
  for(let i=0;i<_p5Cur.pages.length;i++){_p5Show(i,0);
    o.caps.push(document.querySelector('#p5Page .p5-cap').textContent);
    o.selAt.push((document.querySelector('#p5Trks [aria-selected="true"]')||{}).textContent)}
  _p5Show(0,0);return o});
ok('ПУ-5 таб дарахад pu5View нээгдэнэ',s.view==='pu5View'&&s.cur==='true',JSON.stringify([s.view,s.cur]));
ok('Анхдагч нь Дэр маягт',s.der==='true'&&s.sw==='false');
ok('Анхдагч нь СҮҮЛИЙН паспорт (намар)',/^Намар паспорт/.test(s.name),s.name);
ok('Дээр нь замын товчнууд — дугаараар, гол зам орохгүй',JSON.stringify(s.trk)==='["2-р зам","3-р зам"]',JSON.stringify(s.trk));
ok('Анхдагч нь эхний зам сонгогдсон',JSON.stringify(s.sel)==='["2-р зам"]',JSON.stringify(s.sel));
ok('Нэг удаад нэг хуудас (блок) зурагдана',s.blks===1,s.blks);
ok('2-р зам: 1–10, 11–12, холбох хэсэг гэсэн 3 хуудас, дараа нь 3-р зам',
   JSON.stringify(s.caps.slice(0,3))===JSON.stringify(['2-р зам · 1–10-р үе','2-р зам · 11–12-р үе','2-р зам · Холбох хэсэг'])&&/^3-р зам/.test(s.caps[3]||''),JSON.stringify(s.caps));
ok('Хуудас солигдоход замын товч дагаж сонгогдоно',s.selAt[2]==='2-р зам'&&s.selAt[3]==='3-р зам',JSON.stringify(s.selAt));
const tj=await page.evaluate(()=>{p5Trk(1);const a=_p5Pg.der;p5Trk(0);return [a,_p5Pg.der,document.querySelector('#p5Page .p5-cap').textContent]});
ok('Замын товч дарахад тэр замын эхний хуудас',tj[0]===3&&tj[1]===0&&tj[2]==='2-р зам · 1–10-р үе',JSON.stringify(tj));

/* ── 2. Тэмдэглэгээ эх төлөвтэй ижил ── */
const m=await page.evaluate(()=>{
  const f=DB.folders.find(x=>x.id==='FNEW'),t=f.tracks.find(x=>x.id==='TN2');
  const os=origSections(t).filter(x=>!isTurnout(x));
  const expBad=os.reduce((a,x)=>a+analyzeSection(x).totalBad,0);
  const expRun=os.filter(x=>x.type!=='connecting').reduce((a,x)=>a+findConsecutiveBad(x).reduce((b,g)=>b+g.items.length,0),0);
  const c={bad:0,tbd:0,hi:0,cr:0};
  for(let i=0;i<3;i++){_p5Show(i,0);const pg=document.getElementById('p5Page');
    c.bad+=pg.querySelectorAll('td.b,td.tt').length;c.tbd+=pg.querySelectorAll('td.t').length;
    c.hi+=pg.querySelectorAll('td.hi').length;c.cr+=pg.querySelectorAll('td.cr').length}
  _p5Show(0,0);
  const blk=document.querySelector('#p5Page .p5-blk');
  const cell=(row,col)=>{const tr=blk.querySelectorAll('tbody tr')[row-1];return tr?tr.children[col].textContent:''};
  return {expBad,expRun,...c,r17:cell(7,1),r21:cell(1,2),r211:cell(11,2),r23:cell(3,2),
    sum:blk.querySelector('tr.p5-sum').children[1].textContent,
    tot:blk.querySelector('.p5-tot').textContent,
    trk:(document.querySelector('#p5Page .p5-tot.trk')||{}).textContent,
    pgn:(document.querySelector('#p5Page .p5-pgn')||{}).textContent,
    nav:[...document.querySelectorAll('#p5Page .p5-nav')].map(b=>b.disabled)}});
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
ok('Замын нийт мөр хуудас бүрд',/^2-р зам нийт тэнцэхгүй дэр: \d+\/\d+/.test(m.trk||''),m.trk);
ok('Хуудасны дугаар 1/3, эхний хуудсанд «өмнөх» товч идэвхгүй',m.pgn==='1/3'&&m.nav[0]===true&&m.nav[1]===false,JSON.stringify([m.pgn,m.nav]));

/* ── 3. Үеийн эпюр — дэр дууссан хэсэг нэг улаан хүрээтэй нүд ── */
const ep=await page.evaluate(()=>{
  const r=[];
  for(let i=0;i<_p5Cur.pages.length;i++){_p5Show(i,0);
    const tb=document.querySelector('#p5Page .p5-tb'),L=tb.dataset.l.split(',').map(Number),mx=Math.max(...L);
    const xs=[...tb.querySelectorAll('td.x')];
    // Хүснэгт тэгш өнцөгт эсэх: мөр бүрд нүд + дээрээс үргэлжилсэн rowspan = үеийн тоо
    let rect=true;const left=new Array(L.length).fill(0);
    [...tb.tBodies[0].rows].filter(tr=>!tr.classList.contains('p5-sum')).forEach((tr,p)=>{
      const act=L.filter((l,j)=>l<p).length;
      if(tr.cells.length-1+act!==L.length)rect=false});
    r.push({L,exp:L.filter(l=>l<mx).length,got:xs.length,rs:xs.every(x=>L.includes(mx-x.rowSpan)),rect,
      ring:xs[0]?getComputedStyle(xs[0]).boxShadow:''})}
  _p5Show(0,0);return r});
const epx=ep.filter(e=>e.exp>0);
ok('Дэр дууссан үе бүрд нэг улаан хүрээтэй нүд (rowspan)',ep.every(e=>e.got===e.exp&&e.rs),JSON.stringify(ep.map(e=>[e.L.join(','),e.exp,e.got])));
ok('Эпюртэй хуудас байгаа (12-р үе 18 дэртэй)',epx.length>0&&/rgb/.test(epx[0].ring)&&/2px/.test(epx[0].ring),JSON.stringify(epx.map(e=>e.ring)));
ok('Хүснэгт тэгш (мөр бүрийн нүд + rowspan = үеийн тоо)',ep.every(e=>e.rect));

/* ── 4. Дэрийн дугаар / үеийн дугаар дарахад мөр, багана тодорно ── */
const hl=await page.evaluate(()=>{
  _p5Show(1,0); // 11–12-р үе: 12-р үе 18 дэртэй (эпюр)
  let tb=document.querySelector('#p5Page .p5-tb');const o={};
  tb.tBodies[0].rows[4].cells[0].click();
  o.row=[...tb.querySelectorAll('tr.hl')].map(tr=>tr.cells[0].textContent);
  tb.tHead.rows[0].cells[2].click();
  o.col=tb.querySelectorAll('.hc').length;o.colX=tb.querySelectorAll('td.x.hc').length;
  o.colTxt=[...tb.tBodies[0].querySelectorAll('tr:not(.p5-sum) td.hc')].length;
  tb.tHead.rows[0].cells[1].click();o.col1=tb.querySelectorAll('.hc').length;
  tb.tHead.rows[0].cells[1].click();o.col1off=tb.querySelectorAll('.hc').length;
  _p5Show(0,0);tb=document.querySelector('#p5Page .p5-tb');
  o.keep=[...tb.querySelectorAll('tr.hl')].map(tr=>tr.cells[0].textContent);
  tb.tBodies[0].rows[4].cells[0].click();o.off=tb.querySelectorAll('tr.hl').length;
  o.bg=(()=>{tb.tBodies[0].rows[2].cells[0].click();const c=tb.tBodies[0].rows[2].cells[1];const v=getComputedStyle(c).backgroundImage;tb.tBodies[0].rows[2].cells[0].click();return v})();
  return o});
ok('Дэрийн дугаар дарахад тэр мөр тодорно',JSON.stringify(hl.row)==='["5"]',JSON.stringify(hl.row));
ok('Үеийн дугаар дарахад тэр багана тодорно (эпюрийн хоосон хэсэг орохгүй)',hl.colTxt===18&&hl.col===20&&hl.colX===0,JSON.stringify(hl));
ok('Өөр үе дарахад багана шилжинэ, дахин дарахад арилна',hl.col1===22&&hl.col1off===0,JSON.stringify([hl.col1,hl.col1off]));
ok('Тодруулсан мөр хуудас солигдоход хэвээр, дахин дарахад арилна',JSON.stringify(hl.keep)==='["5"]'&&hl.off===0,JSON.stringify([hl.keep,hl.off]));
ok('Тодруулга өнгөт давхаргаар (суурь өнгө хэвээр)',/gradient/.test(hl.bg),hl.bg);

/* ── 5. Паспорт сонгогч ── */
const pk=await page.evaluate(async()=>{
  p5Page(1);
  p5TogglePick();await new Promise(r=>setTimeout(r,150));
  const items=[...document.querySelectorAll('#p5PickList .p5-pick-it')].map(e=>e.textContent);
  const open=document.getElementById('p5Pick').classList.contains('open');
  const L=document.getElementById('p5PickList');L.scrollTop=44;
  await new Promise(r=>setTimeout(r,450));
  return {items,open,name:document.getElementById('p5PickName').textContent,
    on:(document.querySelector('#p5PickList .p5-pick-it.on')||{}).textContent,
    pages:_p5Cur.pages.length,pg:_p5Pg.der,
    bad:document.querySelectorAll('#p5Body td.b').length}});
ok('Сум товч дарахад паспортын жагсаалт нээгдэнэ, шинээс хуучин руу',
   pk.open&&pk.items.length===2&&/^Намар/.test(pk.items[0])&&/^Хавар/.test(pk.items[1]),JSON.stringify(pk.items));
ok('Гулсуулж тааруулсан паспортоор (хавар) маягт бөглөгдөнө',/^Хавар паспорт/.test(pk.name)&&/^Хавар/.test(pk.on),pk.name);
ok('Хаврын паспорт: 1 хуудас, 4 тэнцэхгүй, эхний хуудаснаас эхэлнэ',pk.pages===1&&pk.bad===4&&pk.pg===0,JSON.stringify([pk.pages,pk.bad,pk.pg]));
const closed=await page.evaluate(()=>{p5PickTap(1);return document.getElementById('p5Pick').classList.contains('open')});
ok('Таарсан мөрийг дахин товшиход жагсаалт хаагдана',closed===false);

/* ── 6. Дүнз — дээр нь сумын дугаартай товч, сум бүр нэг хуудас ── */
const sw=await page.evaluate(()=>{
  p5SetMode('sw');
  const chips=[...document.querySelectorAll('#p5Trks .p5-trk-c')].map(e=>e.textContent);
  const b0=document.querySelector('#p5Page .p5-blk');
  const to=DB.sw.find(f=>f.id==='SWNEW').turnouts.find(t=>t.id==='W1');
  const orig=swFullOrigIt(to),expBad=[...orig].filter(isBadCh).length;
  const rows=[...b0.querySelectorAll('tr.p5-sum')].map(r=>[r.children[0].textContent,r.lastElementChild.textContent]);
  const lens=swSpec(to.mak,to.mark).sch.reduce((a,[l,n])=>a+l*n,0);
  const tb=b0.querySelector('.p5-tb'),L=tb.dataset.l.split(',').map(Number),mx=Math.max(...L);
  const o={pressed:document.getElementById('p5TabSw').getAttribute('aria-pressed'),
    name:document.getElementById('p5PickName').textContent,chips,
    t0:b0.querySelector('.p5-trk').textContent,
    bad:b0.querySelectorAll('td.b').length,expBad,hi:b0.querySelectorAll('td.hi').length,
    repl:[...b0.querySelectorAll('td.b')].map(td=>td.textContent).filter(t=>/26\/10/.test(t)),
    plan:[...b0.querySelectorAll('td.b')].some(td=>td.textContent==='?—'),
    rows,expM:swM(lens),x:tb.querySelectorAll('td.x').length,xExp:L.filter(l=>l<mx).length};
  p5Page(1);o.t1=document.querySelector('#p5Page .p5-trk').textContent;
  o.sel=(document.querySelector('#p5Trks [aria-selected="true"]')||{}).textContent;
  p5Trk(0);return o});
ok('Дүнз цонх идэвхжинэ, сүүлийн сумын паспорт',sw.pressed==='true'&&/^Намар сум/.test(sw.name),sw.name);
ok('Дээр нь сумын дугаартай товчнууд',JSON.stringify(sw.chips)==='["8-р сум","9-р сум"]',JSON.stringify(sw.chips));
ok('Сум бүр нэг хуудас, дараагийн хуудас 9-р сум (товч дагана)',sw.t0==='8-р сум · Р-65 1/11'&&sw.t1==='9-р сум · Р-65 1/9'&&sw.sel==='9-р сум',JSON.stringify([sw.t0,sw.t1,sw.sel]));
ok('8-р сум: тэнцэхгүй тэмдэг эх төлөвтэй ижил',sw.bad===sw.expBad,sw.bad+' / '+sw.expBad);
ok('8-р сум: дараалсан 3 дүнз шараар',sw.hi===3,sw.hi);
ok('Сольсон дүнз: дээр 26/10, доор С (дараалсан)',sw.repl.length===1&&sw.repl[0]==='26/10—С',JSON.stringify(sw.repl));
ok('Солихоор төлөвлөсөн дүнз "?"',sw.plan);
ok('Доод мөрүүд Д/Д, Пог/м, Тэнц. ш, Тэнц. пог/м',
   JSON.stringify(sw.rows.map(r=>r[0]))==='["Д/Д","Пог/м","Тэнц. ш","Тэнц. пог/м"]',JSON.stringify(sw.rows));
ok('НИЙТ пог/м сумын хуваарийн нийлбэртэй ижил',sw.rows[1]&&sw.rows[1][1]===sw.expM,JSON.stringify([sw.rows[1],sw.expM]));
ok('Дүнз дууссан урт бүрд улаан хүрээтэй нүд',sw.x===sw.xExp&&sw.x>0,JSON.stringify([sw.x,sw.xExp]));
const back=await page.evaluate(()=>{p5SetMode('der');return document.getElementById('p5PickName').textContent});
ok('Дэр рүү буцахад өмнө сонгосон (хаврын) паспорт хэвээр',/^Хавар паспорт/.test(back),back);

/* ── 7. Гүйлгэхэд замын товч тулж үлдэнэ, «Дэр № | үе» мөр наалддаг ── */
await page.evaluate(()=>{_p5Fid.der=null;renderPu5()});
const st=await page.evaluate(async()=>{
  const sc=document.getElementById('p5Scroll'),q=s=>document.querySelector(s).getBoundingClientRect();
  sc.scrollTop=0;await new Promise(r=>setTimeout(r,80));
  const t0=q('#p5Trks').top;
  sc.scrollTop=400;await new Promise(r=>setTimeout(r,150));
  const th=document.querySelector('#p5Page thead th'),cs=getComputedStyle(th);
  return {t0,t1:q('#p5Trks').top,top:q('#p5Top').bottom,up:document.getElementById('pu5View').classList.contains('p5-up'),
    imm:document.body.classList.contains('p5-imm'),pos:cs.position,thTop:parseFloat(cs.top),exp:_p5HT.H-_p5HT.T-1,
    bar:getComputedStyle(document.getElementById('tabbar')).transform}});
ok('Доош гүйлгэхэд замын товч тааз руу тулж үлдэнэ',st.t0>60&&st.t1>=0&&st.t1<40,JSON.stringify(st));
ok('Дэр/Дүнз, паспортын хэсэг дээш гарч бүдгэрнэ',st.top<=st.t1+1&&st.up,JSON.stringify([st.top,st.up]));
ok('«Дэр № | үе» мөр замын товчны доор наалдана (sticky)',st.pos==='sticky'&&Math.abs(st.thTop-st.exp)<1,JSON.stringify([st.pos,st.thTop,st.exp]));
ok('Гүйлгэлтээр маягт горим өөрөө асахгүй, доод таб хэвээр',!st.imm&&(st.bar==='none'||/, 0\)$/.test(st.bar)),JSON.stringify([st.imm,st.bar]));

/* ── 8. Хурдан 2 товшилт — «зөвхөн маягт» горим асна / унтарна ── */
const im=await page.evaluate(async()=>{
  const sc=document.getElementById('p5Scroll'),bar=document.getElementById('tabbar');
  const tgt=document.querySelector('#p5Page tbody tr:nth-child(6) td:nth-child(4)');
  const tap=(x,y)=>{const t=new Touch({identifier:1,target:tgt,clientX:x,clientY:y});
    tgt.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],bubbles:true}));
    tgt.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],bubbles:true}))};
  const imm=()=>document.body.classList.contains('p5-imm');
  const o={};
  tap(180,400);await new Promise(r=>setTimeout(r,60));o.one=imm();
  tap(182,402);await new Promise(r=>setTimeout(r,350));
  o.on=imm();o.bar=getComputedStyle(bar).transform;o.topDisp=getComputedStyle(document.getElementById('p5Top')).display;
  o.trk=document.getElementById('p5Trks').getBoundingClientRect().top;
  sc.scrollTop=0;await new Promise(r=>setTimeout(r,120));o.stillOn=imm();
  // Шудралт: хуруу зүүн тийш → дараагийн хуудас (таб солигдохгүй)
  const sw=(x0,x1,el)=>{const a=new Touch({identifier:2,target:el,clientX:x0,clientY:420}),b=new Touch({identifier:2,target:el,clientX:x1,clientY:424});
    el.dispatchEvent(new TouchEvent('touchstart',{touches:[a],changedTouches:[a],bubbles:true}));
    el.dispatchEvent(new TouchEvent('touchmove',{touches:[b],changedTouches:[b],bubbles:true}));
    el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[b],bubbles:true}))};
  const p0=_p5Pg.der;sw(320,140,document.querySelector('#p5Page td'));await new Promise(r=>setTimeout(r,200));
  o.pgNext=_p5Pg.der-p0;o.view=(document.querySelector('.view.active')||{}).id;
  sw(120,320,document.querySelector('#p5Page td'));await new Promise(r=>setTimeout(r,200));o.pgBack=_p5Pg.der-p0;
  sw(320,140,document.querySelector('#p5Trks .p5-trk-c'));await new Promise(r=>setTimeout(r,200));o.pgChip=_p5Pg.der-p0;
  const tgt2=document.querySelector('#p5Page tbody tr:nth-child(6) td:nth-child(4)');
  const tap2=(x,y)=>{const t=new Touch({identifier:3,target:tgt2,clientX:x,clientY:y});
    tgt2.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],bubbles:true}));
    tgt2.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],bubbles:true}))};
  await new Promise(r=>setTimeout(r,400));
  tap2(180,400);await new Promise(r=>setTimeout(r,60));tap2(181,401);await new Promise(r=>setTimeout(r,350));
  o.off=imm();o.bar2=getComputedStyle(bar).transform;
  // Дугаар дээр 2 товшвол горим солигдохгүй (тодруулах үүрэгтэй)
  const n=document.querySelector('#p5Page tbody td.p5-n');
  const tap3=()=>{const t=new Touch({identifier:4,target:n,clientX:20,clientY:300});
    n.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],bubbles:true}));
    n.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],bubbles:true}))};
  tap3();await new Promise(r=>setTimeout(r,60));tap3();await new Promise(r=>setTimeout(r,350));o.numTap=imm();
  return o});
ok('Нэг товшилт горим солихгүй',im.one===false);
ok('Хурдан 2 товшвол маягт горим асна: доод таб, Дэр/Дүнз нуугдана',im.on&&im.bar!=='none'&&!/, 0\)$/.test(im.bar)&&im.topDisp==='none',JSON.stringify(im));
ok('Маягт горимд замын товч дээр тулж харагдана',im.trk>=0&&im.trk<40,im.trk);
ok('Дээш гүйлгэхэд маягт горим өөрөө унтрахгүй',im.stillOn===true);
ok('Маягт горимд зүүн тийш шудрахад дараагийн хуудас, таб солигдохгүй',im.pgNext===1&&im.view==='pu5View',JSON.stringify([im.pgNext,im.view]));
ok('Баруун тийш шудрахад өмнөх хуудас',im.pgBack===0,im.pgBack);
ok('Замын товчны мөрөн дээр шудрахад хуудас солигдохгүй',im.pgChip===0,im.pgChip);
ok('Дахин хурдан 2 товшвол горимоос гарна, доод таб буцна',im.off===false&&(im.bar2==='none'||/, 0\)$/.test(im.bar2)),JSON.stringify([im.off,im.bar2]));
ok('Дэрийн дугаар дээр 2 товшвол горим солигдохгүй',im.numTap===false);
const leave=await page.evaluate(async()=>{
  _p5SetImm(true);const was=document.body.classList.contains('p5-imm');
  goTab('home');await new Promise(r=>setTimeout(r,300));
  return {was,now:document.body.classList.contains('p5-imm')}});
ok('ПУ-5-аас гарахад доод таб буцаж гарна',leave.was&&!leave.now,JSON.stringify(leave));

/* ── 9. Буцах товч ── */
const bk=await page.evaluate(async()=>{
  openPu5();_p5SetImm(true);
  const a=_appBack(),immAfter=document.body.classList.contains('p5-imm');
  p5TogglePick();
  const b=_appBack(),openAfter=document.getElementById('p5Pick').classList.contains('open');
  const c=_appBack();await new Promise(r=>setTimeout(r,300));
  return {a,immAfter,b,openAfter,c,view:(document.querySelector('.view.active')||{}).id}});
ok('Буцах: маягт горимоос гарна → паспортын жагсаалт хаагдана → Нүүр',
   bk.a&&!bk.immAfter&&bk.b&&!bk.openAfter&&bk.c&&bk.view==='homeView',JSON.stringify(bk));

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
