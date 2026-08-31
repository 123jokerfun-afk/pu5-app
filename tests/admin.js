/* ══════════════════════════════════════════════════════════════
   АДМИН — ОН / УЛИРЛААР ХЭСГҮҮДИЙН ПАСПОРТ

   Бүх тооцоо ӨГӨГДСӨН паспортоос хийгдэх ёстой, глобал DB-ээс биш —
   админ 13 хэсгийн өгөгдлийг зэрэг үздэг.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

const YEAR=String(new Date().getFullYear());

/* ПД-6 хавар: 1-р үе 46 дэр, 14 тэнцэхгүй 3 алхмаар (дараалал үүсэхгүй)
               + #4,#5 солигдсон (эх байдлаар 15 → 32.6%)
               2-р үе 46 дэр, #11-13 дараалсан, сум нэмсэн (тооцонд орохгүй)
   ПД-7 хавар: цөөн тэнцэхгүй, 25%-д хүрэхгүй */
await page.evaluate(async(YEAR)=>{
  const mk=(id,lbl,n,bad,repl)=>{
    const s={id,type:'normal',label:lbl,note:'',date:YEAR+'-05-01',
      sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))};
    if(repl){s.repl={};repl.forEach(i=>{s.repl[i]={d:YEAR+'-05-12',t:'normal',m:'wood',o:1}})}
    return s};
  const many=Array.from({length:14},(_,i)=>i*3);
  const mkDb=(loc,badList,withRepl)=>({location:loc,v:3,rpt:{},main:[],tracks:[],
    folders:[
      {id:'fs',name:'Ш-хавар',season:'хавар',year:YEAR,date:YEAR+'-04-01',
       tracks:[{id:'t1',num:1,kind:'station',sections:[
         mk('s1','1-р үе',46,badList,withRepl?[3,4]:null),
         mk('s2','2-р үе',46,[10,11,12]),
         {id:'sw1',type:'turnout',label:'5-р сум',note:'',num:5,btw:{a:1,b:2},sleepers:[]}]}]},
      {id:'fa',name:'Ш-намар',season:'намар',year:YEAR,date:YEAR+'-09-01',
       tracks:[{id:'t1',num:1,kind:'station',sections:[mk('s1','1-р үе',46,[1,2,3])]}]},
      {id:'fo',name:'Ш-хуучин',season:'хавар',year:String(+YEAR-1),date:(+YEAR-1)+'-04-01',
       tracks:[{id:'t1',num:1,kind:'station',sections:[mk('s1','1-р үе',46,[5])]}]}
    ]});
  for(const [code,db] of [['ПД-6',mkDb('Шивээговь',many,true)],
                          ['ПД-7',mkDb('Чойр',[3,4,5,20],false)]]){
    const col=fbDb.collection('sections').doc(code).collection(PARTS_COL);
    const old=await col.get();
    const b0=fbDb.batch();old.forEach(d=>b0.delete(col.doc(d.id)));await b0.commit();
    const parts=_splitDB(_packDB(db));
    const b1=fbDb.batch();
    Object.keys(parts).forEach(k=>b1.set(col.doc(k),parts[k]));
    await b1.commit();
    await fbDb.collection('sections').doc(code).set({archivedAt:Date.now()});
  }
},YEAR);

/* ── 1. Нүүр таб админыг удирдлагын дэлгэц рүү аваачна ── */
const tab=await page.evaluate(async()=>{
  _isAdmin=true;_sectionCode='ADMIN';
  goTab('home');
  await new Promise(r=>setTimeout(r,1800));
  const t=id=>{const b=document.getElementById(id);return b?getComputedStyle(b).display:'?'};
  return {view:(document.querySelector('.view.active')||{}).id,
    home:document.getElementById('tabHome').getAttribute('aria-current'),
    pass:t('tabPass'),sw:t('tabSw'),sync:t('tabSync'),prof:t('tabProf'),
    n:_adminData.length}});
ok('Нүүр таб → удирдлагын дэлгэц',tab.view==='adminView',tab.view);
ok('Нүүр таб идэвхтэй',tab.home==='true',tab.home);
ok('Админд Паспорт / Сумууд таб нуугдана',tab.pass==='none'&&tab.sw==='none',
   JSON.stringify([tab.pass,tab.sw]));
ok('Мэдэгдэл / Профайл хэвээр',tab.sync!=='none'&&tab.prof!=='none');
ok('Хоёр хэсгийн өгөгдөл ачаалагдав',tab.n===2,tab.n+' хэсэг');

