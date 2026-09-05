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
  let it='nn';for(let i=0;i<68;i++)it+=[0,1,2,19].includes(i)?'b':'n';
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

/* ── Sheet-ийн мөрүүд ── */
const sh=await page.evaluate(()=>{
  const db=DB,folder=DB.folders[0];
  const before={dbLoc:DB.location,fid:activeFolderId,sw:swFolderId};
  const out=_sheetRowsFor('ПД-6',db,folder,_shSwFolder(db,folder));
  const rows=out.rows;
  return {rows,fmt:out.fmt,before,after:{dbLoc:DB.location,fid:activeFolderId,sw:swFolderId},gap:SH_GAP}
});

/* ══ 1. Бүтэц ══════════════════════════════════════════════ */
console.log('\nБүтэц');
const titles=sh.rows.map((r,i)=>({i,t:(r&&r.length===1)?String(r[0]):''}))
  .filter(x=>/^Маягт-/.test(x.t));
ok('7 маягт байрлав',titles.length===7,titles.map(x=>x.t.split('—')[0].trim()).join(' | '));
const want=['Маягт-1 —','Маягт-1 Хавсралт-3','Маягт-1 Хавсралт-2','Маягт-1 Хавсралт-4',
  'Маягт-2 —','Маягт-2 Хавсралт-1.1','Маягт-2 Хавсралт-1 '];
ok('Дараалал Excel-ийнхтэй ижил',
   titles.every((x,i)=>x.t.indexOf(want[i])===0),titles.map(x=>x.t.slice(0,22)).join(' | '));

// Гарчиг бүрийн ӨМНӨ яг 4 хоосон мөр (эхнийхээс бусад)
const gaps=titles.slice(1).map(x=>{
  let n=0;for(let i=x.i-1;i>=0&&(!sh.rows[i]||!sh.rows[i].length);i--)n++;
  return n});
ok(`Маягт хооронд яг ${sh.gap} хоосон мөр`,
   sh.gap===4&&gaps.every(n=>n===4),JSON.stringify(gaps));
ok('Толгойд хэсэг, он, улирал бичигдэнэ',
   /ПД-6/.test(sh.rows[0][0])&&/2026/.test(sh.rows[0][0])&&/хавар/.test(sh.rows[0][0]),
   String(sh.rows[0][0]));
ok('Сонгосон улирлын дүнзний паспортыг л авна',
   /Хавар 2026 сум/.test(String(sh.rows[1][0]))&&!/Намар/.test(String(sh.rows[1][0])),
   String(sh.rows[1][0]));
ok('Мөр бүр массив, 40 баганаас хэтрэхгүй',
   sh.rows.every(r=>Array.isArray(r)&&r.length<=40),
   'хамгийн урт '+Math.max(...sh.rows.map(r=>r.length)));
/* Эх маягтын хоёр мөрт толгой, хүрээ, нэгтгэлийн заавар */
ok('Маягт бүрд хэлбэрийн заавар дагалдана',
   sh.fmt&&sh.fmt.length===7,String(sh.fmt&&sh.fmt.length));
ok('Толгой бүр 2 мөр',
   sh.fmt.every(f=>f.head===2),JSON.stringify(sh.fmt.map(f=>f.head)));
ok('Нэгтгэлүүд хүснэгтийн баганаас халихгүй',
   sh.fmt.every(f=>(f.merges||[]).every(m=>m[1]>=1&&m[1]+m[3]-1<=f.cols)),
   'багана: '+JSON.stringify(sh.fmt.map(f=>f.cols)));
ok('Нэгтгэл толгойн хоёр мөрийн дотор л байна',
   sh.fmt.every(f=>(f.merges||[]).every(m=>m[0]>=f.row&&m[0]+m[2]-1<=f.row+1)),
   'зөв');
ok('_withSection глобалыг сэргээв',
   JSON.stringify(sh.before)===JSON.stringify(sh.after),JSON.stringify(sh.after));

// Блок бүрийн мөрүүд. Толгой одоо ХОЁР мөр (эх маягтын нэгтгэсэн
// бүтэц) тул хоёр дахийг нь алгасаж, [0]=толгой, [1..]=өгөгдөл болгоно —
// доорх шалгалтуудын индекс хэвээр үлдэнэ.
const block=k=>{
  const st=titles[k].i+1;const out=[sh.rows[st]];
  for(let i=st+2;i<sh.rows.length;i++){
    if(!sh.rows[i]||!sh.rows[i].length)break;
    out.push(sh.rows[i])}
  return out};
