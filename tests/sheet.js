/* ══════════════════════════════════════════════════════════════
   GOOGLE SHEETS — АЛБАН МАЯГТУУДЫН МӨР

   Sheet рүү явах тоо ЭНД тодорхойлогддог тул Excel-ийн маягттай
   зөрөх нь ПУ-5 дээр хоёр өөр тоо гарна гэсэн үг. Тиймээс энэ тест
   зөвхөн бүтцийг биш — Excel-ийг ExcelJS-ээр БУЦААЖ уншиж, тоо тус
   бүрийг Sheet-ийн мөртэй тулгана.

   Томъёотой нүд (хувь, нийлбэр) нь ExcelJS-д утгагүй бичигддэг тул
   зөвхөн ШУУД БИЧСЭН нүднүүдийг тулгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
let ExcelJS=null;try{ExcelJS=require('exceljs')}catch(e){
  try{ExcelJS=require('./node_modules/exceljs')}catch(e2){}}
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
// Excel-д 0-ийг хоосон бичдэг (`a.bad||''`) тул тулгахын өмнө тэгшитгэнэ
const z=v=>(v===''||v===null||v===undefined)?0:v;
const V=r=>(r.values||[]).map(x=>x&&x.richText?x.richText.map(t=>t.text).join(''):x);
const eq=(a,b)=>Math.abs((+a||0)-(+b||0))<1e-9;
const _r1=v=>+(+v).toFixed(1);
let SHEET_N=18;

if(!ExcelJS){console.log('  ⚠ exceljs алга — алгасав');console.log('SUMMARY 0/0');process.exit(0)}

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

await page.evaluate(()=>{
  window.appConfirm=()=>Promise.resolve(true);
  window.__b64=null;
  window.dlBlob=function(blob,name){
    return new Promise(r=>{const fr=new FileReader();
      fr.onload=()=>{window.__b64={name,d:String(fr.result).split(',')[1]};r()};
      fr.readAsDataURL(blob)})};
});

/* ── Мэдэгдэж буй өгөгдөл ──────────────────────────────────────
   1-р зам: s1 46 дэр, 4 тэнцэхгүй (3,4,5 дараалсан + 20)
            s2 46 дэр, 3 тэнцэхгүй (10,11,12 дараалсан)
            s4 20 дэр, эх байдлаараа 2..8 буюу 7 тэнцэхгүй (35%),
               #3 сийрэгжилтээр, #6 энгийнээр солигдсон
   2-р зам: s3 46 дэр, 5 тэнцэхгүй (1..5 дараалсан)
   Гол зам: км 12, 46 дэр, 3 тэнцэхгүй
   Сум 1, 3: Р-65 1/9, 2 рам дэр + 68 дүнз, 3 м-ийн 3 дүнз дараалан
             тэнцэхгүй + 3.25 м-ийн нэг. #1 дүнз солигдсон.        */