/* ── 1b. Толгойн товчнууд гарчигтай зөрөлдөхгүй ──
   Өмнө нь гурван товч + хоёр мөрт гарчиг нэг эгнээнд шахагдаж байв. */
const hdr=await page.evaluate(()=>{
  const acts=[...document.querySelectorAll('#adminView .adm-acts .icon-btn')];
  const tr=document.querySelector('#adminView .pg-title').getBoundingClientRect();
  return {n:acts.length,
    labels:acts.map(b=>b.textContent.trim()),
    w:acts.map(b=>Math.round(b.getBoundingClientRect().width)),
    // Товч бүр үнэхээр дарагдах уу
    hit:acts.map(b=>{const q=b.getBoundingClientRect();
      const e=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);
      return e===b||b.contains(e)}),
    // Гарчигтай давхцаж байна уу
    overlap:acts.some(b=>{const q=b.getBoundingClientRect();
      return !(q.top>=tr.bottom||q.bottom<=tr.top||q.left>=tr.right||q.right<=tr.left)})}});
ok('Толгойн гурван товч тусдаа эгнээнд',hdr.n===3,JSON.stringify(hdr.labels));
ok('Товчнууд тэнцүү өргөнтэй',new Set(hdr.w).size===1,JSON.stringify(hdr.w));
ok('Товч бүр дарагдана',hdr.n===3&&hdr.hit.every(Boolean),JSON.stringify(hdr.hit));
ok('Гарчигтай давхцахгүй',hdr.n===3&&!hdr.overlap,hdr.n+' товч');

/* ── 2. Он сонгогч ── */
const yr=await page.evaluate(()=>({
  sel:_admYear,
  items:[...document.querySelectorAll('#admYearWheel .wh-item')].map(e=>e.textContent),
  marked:(document.querySelector('#admYearWheel .wh-sel')||{}).textContent}));
ok('Он сонгогчид өгөгдлийн бүх он бий',
   yr.items.includes(YEAR)&&yr.items.includes(String(+YEAR-1)),JSON.stringify(yr.items));
ok('Энэ он анхнаасаа сонгогдсон',yr.sel===YEAR&&yr.marked===YEAR,
   yr.sel+' / тэмдэглэсэн '+yr.marked);

/* ── 3. Улирлын товч ── */
const se=await page.evaluate(()=>{
  admSetSeason('хавар');
  return {sp:document.getElementById('admSpring').classList.contains('on'),
    au:document.getElementById('admAutumn').classList.contains('on'),cur:_admSeason}});
ok('Хавар дарахад идэвхжинэ',se.sp&&!se.au&&se.cur==='хавар',JSON.stringify(se));
const se2=await page.evaluate(()=>{
  admSetSeason('намар');
  return {sp:document.getElementById('admSpring').classList.contains('on'),
    au:document.getElementById('admAutumn').classList.contains('on')}});
ok('Намар дарахад солигдоно (нэг нь л идэвхтэй)',!se2.sp&&se2.au,JSON.stringify(se2));

/* ── 4. Он + улирлаар шүүнэ ── */
const filt=await page.evaluate(async(YEAR)=>{
  const grab=()=>[...document.querySelectorAll('.adm-sec .adm-code')]
    .map(e=>e.textContent.replace(/\s+/g,' ').trim());
  admSetSeason('хавар');const spring=grab();
  admSetSeason('намар');const autumn=grab();
  admSetSeason('хавар');
  _admYear=String(+YEAR-1);renderAdminSections(_adminData);
  const old=grab();
  _admYear=YEAR;renderAdminSections(_adminData);
  return {spring,autumn,old}},YEAR);
ok('Хавар — хоёр хэсгийн паспорт',
   filt.spring.filter(x=>/Ш-хавар/.test(x)).length===2,JSON.stringify(filt.spring));
ok('Намар — намрын паспорт л гарна',
   filt.autumn.length>0&&filt.autumn.every(x=>/[Нн]амар/.test(x)),JSON.stringify(filt.autumn));
ok('Өмнөх он — тэр оны паспорт',
   filt.old.length===2&&filt.old.every(x=>/Ш-хуучин/.test(x)),JSON.stringify(filt.old));

/* ── 5. Хавтасны дүн — сум ОРОХГҮЙ ── */
const card=await page.evaluate(()=>{
  const secs=[...document.querySelectorAll('.adm-sec')];
  const pd6=secs.find(e=>/ПД-6/.test(e.textContent)&&/Ш-хавар/.test(e.textContent));
  return {cells:[...pd6.querySelectorAll('.adm-cell')].map(c=>+c.querySelector('b').textContent)}});