// Толгой 2 мөр болсон тул өгөгдөл 3 дахь мөрөөс эхэлнэ (0,1 = толгой)
const F1=block(0),F13=block(1),F12=block(2),F14=block(3),F2=block(4),A11=block(5),A1=block(6);
// Хүрээ нь толгойн 2 мөр + өгөгдлийн бүх мөрийг хамрах ёстой
ok('Хүрээний муж толгой+өгөгдлийг бүрэн хамарна',
   sh.fmt.every((f,i)=>f.n===2+[F1,F13,F12,F14,F2,A11,A1][i].length-1),
   JSON.stringify(sh.fmt.map(f=>f.n)));
ok('Маягт-1-ийн толгой эх загварынхтай ижил',
   String(F1[0][2])==='Дэрийн эпюр'&&String(F1[0][5])==='Тэнцэхгүй дэрийн тоо'
   &&String(F1[0][17])==='Тухайн онд солигдсон дэрийн тоо',
   JSON.stringify([F1[0][2],F1[0][5],F1[0][17]]));
ok('Дүнгийн мөрүүд бүдүүн болно',
   sh.fmt[0].bold.length===1&&sh.fmt[6].bold.length===3,
   JSON.stringify(sh.fmt.map(f=>f.bold.length)));


/* ══ 2. Дэрийн маягтууд — Excel-тэй тулгах ══════════════════ */
console.log('\nДэрийн маягт (Excel-тэй тулгав)');
const wb=await grab('exportColoredExcel()');
const xM1=wb.getWorksheet('дэр ПО-6 маягт-1 ');
const xM13=wb.getWorksheet('Маягт 1-3 өртөө ПО-6');
const xM12=wb.getWorksheet('маягт1-2');
const xM14=wb.getWorksheet('Маягт 1-4 өртөө-сийрэгжилт');
ok('Excel-ийн 4 маягт олдов',!!(xM1&&xM13&&xM12&&xM14));