await page.evaluate(()=>{
  const mkSec=(id,n,bad)=>({id,type:'normal',label:id+' үе',note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
  // Солигдсоныг ХЭВИЙН болгож, o:1-ээр эх байдлыг нь тэмдэглэнэ
  const s4=mkSec('s4',20,[3,4,6,7,8]);
  s4.repl={2:{d:'2026-05-20',s:1,o:1,m:'wood'},5:{d:'2026-05-21',m:'wood',o:1}};
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  DB.folders=[{id:'fx',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[
      {id:'t1',num:1,kind:'station',sections:[mkSec('s1',46,[3,4,5,20]),mkSec('s2',46,[10,11,12]),s4]},
      {id:'t2',num:2,kind:'station',sections:[mkSec('s3',46,[1,2,3,4,5])]}]}];
  activeFolderId='fx';DB.tracks=DB.folders[0].tracks;
  DB.main=[{id:'km12',num:12,kind:'main',mat:'tbd',fast:'CZ',sections:[mkSec('m1',46,[7,8,9])]}];
  // Р-65 1/9: рам зам 2 дэр, дараа нь 68 дүнз (3 м нь 19 ширхэг)
  // Эхний хоёр нь рам замын ДЭР (2,75 м) — нэг нь тэнцэхгүй
  let it='bn';for(let i=0;i<68;i++)it+=[0,1,2,19].includes(i)?'b':'n';
  const to=(id,num)=>({id,num,station:'Шивээговь',mak:'Р-65',mark:'1/9',proj:'2766',
    head:2,it,dRepl:{2:{d:'2026-06-10',o:1}}});
  DB.sw=[{id:'sf',name:'Хавар 2026 сум',season:'хавар',year:'2026',date:'2026-04-10',sc:'ПД-6',
    turnouts:[to('w1',1),to('w3',3)]},
    // Өөр улирлынх — маягтад ОРОХГҮЙ байх ёстой
    {id:'sn',name:'Намар 2026 сум',season:'намар',year:'2026',date:'2026-09-10',sc:'ПД-6',
     turnouts:[to('w9',9)]}];
  swFolderId='sf';saveDB();
});

async function grab(call){
  await page.evaluate(async s=>{window.__b64=null;await new Function('return ('+s+')')()},call);
  await page.waitForFunction(()=>window.__b64,{timeout:40000});
  const r=await page.evaluate(()=>window.__b64);
  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(r.d,'base64'));
  return wb
}

/* ── 18 албан маягтын шийт ────────────────────────────────────
   Шийт бүр = НЭГ МАЯГТ. Эх загвар нь ПЧ-3 ангийн нэгдсэн хүснэгт тул
   хэсгүүд НЭГ толгойн дор доош цувна. Хоёр хэсэг (ПД-6, ПД-11)
   үүсгэж, салаалсан гол замын салангид маягтуудыг ч шалгана. */
await page.evaluate(()=>{
  // Салбар замын дэр ба дүнзний паспорт — ижил он/улирлаар
  const mk=(id,n,bad)=>({id,type:'normal',label:id+' үе',note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
  DB.folders.push({id:'fbr',br:1,name:'Хавар 2026 салбар',season:'хавар',year:'2026',
    date:'2026-04-02',sc:'ПД-6',
    tracks:[{id:'b1',num:1,kind:'station',name:'Говь урал',
      sections:[mk('bs1',40,[0,1,2,3,4,5,6,7,8,9,10,11])]}]});
  const sw0=DB.sw[0];
  DB.sw.push({id:'sbr',br:1,name:'Хавар 2026 салбар сум',season:'хавар',year:'2026',
    date:'2026-04-11',sc:'ПД-6',
    turnouts:[Object.assign({},sw0.turnouts[0],{id:'wb1',num:1})]});
  saveDB()
});
const sh=await page.evaluate(()=>{
  const db=DB,folder=DB.folders[0];
  const before={dbLoc:DB.location,fid:activeFolderId,sw:swFolderId,sc:_sectionCode,
    tr:(DB.tracks||[]).map(t=>t.id).join()};
  const swf=_shSwFolder(db,folder);
  // ПД-11 нь САЛААЛСАН гол замтай хэсэг — ижил өгөгдлөөр өөр маягт руу орно
  const s6=_sectionBlocks('ПД-6',db,folder,swf);
  const s11=_sectionBlocks('ПД-11',db,folder,swf);
  const s2=_sectionBlocks('ПД-2',db,folder,swf);
  const sheets=SH_FORMS.map((F,fi)=>{
    const o=_formSheet(fi,[s2,s6,s11]);        // тоон дараалал: 2, 6, 11
    return{tab:F.tab,rows:o.rows,fmt:o.fmt,cols:F.h0.length,no:F.no,sc:F.sc,sub:F.sub,
      head:o.head,freeze:o.freeze,w:F.w.map(_shPx),h:F.h.map(_shPt),dd:!!F.dd}
  });
  const two=SH_FORMS.map((F,fi)=>_formSheet(fi,[s6]).rows.length);
  return{sheets,two,drop:SH_DROP,
    before,after:{dbLoc:DB.location,fid:activeFolderId,sw:swFolderId,sc:_sectionCode,
      tr:(DB.tracks||[]).map(t=>t.id).join()}}
});

/* ══ 1. Бүтэц ══════════════════════════════════════════════ */
console.log('\nБүтэц');
const SHT=sh.sheets;
const want=['Маягт-1','Маягт-1 Товъёог','Маягт-1 Хавсралт-2','Маягт-1 Хавсралт-3',
  'Маягт-1 Хавсралт-3 Товъёог','Маягт-1 Хавсралт-3 ХАЯ','Маягт-1 Хавсралт-2 өртөө',
  'Маягт-1 Хавсралт-4','Маягт-1 Хавсралт-4 Товъёог','Маягт-1 Хавсралт-5',
  'Маягт-1 Хавсралт-5 25%','Салаалсан гол зам','Салаалсан гол зам Товъёог',
  'Салаалсан гол зам 25%','Маягт-2','Маягт-2 Товъёог','Маягт-2 Хавсралт-1',
  'Маягт-2 Хавсралт-2'];
SHEET_N=SHT.length;
ok('18 албан маягт',SHT.length===18,SHT.length+' ширхэг');
ok('Маягт бүр өөрийн шийттэй, дугаарын дарааллаар',
   SHT.every((x,i)=>x.tab===want[i]),SHT.map(x=>x.tab).join(' | '));
ok('Табын нэр давхардахгүй',
   new Set(SHT.map(x=>x.tab)).size===18,'зөв');
ok('Хуучин бүтцийн шийтүүд устгагдана',
   sh.drop.indexOf('Маягт-2 Хавсралт-1.1')>=0,JSON.stringify(sh.drop));
ok('_withSection глобалыг сэргээв (_sectionCode ба DB.tracks-ыг ч)',
   JSON.stringify(sh.before)===JSON.stringify(sh.after),JSON.stringify(sh.after));

// Толгойн байрлал маягт бүрд өөр (гарчгийн блок 4-5 мөр)
const HR=s=>s.fmt[0].row;                 // толгойн 1-р мөр (1-ээс)
const D=s=>s.rows.slice(HR(s)+1);
const live=SHT.filter(s=>s.rows.length);
ok('Ихэнх маягт бөглөгдөв',live.length>=14,live.length+'/18');
ok('Өгөгдөлгүй маягт ОГТ үүсэхгүй',
   SHT.every(s=>!s.rows.length||D(s).length>0),
   SHT.filter(s=>!s.rows.length).map(s=>s.tab).join(', ')||'бүгд бөглөгдөв');
ok('Толгойн хоёр мөр эх загварын баганын тоотой тэнцүү',
   live.every(s=>s.rows[HR(s)-1].length===s.cols&&s.rows[HR(s)].length===s.cols
              &&s.w.length===s.cols),
   JSON.stringify(live.map(s=>[s.rows[HR(s)-1].length,s.cols,s.w.length]).slice(0,4)));

/* ── Албан гарчгийн блок ──────────────────────────────────────
   Эх Excel загварт маягт бүр 4-5 мөрт гарчигтай: маягтын дугаар,
   замын анги, он/улирал, тодорхойлолт, хамрах хүрээ, огноо. Өмнө нь
   апп 2 мөрт хураангуй бичдэг байсан тул эх маягттай зөрж байв. */
const F0=SHT[0];
ok('1-р мөр: маягтын дугаар зүүнд, замын анги баруунд',
   F0.rows[0][0]==='Маягт-1'&&F0.rows[0].some(v=>/ЗАМЫН 3-Р АНГИ/.test(String(v))),
   JSON.stringify(F0.rows[0].filter(Boolean)));
ok('2-р мөр: анги, он, улирал',
   /^Замын 3-р ангийн 2026 оны хавр/.test(String(F0.rows[1][0])),String(F0.rows[1][0]));
ok('3-р мөр: маягтын тодорхойлолт',
   F0.rows[2][0]==='паспортын үзлэгээр илэрсэн тэнцэхгүй дэрийн тоо',String(F0.rows[2][0]));
ok('4-р мөр: хамрах хүрээ',F0.rows[3][0]==='Гол зам',String(F0.rows[3][0]));
ok('Огноо баруун талд, тусдаа мөрөнд',
   F0.rows[4][0]===''&&/2026 оны \d{2}-р сарын \d{2}-ний өдөр/
     .test(String(F0.rows[4].filter(Boolean)[0])),
   JSON.stringify(F0.rows[4].filter(Boolean)));
ok('Гарчгийн мөр бүр НЭГТГЭГДЭНЭ (head заавар)',
   live.every(s=>s.head&&s.head.length>=4
     &&s.head.every(h=>h.r>=1&&h.r<HR(s)&&h.c>=1&&h.c+h.cs-1<=s.cols)),
   JSON.stringify((F0.head||[]).map(h=>`r${h.r}c${h.c}+${h.cs}${h.a}`)));
ok('Гарчгийн доорх толгой хүртэл наалдана (freeze)',
   live.every(s=>s.freeze===HR(s)+1),JSON.stringify(live.map(s=>s.freeze).slice(0,5)));
ok('Маягт бүр өөрийн албан дугаартай',
   SHT.every(s=>/^Маягт-[12]( Хавсралт-\d)?$/.test(String(s.no))),
   JSON.stringify([...new Set(SHT.map(s=>s.no))]));
ok('Тодорхойлолт нь хамрах хүрээг ДАВХАРДУУЛАХГҮЙ',
   SHT.every(s=>!s.sc||String(s.sub).indexOf(s.sc)<0),
   JSON.stringify(SHT.filter(s=>s.sc&&String(s.sub).indexOf(s.sc)>=0).map(s=>s.tab)));
ok('Мөр бүр массив, 40 баганаас хэтрэхгүй',
   live.every(s=>s.rows.every(r=>Array.isArray(r)&&r.length<=40)),
   'хамгийн урт '+Math.max(...live.map(s=>Math.max(...s.rows.map(r=>r.length)))));

/* Хэлбэрийн заавар */
ok('Шийт бүрд НЭГ хүснэгтийн заавар',
   live.every(s=>s.fmt.length===1),JSON.stringify(live.map(s=>s.fmt.length)));
ok('Толгой 2 мөр, хүрээ бүх мөрийг хамарна',
   live.every(s=>s.fmt[0].head===2&&HR(s)>=5&&HR(s)<=6
              &&s.fmt[0].n===s.rows.length-HR(s)+1),
   JSON.stringify(live.map(s=>[HR(s),s.fmt[0].n,s.rows.length]).slice(0,4)));
ok('Нэгтгэлүүд хүснэгтийн баганаас халихгүй',
   live.every(s=>s.fmt[0].merges.every(m=>m[1]>=1&&m[1]+m[3]-1<=s.cols)),'зөв');
ok('Нэгтгэл толгойн хоёр мөрийн дотор л байна',
   live.every(s=>s.fmt[0].merges.every(m=>m[0]>=HR(s)&&m[0]+m[2]-1<=HR(s)+1)),'зөв');
ok('Бүдүүн мөр өгөгдлийн мужид байна',
   live.every(s=>s.fmt[0].bold.every(b=>b>HR(s)+1&&b<=s.rows.length)),
   JSON.stringify(live.map(s=>s.fmt[0].bold.length)));

/* Хэсгүүдийн дараалал ба хамрах хүрээ */
const codesOf=s=>D(s).map(r=>String(r[0])+'|'+String(r[1]))
  .map(x=>(x.match(/ПД-\d+/)||[''])[0]).filter(Boolean);
const m1=codesOf(SHT[0]);
ok('Гол замын маягтад САЛААЛСАН хэсэг орохгүй (ПД-11)',
   m1.indexOf('ПД-11')<0&&m1.indexOf('ПД-6')>=0,m1.join(','));
const brc=codesOf(SHT[11]);
ok('Салаалсан гол замын маягтад ЗӨВХӨН ПД-11/12',
   brc.length>0&&brc.every(c=>c==="ПД-11"),brc.join(","));
const st=codesOf(SHT[3]);
ok('Хэсгүүд ТООН дарааллаар цувна (үсгийн эрэмбэ биш)',
   st.indexOf('ПД-2')===0&&st.indexOf('ПД-2')<st.indexOf('ПД-11'),st.join(','));
ok('Хоёроос дээш хэсэгтэй үед "Замын анги" дүн гарна',
   D(SHT[3]).slice(-1)[0][0]==='Замын анги',String(D(SHT[3]).slice(-1)[0][0]));
ok('Ганц хэсэгтэй үед ангийн дүн ДАВХАРДАХГҮЙ',
   sh.two[3]<SHT[3].rows.length
   &&!/Замын анги/.test(JSON.stringify(sh.two)),String(sh.two[3]));

/* Д/д — өмнө нь хэсэг бүрд 1-ээс эхэлдэг байв */
const ddSheets=SHT.filter(s=>s.dd&&s.rows.length);
const ddBad=ddSheets.filter(s=>{
  const n=D(s).map(r=>r[0]).filter(v=>v!==''&&v!==undefined);
  return !n.every((v,i)=>v===i+1)});
ok('Жагсаалтын Д/д шийт даяар цуваа',!ddBad.length,
   ddBad.map(s=>s.tab+': '+JSON.stringify(D(s).map(r=>r[0]))).join(' | ')||'зөв');

/* Хоёр мөрт хос (Ширхэг / Пог.м) — Хавсралт-1 */
{
  const A=SHT[16],d=D(A);
  ok('Хавсралт-1 хэсэг бүр Ширхэг/Пог.м хосоор',
     d.length%2===0&&d.every((r,i)=>String(r[2])===(i%2?'Пог.м':'Ширхэг')),
     JSON.stringify(d.map(r=>r[2])));
  // Сумын эхний дэр 2,75 м-тэй — маягтын 2,75 багана нь ТЭД
  ok('Хавсралт-1-ийн 2,75 багана = рам замын тэнцэхгүй дэр',
     A.rows[HR(A)][3]===2.75&&d[0][3]===2&&eq(d[1][3],5.5),
     JSON.stringify([A.rows[HR(A)][3],d[0][3],d[1][3]]));
}

/* ══ 2. Дэрийн маягтууд — Excel-тэй тулгах ══════════════════ */
console.log('\nДэрийн маягт (Excel-тэй тулгав)');
const wb=await grab('exportColoredExcel()');
const xM1=wb.getWorksheet('дэр ПО-6 маягт-1 ');
const xM13=wb.getWorksheet('Маягт 1-3 өртөө ПО-6');
const xM12=wb.getWorksheet('маягт1-2');
const xM14=wb.getWorksheet('Маягт 1-4 өртөө-сийрэгжилт');
ok('Excel-ийн 4 маягт олдов',!!(xM1&&xM13&&xM12&&xM14));

// Маягт-1 — гол зам, км 12 (Excel 9-р мөр)
{
  const s=D(SHT[0]).find(r=>String(r[0])==='ПД-6');
  const x=V(xM1.getRow(9));
  const map=[[3,2],[4,3],[5,4],[6,5],[7,6],[8,7],
             [11,10],[12,11],[13,12],[14,13],[15,14],[16,15],[17,16],[18,17],[19,18]];
  const bad=map.filter(([c,j])=>!eq(z(x[c]),z(s[j])));
  ok('Маягт-1: км 12-ийн бүх тоо Excel-тэй ижил',!bad.length,
     bad.map(([c,j])=>`багана ${c}: ${x[c]} ≠ ${s[j]}`).join('; '));
  ok('Маягт-1: км дугаар',eq(x[2],s[1]),`${x[2]} / ${s[1]}`);
  ok('Маягт-1: хэсэг бүрийн дараа "ПД-N дүн" мөр',
     D(SHT[0]).some(r=>String(r[0])==='ПД-6 дүн'),'зөв');
}
// Хавсралт-3 — өртөөний 2 зам (Excel 8, 9-р мөр)
{
  const d=D(SHT[3]).filter(r=>String(r[0])==='ПД-6');
  const map=[[5,4],[6,5],[7,6],[8,7],[9,8],
             [11,10],[12,11],[13,12],[14,13],[15,14],[16,15],[17,16],[18,17],[19,18]];
  let bad=[];
  [0,1].forEach(k=>{
    const x=V(xM13.getRow(8+k)),s=d[k];
    map.forEach(([c,j])=>{if(!eq(z(x[c]),z(s[j])))bad.push(`зам${k+1} багана${c}: ${x[c]}≠${s[j]}`)})
  });
  ok('Хавсралт-3: 2 замын бүх тоо Excel-тэй ижил',!bad.length,bad.slice(0,3).join('; '));
  const tot=D(SHT[3]).find(r=>String(r[0])==='ПД-6 дүн');
  ok('Хавсралт-3: дүн мөр модон+бетоны нийлбэр',
     eq(tot[3],(+tot[4]||0)+(+tot[5]||0)),`${tot[3]} vs ${tot[4]}+${tot[5]}`);
}
// Хавсралт-2 өртөө — 25%+ үе (Excel 'маягт1-2' 7-р мөр)
{
  const d=D(SHT[6]),s=d.find(r=>String(r[1])==='ПД-6');
  const x=V(xM12.getRow(7));
  ok('Хавсралт-2 өртөө: ганц үе олдов (s4)',
     d.filter(r=>String(r[1])==='ПД-6').length===1,
     d.map(r=>r[1]+'/'+r[3]).join(', '));
  ok('Хавсралт-2 өртөө: үеийн нэр Excel-тэй ижил',String(x[4])===String(s[3]),`${x[4]} / ${s[3]}`);
  ok('Хавсралт-2 өртөө: эпюр ба тэнцэхгүй Excel-тэй ижил',
     eq(x[5],s[4])&&eq(x[6],s[5]),`${x[5]}/${s[4]} · ${x[6]}/${s[5]}`);
  ok('Хавсралт-2 өртөө: эзлэх хувь 35 (эх байдлаар)',eq(s[6],35),String(s[6]));
  ok('Хавсралт-2 өртөө: 31-40% нүдэнд тэмдэглэгдэнэ',
     s[8]===''&&s[9]===1&&s[10]===''&&s[11]==='',JSON.stringify(s.slice(8,12)));
  ok('Хавсралт-2 өртөө: сольсон 2 дэр',eq(s[13],2),String(s[13]));
  // Гол замд 25%-тай үе алга — тэр маягт хоосон үлдэх ёстой
  ok('25%-гүй бол гол замын Хавсралт-2 үүсэхгүй',
     SHT[2].rows.length===0,SHT[2].rows.length+' мөр');
}
// Хавсралт-4 — сийрэгжилт (Excel 7-р мөр)
{
  const s=D(SHT[7]).find(r=>String(r[1])==='ПД-6');
  const x=V(xM14.getRow(7));
  ok('Хавсралт-4: үе, эпюр Excel-тэй ижил',
     String(x[4])===String(s[3])&&eq(x[5],s[4]),`${x[4]}/${s[3]} · ${x[5]}/${s[4]}`);
  ok('Хавсралт-4: 5 ба дээш дараалсан гэж тэмдэглэв',
     s[5]===''&&s[6]===''&&s[7]===1,JSON.stringify(s.slice(5,8)));
  ok('Хавсралт-4: сольсон 1 дэр, дугаар 3',eq(s[10],1)&&String(s[11])==='3',
     `${s[10]} · ${s[11]}`);
  const t=D(SHT[8]).find(r=>String(r[1])==='ПД-6');
  ok('Хавсралт-4 Товъёог: "Нийт илэрсэн" = 3+4+5-ын нийлбэр',
     eq(t[7],(+t[4]||0)+(+t[5]||0)+(+t[6]||0)),JSON.stringify(t.slice(4,8)));
}
// Салбар зам — өөрийн паспортоор
{
  const d=D(SHT[9]).filter(r=>String(r[0])==='ПД-6');
  ok('Хавсралт-5: салбар замын нэр маягтаас гарна',
     d.length&&String(d[0][1])==='Говь урал',JSON.stringify(d.map(r=>r[1])));
  ok('Хавсралт-5: 40 дэр, 12 тэнцэхгүй, 30%',
     eq(d[0][2],40)&&eq(d[0][5],12)&&eq(d[0][8],30),
     `${d[0][2]} · ${d[0][5]} · ${d[0][8]}`);
  const q=D(SHT[10]).filter(r=>String(r[1])==='ПД-6');
  ok('Хавсралт-5 25%: 30%-тай үе жагсаалтад орно',
     q.length===1&&eq(q[0][7],30)&&q[0][8]===1,JSON.stringify(q[0]&&q[0].slice(5,12)));
}

/* ══ 3. Дүнзний маягтууд — Excel-тэй тулгах ════════════════ */
console.log('\nДүнзний маягт (Excel-тэй тулгав)');
const wb2=await grab('exportSwForms()');
const xS2=wb2.getWorksheet('дүнз ПО-6-маягт-2');
const xA1=wb2.getWorksheet('тэнцэхгүй дүнз маягт 2-1');
ok('Excel-ийн дүнзний маягт олдов',!!(xS2&&xA1));
{
  // Маягт-2: Excel C,D,E,G..K шууд бичигдсэн (F, L томъёо)
  const d=D(SHT[14]).filter(r=>String(r[0])!=='ПД-6 дүн'&&/Шивээговь/.test(String(r[0])));
  const map=[[3,2],[4,3],[5,4],[7,6],[8,7],[9,8],[10,9],[11,10]];
  let bad=[];
  [0,1].forEach(k=>{
    const x=V(xS2.getRow(9+k)),s=d[k];
    map.forEach(([c,j])=>{if(!eq(z(x[c]),z(s[j])))bad.push(`сум${k+1} багана${c}: ${x[c]}≠${s[j]}`)})
  });
  ok('Маягт-2: 2 сумын бүх тоо Excel-тэй ижил',!bad.length,bad.slice(0,3).join('; '));
  const s=d[0];
  ok('Маягт-2: нийт 68 дүнз, тэнцэхгүй 4 ш / 12.25 пог/м',
     eq(s[2],68)&&eq(s[3],4)&&eq(s[4],12.25),`${s[2]} · ${s[3]} · ${s[4]}`);
  ok('Маягт-2: 3 зэрэгцсэн цэг 1, солигдсон 1 ш / 3 пог/м',
     eq(s[6],1)&&eq(s[9],1)&&eq(s[10],3),`${s[6]} · ${s[9]} · ${s[10]}`);
  const t=D(SHT[15]).find(r=>/ПД-6/.test(String(r[0])));
  ok('Маягт-2 Товъёог: сольсны дараах хувь = (тэнц−сольсон)/нийт',
     eq(t[10],_r1((t[2]-t[8])*100/t[1])),`${t[10]} · ${t[1]}/${t[2]}/${t[8]}`);
}
// Хавсралт-1 — урт тус бүрийн ТЭНЦЭХГҮЙ дүнз. Excel-д сум бүр 2 мөр
// (Байгаа / Тэнцэхгүй) тул тэнцэхгүй мөрүүдийг нэмж тулгана.
{
  const all=D(SHT[16]),i0=all.findIndex(r=>/Шивээговь/.test(String(r[1])));
  const shx=all[i0],shp=all[i0+1];
  let bad=[];
  for(let c=5;c<=15;c++){
    const xs=z(V(xA1.getRow(9))[c])+z(V(xA1.getRow(11))[c]);
    const j=c-1;                          // 2.75 багана нэмэгдсэн тул +1
    if(!eq(xs,z(shx[j])))bad.push(`урт${c}: ${xs}≠${shx[j]}`)
  }
  ok('Хавсралт-1: урт тус бүрийн тэнцэхгүй тоо Excel-тэй ижил',!bad.length,
     bad.slice(0,3).join('; '));
  ok('Хавсралт-1: Пог.м мөр = ширхэг × урт',
     eq(shp[4],(+shx[4]||0)*3)&&eq(shp[5],(+shx[5]||0)*3.25),
     `${shp[4]} · ${shp[5]}`);
  ok('Хавсралт-1: баруун талын Тоо/пог.м ЗӨВХӨН дүнзийнх (2,75 орохгүй)',
     eq(shx[15],8)&&shx[16]===''&&shp[15]===''&&eq(shp[16],24.5),
     `${shx[15]} · ${shp[16]}`);
  const b2=D(SHT[17]).find(r=>String(r[1])==='ПД-6');
  ok('Хавсралт-2 (салбар дүнз): салбарын сумаар бөглөгдөнө',
     !!b2&&eq(b2[2],68)&&eq(b2[4],4),b2?`${b2[2]} · ${b2[4]}`:'алга');
}

/* ══ 4. Дэлгэцийн холбоо ═══════════════════════════════════ */
console.log('\nАдмин дэлгэц');
const ui=await page.evaluate(async()=>{
  _isAdmin=true;
  openSheetCfg();
  await new Promise(r=>setTimeout(r,450));
  const m=document.getElementById('sheetCfgModal');
  const inp=document.getElementById('shUrl');
  const btn=document.getElementById('shPushBtn');
  const r=btn?btn.getBoundingClientRect():null;
  const hit=r?(()=>{const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return e===btn||btn.contains(e)})():false;
  const open=m.classList.contains('open');
  closeModal('sheetCfgModal');
  return {open,inp:!!inp,hit,w:r?Math.round(r.width):0}});
ok('Sheets цонх нээгдэнэ',ui.open&&ui.inp,JSON.stringify(ui));
/* Холбоос нэг удаа тавигддаг тул талбар нь нуугдсан байх ёстой —
   өдөр тутам харагдах нь илгээх ба нээх хоёр л */
const lnk=await page.evaluate(async()=>{
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/AAA/exec');
  openSheetCfg();
  // Цонх доороос дээш гүйж нээгддэг тул шилжилт дуустал хүлээнэ
  await new Promise(r=>setTimeout(r,450));
  const box=document.getElementById('shUrlBox');
  const hid=box.hidden;
  const btn=document.getElementById('shLinkBtn');
  const open=document.querySelector('#sheetCfgModal button[onclick*=openSheets]');
  const rb=btn.getBoundingClientRect(),ro=open.getBoundingClientRect();
  const hit=(()=>{const e=document.elementFromPoint(rb.left+rb.width/2,rb.top+rb.height/2);
    return e===btn||btn.contains(e)})();
  toggleSheetUrl();
  await new Promise(r=>setTimeout(r,80));
  const shown=!box.hidden, filled=document.getElementById('shUrl').value;
  toggleSheetUrl();
  const hid2=box.hidden;
  closeModal('sheetCfgModal');localStorage.removeItem(SH_KEY);
  return {hid,shown,hid2,filled,hit,wBtn:Math.round(rb.width),wOpen:Math.round(ro.width),
    sameRow:Math.abs(rb.top-ro.top)<2}});
ok('Холбоос тавигдсан үед талбар нуугдана',lnk.hid,String(lnk.hid));
ok('Холбоосны товч дарахад талбар нээгдэж, одоогийнх нь бөглөгдөнө',
   lnk.shown&&/AAA/.test(lnk.filled),lnk.filled);
ok('Дахин дарахад хаагдана',lnk.hid2,String(lnk.hid2));
ok('Товч дарагдана',lnk.hit,String(lnk.hit));
ok('Нээх : холбоос = 2 : 1 өргөнтэй, нэг эгнээнд',
   lnk.sameRow&&Math.abs(lnk.wOpen/lnk.wBtn-2)<0.25,
   lnk.wOpen+'px : '+lnk.wBtn+'px');
ok('"Маягт илгээх" товч дарагдана',ui.hit&&ui.w>0,`${ui.w}px`);
const nourl=await page.evaluate(async()=>{
  localStorage.removeItem(SH_KEY);
  document.getElementById('shUrl').value='';
  await pushToSheets();
  const o=document.getElementById('sheetCfgModal').classList.contains('open');
  closeModal('sheetCfgModal');return o});
ok('Холбоосгүй бол тохиргоог нээнэ (чимээгүй унахгүй)',nourl,String(nourl));
const saved=await page.evaluate(async()=>{
  // Код цонх гарвал зөв кодыг нь бөглөж батална
  const pin=v=>{const i=document.getElementById('shPin');if(i)i.value=v;
    document.getElementById('shPinOk').click()};
  document.getElementById('shUrl').value='https://example.com/x';
  const okA=await saveSheetCfg(true);          // буруу холбоос — код хүртэл асуухгүй
  const a=localStorage.getItem(SH_KEY);
  document.getElementById('shUrl').value='https://script.google.com/macros/s/AAA/exec';
  const p=saveSheetCfg(true);
  await new Promise(r=>setTimeout(r,60));
  const asked=document.getElementById('sheetPinModal').classList.contains('open');
  pin('000000');                                // буруу код
  await new Promise(r=>setTimeout(r,60));
  const stillOpen=document.getElementById('sheetPinModal').classList.contains('open');
  const beforePin=localStorage.getItem(SH_KEY);
  pin('861145');                                // зөв код
  await p;
  const b=localStorage.getItem(SH_KEY);
  localStorage.removeItem(SH_KEY);
  return {a,b,okA,asked,stillOpen,beforePin}});
ok('Буруу холбоос хадгалагдахгүй',!saved.a&&saved.okA===false,String(saved.a));
ok('Холбоос солиход код асууна',saved.asked,String(saved.asked));
ok('Буруу код — цонх хаагдахгүй, хадгалахгүй',
   saved.stillOpen&&!saved.beforePin,
   'цонх '+saved.stillOpen+' · '+String(saved.beforePin));
ok('Зөв код өгөхөд хадгалагдана',/script\.google\.com/.test(saved.b||''),String(saved.b));

/* Хадгалахаа мартсан ч илгээх нь ажиллах ёстой — v114-д бичсэн
   холбоос чимээгүй хаягдаж, цонх дахин нээгдэж, хэрэглэгч гацдаг байв. */
const unsaved=await page.evaluate(async()=>{
  localStorage.removeItem(SH_KEY);
  // Админы өгөгдөл — сонгосон он/улирал нь паспорттойгоо таарна
  // Тоон эрэмбэ шалгах хос: үсгээр эрэмбэлбэл 'ПД-10' нь 'ПД-2'-оос ӨМНӨ орно
  _adminData=[{code:'ПД-10',db:DB},{code:'ПД-2',db:DB}];
  _admYear='2026';_admSeason='хавар';
  document.getElementById('shUrl').value='https://script.google.com/macros/s/BBB/exec?t=861145';
  window.__posted=null;
  const of=window.fetch;
  window.__bodies=[];
  window.fetch=(u,o)=>{window.__posted=u;window.__body=o&&o.body;
    try{window.__bodies.push(JSON.parse(o.body))}catch(e){}
    return Promise.resolve(
    {text:()=>Promise.resolve(JSON.stringify({ok:true,tab:'X',rows:1}))})};
  window.appConfirm=()=>Promise.resolve(true);
  const pr=pushToSheets();
  await new Promise(r=>setTimeout(r,60));
  const i=document.getElementById('shPin');if(i)i.value='861145';
  document.getElementById('shPinOk').click();
  await pr;
  window.fetch=of;
  const B=window.__bodies||[];
  return {saved:localStorage.getItem(SH_KEY),posted:window.__posted,
    tabs:B.map(x=>x.tab),purge:B.map(x=>!!x.purge),pos:B.map(x=>x.pos),
    // Хэсгүүд НЭГ хүснэгтэд цувдаг тул эхний баганаас дарааллыг шалгана
    order:[...new Set((B[0]?B[0].rows:[]).slice(5)
      .map(r=>(String((r&&r[0])||'').match(/^ПД-\d+$/)||[''])[0]).filter(Boolean))],
    drop:B.map(x=>x.drop||null),
    open:document.getElementById('sheetCfgModal').classList.contains('open')}});
ok('Хадгалахгүйгээр илгээхэд холбоос өөрөө хадгалагдана',
   /BBB/.test(String(unsaved.saved)),String(unsaved.saved));
ok('Илгээлт үнэхээр явав (цонх дахин нээгдээгүй)',
   /BBB/.test(String(unsaved.posted))&&!unsaved.open,
   String(unsaved.posted)+' · цонх '+unsaved.open);
/* Маягт бүр өөрийн шийттэй. ӨГӨГДӨЛГҮЙ маягт огт илгээгдэхгүй —
   Sheet дээр хоосон хүснэгт үүсэх ёсгүй. */
ok('Зөвхөн бөглөгдсөн маягт илгээгдэнэ',
   unsaved.tabs.length>0&&unsaved.tabs.length<SHEET_N
   &&unsaved.tabs[0]==='Маягт-1'
   &&unsaved.tabs.indexOf('Салаалсан гол зам 25%')<0,
   unsaved.tabs.length+'/'+SHEET_N+': '+JSON.stringify(unsaved.tabs));
ok('Табын байрлал завсаргүй 1-ээс цувна',
   JSON.stringify(unsaved.pos)===JSON.stringify(unsaved.tabs.map((_,i)=>i+1)),
   JSON.stringify(unsaved.pos));
ok('Хуучин бүтцийн шийтүүдийн жагсаалт эхний хүсэлтэд явна',
   (unsaved.drop[0]||[]).indexOf('Маягт-2 Хавсралт-1.1')>=0
   &&unsaved.drop.slice(1).every(d=>!d),JSON.stringify(unsaved.drop[0]));
ok('Хэсгүүд ТООН дарааллаар цувна (үсгийн эрэмбэ биш)',
   JSON.stringify(unsaved.order)===JSON.stringify(['ПД-2','ПД-10']),
   JSON.stringify(unsaved.order));
ok('Хуучин "… маягт" шийтүүдийг ЭХНИЙ хүсэлтээр л цэвэрлэнэ',
   unsaved.purge[0]===true&&unsaved.purge.slice(1).every(p=>p===false),
   JSON.stringify(unsaved.purge));

/* CORS хаагдвал (Failed to fetch) no-cors-оор ДАХИН илгээнэ — өгөгдөл
   хүрнэ, гэхдээ хариу уншигдахгүй тул амжилт гэж мэдэгдэж БОЛОХГҮЙ. */
const cors=await page.evaluate(async()=>{
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/CCC/exec');
  document.getElementById('shUrl').value='';   // код асуухаас сэргийлнэ
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  const of=window.fetch,calls=[];
  window.fetch=(u,o)=>{
    calls.push((o&&o.mode)||'cors');
    if(calls.length===1)return Promise.reject(new TypeError('Failed to fetch'));
    return Promise.resolve({type:'opaque',text:()=>Promise.resolve('')})
  };
  window.appConfirm=()=>Promise.resolve(true);
  let msg='';const ot=window.showToast;
  window.showToast=(m,d)=>{msg=m;return ot(m,d)};
  await pushToSheets();
  window.fetch=of;window.showToast=ot;localStorage.removeItem(SH_KEY);
  return {calls,msg}});
ok('CORS унавал no-cors-оор дахин илгээнэ',
   cors.calls[0]==='cors'&&cors.calls[1]==='no-cors',JSON.stringify(cors.calls.slice(0,3)));
ok('Сохор илгээлтийг амжилт гэж хэлэхгүй, шалгуулна',
   !/^✓/.test(cors.msg)&&/шалгана уу/.test(cors.msg),cors.msg);

/* Хоёулаа унавал юу шалгахыг нь заана */
const dead=await page.evaluate(async()=>{
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/DDD/exec');
  document.getElementById('shUrl').value='';
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  const of=window.fetch;
  window.fetch=()=>Promise.reject(new TypeError('Failed to fetch'));
  window.appConfirm=()=>Promise.resolve(true);
  // Апп унасан илгээлтийг console.error-т бичдэг — энэ нь ЗӨВ зан төлөв,
  // зориуд үүсгэсэн алдаа тул тестийн консолын шалгалтад орох ёсгүй
  const oe=console.error;console.error=()=>{};
  let msg='';const ot=window.showToast;
  window.showToast=(m,d)=>{msg=m;return ot(m,d)};
  await pushToSheets();
  window.fetch=of;window.showToast=ot;console.error=oe;localStorage.removeItem(SH_KEY);
  return msg});
ok('Бүрэн унавал шалтгааныг нь заана (Failed to fetch биш)',
   /Who has access/.test(dead),dead);

/* Скрипт бичсэн шийтийнхээ #gid-тэй холбоосыг буцаадаг. Түүнийг
   хадгалж, "Sheets нээх" тэр таб дээр буудаг байх ёстой — эс тэгвэл
   хамгийн сүүлд идэвхтэй байсан хуучин шийт нээгдэнэ. */
const gid=await page.evaluate(async()=>{
  localStorage.removeItem(SH_OPEN);
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/EEE/exec');
  document.getElementById('shUrl').value='';
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  const of=window.fetch;
  window.fetch=()=>Promise.resolve({text:()=>Promise.resolve(JSON.stringify(
    {ok:true,tab:'ПД-6 маягт',rows:9,url:'https://docs.google.com/spreadsheets/d/ZZZ/edit#gid=777'}))});
  window.appConfirm=()=>Promise.resolve(true);
  await pushToSheets();
  window.fetch=of;
  const stored=localStorage.getItem(SH_OPEN);
  // Нээхийг нь барьж, ямар хаяг руу орохыг харна
  let opened='';const ow=window.open;window.open=u=>{opened=u;return {}};
  openSheets();window.open=ow;
  // Холбоос солиход хуучин шийтийн хаяг үлдэж болохгүй (өөр хүснэгт байж болно)
  document.getElementById('shUrl').value='https://script.google.com/macros/s/FFF/exec';
  const p=saveSheetCfg(true);
  await new Promise(r=>setTimeout(r,60));
  const i=document.getElementById('shPin');if(i)i.value='861145';
  document.getElementById('shPinOk').click();await p;
  const afterSwap=localStorage.getItem(SH_OPEN);
  localStorage.removeItem(SH_KEY);localStorage.removeItem(SH_OPEN);
  return {stored,opened,afterSwap}});
ok('Скриптийн буцаасан шийтийн холбоос хадгалагдана',
   /gid=777/.test(String(gid.stored)),String(gid.stored));
ok('"Sheets нээх" тэр шийт рүү шууд ордог',
   /gid=777/.test(String(gid.opened)),String(gid.opened));
ok('Холбоос солиход хуучин шийтийн хаяг хаягдана',
   !gid.afterSwap,String(gid.afterSwap));

/* ══ АВТОМАТ ШИНЭЧЛЭЛТ ═══════════════════════════════════════
   "5 сек тутам" боломжгүй (Apps Script өдөрт 90 мин) тул 60 сек
   тутам шалгаад ӨӨРЧЛӨГДСӨН үед л илгээдэг. Энэ тест нь эрх дэмий
   зарцуулагдахгүйг, мөн эвдэрсэн үед өөрөө унтрахыг батална. */
const auto=await page.evaluate(async()=>{
  const out={};
  localStorage.removeItem(SH_AUTO_KEY);
  shAutoStop();
  out.defOff=!shAutoOn();
  shAutoStart();out.noTimer=(_shTimer===null);

  // Товч — цонх нээхэд одоогийн төлөвөө харуулах ёстой
  openSheetCfg();closeModal('sheetCfgModal');
  out.lblOff=document.getElementById('shAutoBtn').textContent;
  shAutoToggle();
  out.on=shAutoOn();out.lblOn=document.getElementById('shAutoBtn').textContent;
  out.hasTimer=(_shTimer!==null);
  out.ms=SH_AUTO_MS;
  shAutoSet(false);out.offAgain=!shAutoOn()&&_shTimer===null;
  return out});
ok('Автомат анхнаасаа унтраалттай',auto.defOff&&auto.noTimer);
ok('Унтраалттай үед товч тэрийг харуулна',/унтраалттай/.test(auto.lblOff),auto.lblOff);
ok('Асаахад цаг эхэлж, товч өөрчлөгдөнө',
   auto.on&&auto.hasTimer&&/АСААЛТТАЙ/.test(auto.lblOn),auto.lblOn);
ok('Давтамж 5 сек биш — Apps Script-ийн эрх хүрэхгүй',auto.ms>=60000,auto.ms+' мс');
ok('Унтраахад цаг зогсоно',auto.offAgain);

/* Хамгийн чухал нь: өгөгдөл өөрчлөгдөөгүй бол сүлжээ рүү ОГТ хандахгүй */
const tick=await page.evaluate(async()=>{
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/GGG/exec');
  localStorage.setItem(SH_AUTO_KEY,'1');
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  _shHash='';_shFail=0;_shBusy=false;
  // shAutoTick нь _adminLoadAll-ыг дахин дууддаг — үүлгүйгээр хуурна
  const oL=window._adminLoadAll;window._adminLoadAll=async()=>_adminData;
  // Өөр дэлгэц идэвхтэй бол querySelector түүнийг олно — тиймээс бүгдийг
  // түр унтрааж, зөвхөн админыг идэвхжүүлнэ
  const av=document.getElementById('adminView');
  const prev=[...document.querySelectorAll('.view.active')];
  prev.forEach(v=>v.classList.remove('active'));av.classList.add('active');
  let n=0;const of=window.fetch;
  window.fetch=()=>{n++;return Promise.resolve({text:()=>Promise.resolve('{"ok":true}')})};
  const ot=window.showToast;window.showToast=()=>{};

  await shAutoTick();const first=n;          // өөрчлөлт БАЙГАА (анхны илгээлт)
  await shAutoTick();const second=n-first;   // өөрчлөлт АЛГА
  // Нэг дэрийг тэнцэхгүй болгоод дахин — одоо илгээх ёстой
  DB.folders[0].tracks[0].sections[0].sleepers[30].type='bad';
  await shAutoTick();const third=n-first;

  // Админ дэлгэц хаагдсан үед ажиллах нь Firestore-ын уншилтыг дэмий үрнэ
  av.classList.remove('active');
  DB.folders[0].tracks[0].sections[0].sleepers[31].type='bad';
  await shAutoTick();const offView=n-first-third;
  prev.forEach(v=>v.classList.add('active'));

  window.fetch=of;window.showToast=ot;window._adminLoadAll=oL;
  localStorage.removeItem(SH_KEY);localStorage.removeItem(SH_AUTO_KEY);
  shAutoStop();
  const secs=_shHit().map(({code,db,folder})=>
    _sectionBlocks(code,db,folder,_shSwFolder(db,folder)));
  const nForms=SH_FORMS.filter((F,fi)=>_formSheet(fi,secs).rows.length).length;
  return {first,second,third,offView,nForms}});
ok('Эхний удаад бүх маягтыг илгээнэ',tick.first===tick.nForms,tick.first+'/'+tick.nForms);
ok('Өгөгдөл өөрчлөгдөөгүй бол сүлжээ рүү хандахгүй',tick.second===0,tick.second+' хүсэлт');
ok('Өөрчлөгдвөл дахин илгээнэ',tick.third===tick.nForms,tick.third+' хүсэлт');
ok('Админ дэлгэц хаалттай бол илгээхгүй',tick.offView===0,tick.offView+' хүсэлт');

/* CLAUDE.md 6-р дүрэм — 3 удаа алдвал өөрөө унтарна */
const die=await page.evaluate(async()=>{
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/HHH/exec');
  localStorage.setItem(SH_AUTO_KEY,'1');
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  _shHash='';_shFail=0;_shBusy=false;
  const oL=window._adminLoadAll;window._adminLoadAll=async()=>_adminData;
  const av=document.getElementById('adminView');
  const prev=[...document.querySelectorAll('.view.active')];
  prev.forEach(v=>v.classList.remove('active'));av.classList.add('active');
  const of=window.fetch;window.fetch=()=>Promise.reject(new TypeError('Failed to fetch'));
  const oe=console.error,ow=console.warn;console.error=()=>{};console.warn=()=>{};
  const ot=window.showToast;window.showToast=()=>{};
  const st=[];
  for(let i=0;i<3;i++){await shAutoTick();st.push(shAutoOn())}
  window.fetch=of;console.error=oe;console.warn=ow;window.showToast=ot;
  window._adminLoadAll=oL;
  av.classList.remove('active');prev.forEach(v=>v.classList.add('active'));
  localStorage.removeItem(SH_KEY);localStorage.removeItem(SH_AUTO_KEY);
  shAutoStop();
  return {st,timer:_shTimer===null}});
ok('1-2 дахь алдаанд үргэлжилнэ',die.st[0]&&die.st[1],JSON.stringify(die.st));
ok('3 удаа алдвал өөрөө унтарна',die.st[2]===false&&die.timer,JSON.stringify(die.st));

/* Он/улирал сонгоход шууд илгээнэ — админ юу харж байна, Sheet дээр тэр */
const sel=await page.evaluate(async()=>{
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/III/exec');
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  _shHash='';_shBusy=false;
  let n=0;const of=window.fetch;
  window.fetch=()=>{n++;return Promise.resolve({text:()=>Promise.resolve('{"ok":true}')})};
  const ot=window.showToast;window.showToast=()=>{};
  await shPushForSelection();const sent=n;
  // Холбоосгүй бол чимээгүй өнгөрнө (алдаа биш)
  localStorage.removeItem(SH_KEY);_shHash='';
  await shPushForSelection();const noUrl=n-sent;
  window.fetch=of;window.showToast=ot;
  const secs=_shHit().map(({code,db,folder})=>
    _sectionBlocks(code,db,folder,_shSwFolder(db,folder)));
  const nForms=SH_FORMS.filter((F,fi)=>_formSheet(fi,secs).rows.length).length;
  return {sent,noUrl,nForms}});
ok('Он/улирал сонгоход бүх маягт илгээгдэнэ',sel.sent===sel.nForms,sel.sent+'/'+sel.nForms);
ok('Холбоосгүй бол чимээгүй өнгөрнө',sel.noUrl===0,sel.noUrl+' хүсэлт');

/* Автомат илгээхэд админы дэлгэц ч шинэчлэгдэх ёстой — Sheet дээр шинэ,
   дэлгэц дээр хуучин тоо байж болохгүй. Өөрчлөлтгүй үед дахин зурахгүй. */
const rr=await page.evaluate(async()=>{
  localStorage.setItem(SH_KEY,'https://script.google.com/macros/s/JJJ/exec');
  localStorage.setItem(SH_AUTO_KEY,'1');
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  _shHash='';_shFail=0;_shBusy=false;
  const oL=window._adminLoadAll;window._adminLoadAll=async()=>_adminData;
  const oR=window.renderAdminSections;let n=0;window.renderAdminSections=d=>{n++;return oR(d)};
  const av=document.getElementById('adminView');
  const prev=[...document.querySelectorAll('.view.active')];
  prev.forEach(v=>v.classList.remove('active'));av.classList.add('active');
  const of=window.fetch;
  window.fetch=()=>Promise.resolve({text:()=>Promise.resolve('{"ok":true}')});
  const ot=window.showToast;window.showToast=()=>{};
  await shAutoTick();const first=n;
  await shAutoTick();const same=n-first;
  window.fetch=of;window.showToast=ot;window._adminLoadAll=oL;window.renderAdminSections=oR;
  av.classList.remove('active');prev.forEach(v=>v.classList.add('active'));
  localStorage.removeItem(SH_KEY);localStorage.removeItem(SH_AUTO_KEY);
  shAutoStop();
  return {first,same}});
ok('Автомат илгээхэд админы дэлгэц дахин зурагдана',rr.first===1,rr.first+' удаа');
ok('Өөрчлөлтгүй бол дэлгэцийг дахин зурахгүй',rr.same===0,rr.same+' удаа');

/* Гарахад цаг зогсох ёстой — эс тэгвэл нэвтрэх дэлгэц дээр минут тутам
   ажилласаар байна */
const lo=await page.evaluate(async()=>{
  localStorage.setItem(SH_AUTO_KEY,'1');shAutoStart();
  const had=_shTimer!==null;
  window.appConfirm=()=>Promise.resolve(true);
  await doLogout();
  localStorage.removeItem(SH_AUTO_KEY);
  return {had,after:_shTimer===null,view:(document.querySelector('.view.active')||{}).id}});
ok('Гарахад автомат цаг зогсоно',lo.had&&lo.after&&lo.view==='loginView',JSON.stringify(lo));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