ok('Нийт дэр 92 (сум тооцогдоогүй)',card.cells[0]===92,String(card.cells[0]));
ok('Тэнцэхгүй 17',card.cells[1]===17,String(card.cells[1]));
ok('Модон 92 / ТБД 0',card.cells[2]===92&&card.cells[3]===0,JSON.stringify(card.cells.slice(2)));

/* ── 6. Дотор нь гурван хавтас ── */
const sub=await page.evaluate(()=>{
  const secs=[...document.querySelectorAll('.adm-sec')];
  const i=secs.findIndex(e=>/ПД-6/.test(e.textContent)&&/Ш-хавар/.test(e.textContent));
  admToggle('s'+i);
  const t=[...document.querySelectorAll('.adm-sec')][i];
  return {i,titles:[...t.querySelectorAll('.adm-fold-t')].map(e=>e.textContent)}});
ok('Гурван хавтас нээгдэв',
   sub.titles.length===3&&/Дараалсан/.test(sub.titles[0])
   &&/Солигдсон/.test(sub.titles[1])&&/25%/.test(sub.titles[2]),
   JSON.stringify(sub.titles));

/* ── 7. Дараалсан цэг ── */
const cs=await page.evaluate((i)=>{
  admToggle('s'+i+'c');
  const t=[...document.querySelectorAll('.adm-sec')][i];
  return {rows:[...t.querySelectorAll('.rp-row')].map(r=>r.textContent.replace(/\s+/g,' ').trim()),
    dates:[...t.querySelectorAll('.rp-row .repl-date')].map(e=>e.textContent.trim())}},sub.i);
ok('Дараалсан цэг олдов (#11→#13)',
   cs.rows.some(r=>/2-р үе/.test(r)&&/#11/.test(r)&&/#13/.test(r)),JSON.stringify(cs.rows));
ok('Бүлгийн урт тэмдэглэгдэнэ',cs.dates.some(d=>/3 дараалсан/.test(d)),JSON.stringify(cs.dates));

/* ── 8. Солигдсон дэрийн жагсаалт ── */
const rp=await page.evaluate((i)=>{
  admToggle('s'+i+'c');admToggle('s'+i+'r');
  const t=[...document.querySelectorAll('.adm-sec')][i];
  return [...t.querySelectorAll('.rp-row')].map(r=>r.textContent.replace(/\s+/g,' ').trim())},sub.i);
ok('Солигдсон дэр #4, #5 бүртгэгдсэн',
   rp.some(r=>/#4/.test(r))&&rp.some(r=>/#5/.test(r)),JSON.stringify(rp));

/* ── 9. 25%+ хүснэгт — багана тус бүр ── */
const t25=await page.evaluate((i)=>{
  admToggle('s'+i+'r');admToggle('s'+i+'p');
  const t=[...document.querySelectorAll('.adm-sec')][i];
  return {th:[...t.querySelectorAll('.adm-tbl th')].map(e=>e.textContent.replace(/\s+/g,'')),
    rows:[...t.querySelectorAll('.adm-tbl tbody tr')]
      .map(tr=>[...tr.children].map(td=>td.textContent.trim()))}},sub.i);
ok('Хүснэгт 9 баганатай',t25.th.length===9,JSON.stringify(t25.th));
ok('25%-аас дээш ганц үе олдов',t25.rows.length===1,JSON.stringify(t25.rows));
const row=t25.rows[0]||[];
ok('Үе, нийт, эпюр',row[0]==='1-р үе'&&row[1]==='46'&&row[2]==='46',JSON.stringify(row.slice(0,3)));
ok('Тэнцэхгүй 15, хувь 32.6',row[3]==='15'&&row[4]==='32.6',JSON.stringify(row.slice(3,5)));
ok('25%-д орох солих тоо 4',row[5]==='4',row[5]);
ok('Сольсон дэрийн № 4, 5',row[6]==='4, 5',row[6]);
ok('Сольсны дараах хувь 28.3',row[7]==='28.3',row[7]);
ok('Үлдсэн солих 2',row[8]==='2',row[8]);

/* ── 10. 25%-д хүрэхгүй хэсэгт хоосон гэж бичнэ ── */
const empty=await page.evaluate(()=>{
  const secs=[...document.querySelectorAll('.adm-sec')];
  const j=secs.findIndex(e=>/ПД-7/.test(e.textContent));
  admToggle('s'+j);admToggle('s'+j+'p');
  const t=[...document.querySelectorAll('.adm-sec')][j];
  return (t.querySelector('.adm-empty')||{}).textContent||''});
ok('25%-аас дээш үегүй хэсэгт мэдэгдэнэ',/25%/.test(empty),JSON.stringify(empty));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