// Маягт-1 — гол зам, км 12 (Excel 9-р мөр). C..H, K..S шууд бичигдсэн
{
  const x=V(xM1.getRow(9)),s=F1[1];        // F1[0] = толгой мөр
  const map=[[3,2],[4,3],[5,4],[6,5],[7,6],[8,7],   // C-H → нийт..тэнц бетон
             [11,10],[12,11],[13,12],[14,13],[15,14],[16,15],[17,16],[18,17],[19,18]];
  const bad=map.filter(([c,j])=>!eq(z(x[c]),z(s[j])));
  ok('Маягт-1: км 12-ийн бүх тоо Excel-тэй ижил',!bad.length,
     bad.map(([c,j])=>`багана ${c}: ${x[c]} ≠ ${s[j]}`).join('; '));
  ok('Маягт-1: км дугаар',eq(x[2],s[1]),`${x[2]} / ${s[1]}`);
  ok('Маягт-1: сүүлийн мөр нийт дүн',String(F1[F1.length-1][0])==='Нийт дүн',
     String(F1[F1.length-1][0]));
}
// Хавсралт-3 — өртөөний 2 зам (Excel 8, 9-р мөр)
{
  const map=[[5,4],[6,5],[7,6],[8,7],[9,8],
             [11,10],[12,11],[13,12],[14,13],[15,14],[16,15],[17,16],[18,17],[19,18]];
  let bad=[];
  [0,1].forEach(k=>{
    const x=V(xM13.getRow(8+k)),s=F13[1+k];
    map.forEach(([c,j])=>{if(!eq(z(x[c]),z(s[j])))bad.push(`зам${k+1} багана${c}: ${x[c]}≠${s[j]}`)});
    if(!eq(x[3],s[2]))bad.push(`зам${k+1} дугаар ${x[3]}≠${s[2]}`)
  });
  ok('Хавсралт-3: 2 замын бүх тоо Excel-тэй ижил',!bad.length,bad.join('; '));
  const tot=F13[F13.length-1];
  ok('Хавсралт-3: Нийт мөр модон+бетоны нийлбэр',
     eq(tot[3],(+tot[4]||0)+(+tot[5]||0)),`${tot[3]} vs ${tot[4]}+${tot[5]}`);
}
// Хавсралт-2 — 25%+ үе (Excel 7-р мөрөөс)
{
  const x=V(xM12.getRow(7)),s=F12[1];
  ok('Хавсралт-2: ганц үе олдов (s4)',F12.length===3,
     `${F12.length-1} мөр: ${F12.slice(1).map(r=>r[3]).join(', ')}`);
  ok('Хавсралт-2: үеийн нэр Excel-тэй ижил',String(x[4])===String(s[3]),`${x[4]} / ${s[3]}`);
  ok('Хавсралт-2: эпюр ба тэнцэхгүй Excel-тэй ижил',
     eq(x[5],s[4])&&eq(x[6],s[5]),`${x[5]}/${s[4]} · ${x[6]}/${s[5]}`);
  // 'Нийт дэр' нь Excel-ийн томъёоны туслах багана — эх загварт байхгүй
  ok('Хавсралт-2: "Нийт дэр" багана байхгүй',
     F12[0].length===11&&F12[0].indexOf('Нийт дэр')<0,
     F12[0].length+' багана');
  ok('Хавсралт-2: сольсон 2 дэр, дугаар нь 3,6',
     eq(x[8],s[7])&&String(s[9])==='3,6',`${s[7]} · ${s[9]}`);
  ok('Хавсралт-2: эзлэх хувь 35.0 (эх байдлаар)',eq(s[6],35),String(s[6]));
  ok('Хавсралт-2: ганц зам бол "Бүгд" мөр давхардахгүй',
     String(F12[2][3])==='Нийт'&&F12.length===3,JSON.stringify(F12.map(r=>r[3])));
}
// Хавсралт-4 — сийрэгжилт (Excel 7-р мөрөөс)
{
  const x=V(xM14.getRow(7)),s=F14[1];
  ok('Хавсралт-4: сийрэгжилтийн ганц цэг',F14.length===2,`${F14.length-1} мөр`);
  ok('Хавсралт-4: үе, эпюр Excel-тэй ижил',
     String(x[4])===String(s[3])&&eq(x[5],s[4]),`${x[4]}/${s[3]} · ${x[5]}/${s[4]}`);
  ok('Хавсралт-4: 5 ба дээш дараалсан гэж тэмдэглэв',
     s[5]===''&&s[6]===''&&s[7]===1,JSON.stringify(s.slice(5,8)));
  ok('Хавсралт-4: сольсон 1 дэр, дугаар 3',eq(s[10],1)&&String(s[11])==='3',
     `${s[10]} · ${s[11]}`);
}

/* ══ 3. Дүнзний маягтууд — Excel-тэй тулгах ════════════════ */
console.log('\nДүнзний маягт (Excel-тэй тулгав)');
const wb2=await grab('exportSwForms()');
const xS2=wb2.getWorksheet('дүнз ПО-6-маягт-2');
const xA1=wb2.getWorksheet('тэнцэхгүй дүнз маягт 2-1');
const xA11=wb2.getWorksheet('тэнцэхгүй дүнз маягт 2-1.1');
ok('Excel-ийн 3 дүнзний маягт олдов',!!(xS2&&xA1&&xA11));
{
  // Маягт-2: C, D, E, G..K, M шууд бичигдсэн (F, L томъёо)
  const map=[[3,2],[4,3],[5,4],[7,6],[8,7],[9,8],[10,9],[11,10],[13,12]];
  let bad=[];
  [0,1].forEach(k=>{
    const x=V(xS2.getRow(9+k)),s=F2[1+k];
    map.forEach(([c,j])=>{if(!eq(z(x[c]),z(s[j])))bad.push(`сум${k+1} багана${c}: ${x[c]}≠${s[j]}`)})
  });
  ok('Маягт-2: 2 сумын бүх тоо Excel-тэй ижил',!bad.length,bad.join('; '));
  const s=F2[1];
  ok('Маягт-2: нийт 68 дүнз, 255.75 пог/м',eq(s[2],68)&&eq(s[12],255.75),`${s[2]} · ${s[12]}`);
  ok('Маягт-2: тэнцэхгүй 4 ш / 12.25 пог/м',eq(s[3],4)&&eq(s[4],12.25),`${s[3]} · ${s[4]}`);
  ok('Маягт-2: 3 зэрэгцсэн цэг 1',eq(s[6],1),String(s[6]));
  ok('Маягт-2: солигдсон 1 ш / 3 пог/м',eq(s[9],1)&&eq(s[10],3),`${s[9]} · ${s[10]}`);
  ok('Маягт-2: сольсны дараах хувь = (12.25-3)/255.75',eq(s[11],3.6),String(s[11]));
}
// Хавсралт-1 / 1.1 — E..O (урт тус бүрийн 11 багана) шууд бичигдсэн
{
  const chk=(xws,rows,nm)=>{
    let bad=[];
    for(let k=0;k<4;k++){                       // 2 сум × 2 мөр
      const x=V(xws.getRow(8+k)),s=rows[1+k];
      for(let c=5;c<=15;c++)if(!eq(z(x[c]),z(s[c-1])))
        bad.push(`${nm} мөр${k+1} багана${c}: ${x[c]}≠${s[c-1]}`)
    }
    return bad};
  const bad=chk(xA1,A1,'Х-1').concat(chk(xA11,A11,'Х-1.1'));
  ok('Хавсралт-1 ба 1.1: урт тус бүрийн тоо Excel-тэй ижил',!bad.length,bad.slice(0,3).join('; '));
  const f1=A1[A1.length-1],f11=A11[A11.length-1];
  ok('Хавсралт-1: доод мөр = тэнцэхгүй × урт, нийлбэр нь 24.5 пог/м',
     eq(f1[4],3*3*2)&&eq(f1[16],24.5),`${f1[4]} · ${f1[16]}`);
  ok('Хавсралт-1.1: доод мөр = тэнцэхгүй − сольсон',
     eq(f1[16]/2,12.25)&&eq(f11[4],6-2)&&eq(f11[5],2),`${f11[4]} · ${f11[5]}`);
  ok('Хавсралт-1: "Байгаа" мөр 68 ширхэг',eq(A1[1][15],68),String(A1[1][15]));
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
  _adminData=[{code:'ПД-6',db:DB}];_admYear='2026';_admSeason='хавар';
  document.getElementById('shUrl').value='https://script.google.com/macros/s/BBB/exec?t=861145';
  window.__posted=null;
  const of=window.fetch;
  window.fetch=(u,o)=>{window.__posted=u;window.__body=o&&o.body;return Promise.resolve(
    {text:()=>Promise.resolve(JSON.stringify({ok:true,tab:'X',rows:1}))})};
  window.appConfirm=()=>Promise.resolve(true);
  const pr=pushToSheets();
  await new Promise(r=>setTimeout(r,60));
  const i=document.getElementById('shPin');if(i)i.value='861145';
  document.getElementById('shPinOk').click();
  await pr;
  window.fetch=of;
  let tab='';try{tab=JSON.parse(window.__body).tab}catch(e){}
  return {saved:localStorage.getItem(SH_KEY),posted:window.__posted,tab:tab,
    open:document.getElementById('sheetCfgModal').classList.contains('open')}});
ok('Хадгалахгүйгээр илгээхэд холбоос өөрөө хадгалагдана',
   /BBB/.test(String(unsaved.saved)),String(unsaved.saved));
ok('Илгээлт үнэхээр явав (цонх дахин нээгдээгүй)',
   /BBB/.test(String(unsaved.posted))&&!unsaved.open,
   String(unsaved.posted)+' · цонх '+unsaved.open);
/* Хүснэгтэн дээр өөр скрипт "ПД-6" нэртэй шийт эзэмшиж байвал бид түүнийг
   цэвэрлээд дарж бичих байлаа — тусдаа нэр авснаар өгөгдөл үрэгдэхгүй */
ok('Шийтийн нэр "<КОД> маягт" — байгаа шийтийг дарж бичихгүй',
   / маягт$/.test(String(unsaved.tab)),String(unsaved.tab));

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
   cors.calls.length===2&&cors.calls[1]==='no-cors',JSON.stringify(cors.calls));
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

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
