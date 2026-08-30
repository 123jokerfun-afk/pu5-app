/* ══════════════════════════════════════════════════════════════
   ЭКСПОРТЫН АГУУЛГА

   exp.js бол "файл гарсан уу" гэдгийг шалгана. Энэ нь гарсан
   файлыг ExcelJS-ээр Node дээр БУЦААЖ уншиж, тоо нь зөв эсэхийг
   шалгана. ПУ-5 дэвтэр бол хуулийн бичиг баримт тул тоо буруу
   гарах нь файл гарахгүй байхаас хамаагүй аюултай.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
let ExcelJS=null;try{ExcelJS=require('exceljs')}catch(e){
  try{ExcelJS=require('./node_modules/exceljs')}catch(e2){}}
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const near=(a,b)=>Math.abs((a||0)-(b||0))<1e-9;
// Нэгтгэсэн нүд давтагдаж уншигддаг тул зөвхөн утгыг нь авна
const V=r=>(r.values||[]).map(x=>x&&x.richText?x.richText.map(t=>t.text).join(''):x);

if(!ExcelJS){console.log('  ⚠ exceljs алга — алгасав');console.log('SUMMARY 0/0');process.exit(0)}

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

await page.evaluate(()=>{
  window.appConfirm=()=>Promise.resolve(true);
  window.__b64=null;
  window.dlBlob=function(blob,name){
    return new Promise(r=>{const fr=new FileReader();
      fr.onload=()=>{window.__b64={name,d:String(fr.result).split(',')[1]};r()};
      fr.readAsDataURL(blob)})};
});

// ── Мэдэгдэж буй өгөгдөл ────────────────────────────────────
// 1-р зам: s1 46 дэр, 4 тэнцэхгүй (3,4,5 дараалсан + 20)
//          s2 46 дэр, 3 тэнцэхгүй (10,11,12 дараалсан)
// 2-р зам: s3 46 дэр, 5 тэнцэхгүй (1..5 дараалсан)
// Гол зам: км 12, 46 дэр, 3 тэнцэхгүй
// Сум 1, 3: 84 үүрнээс 4 нь рам зам → 80 дүнз, 5 тэнцэхгүй (3 м тус бүр)
await page.evaluate(()=>{
  const mkSec=(id,n,bad)=>({id,type:'normal',label:id+' үе',note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},(_,i)=>({type:bad.includes(i)?'bad':'normal',ts:0}))});
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  DB.folders=[{id:'fx',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[
      {id:'t1',num:1,kind:'station',sections:[mkSec('s1',46,[3,4,5,20]),mkSec('s2',46,[10,11,12])]},
      {id:'t2',num:2,kind:'station',sections:[mkSec('s3',46,[1,2,3,4,5])]}]}];
  activeFolderId='fx';DB.tracks=DB.folders[0].tracks;
  DB.main=[{id:'km12',num:12,kind:'main',mat:'tbd',fast:'CZ',sections:[mkSec('m1',46,[7,8,9])]}];
  let it='';for(let i=0;i<84;i++)it+=[5,6,7,20,21].includes(i)?'b':'n';
  DB.sw=[{id:'sf',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,station:'Шивээговь',mak:'Р-65',mark:'1/11',proj:'2764',head:4,it},
              {id:'w2',num:3,station:'Шивээговь',mak:'Р-65',mark:'1/11',proj:'2764',head:4,it}]}];
  swFolderId='sf';saveDB();
});

async function grab(call){
  await page.evaluate(async s=>{window.__b64=null;await new Function('return ('+s+')')()},call);
  await page.waitForFunction(()=>window.__b64,{timeout:40000});
  const r=await page.evaluate(()=>window.__b64);
  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(r.d,'base64'));
  return {wb,name:r.name}
}

/* ══ 1. ПУ-5 дэвтэр — паспорт ══════════════════════════════ */
console.log('\nПУ-5 дэвтэр (паспорт)');
{
  const {wb}=await grab("exportPu5Book('folder')");
  const names=wb.worksheets.map(w=>w.name);
  ok('Хуудсууд бүрэн',names[0]==='Нийт дүн'&&names.includes('1-р зам')&&names.includes('2-р зам'),names.join(' | '));

  const ws=wb.getWorksheet('Нийт дүн');
  const HD=['Зам №','Үе / Холбох','Нийт','Модон эпюр','Хэвийн','Тэнцэхгүй','ТБД','Тэнцэхгүй ТБД','Нийт тэнцэхгүй','Хувь %'];
  ok('Толгой мөр яг тохирно',JSON.stringify(V(ws.getRow(2)).slice(1))===JSON.stringify(HD),V(ws.getRow(2)).slice(1).join('|'));

  const row=i=>V(ws.getRow(i)).slice(1);
  const r3=row(3),r4=row(4),r5=row(5),r7=row(7),r8=row(8);
  ok('s1 үе: 46 дэр, 42 хэвийн, 4 тэнцэхгүй',
     r3[2]===46&&r3[4]===42&&r3[5]===4&&r3[8]===4&&near(r3[9],4/46),JSON.stringify(r3));
  ok('s2 үе: 46 дэр, 43 хэвийн, 3 тэнцэхгүй',
     r4[2]===46&&r4[4]===43&&r4[5]===3&&r4[8]===3,JSON.stringify(r4));
  ok('1-р замын НИЙТ = үеүүдийн нийлбэр (92/85/7)',
     /НИЙТ/.test(String(r5[0]))&&r5[2]===92&&r5[4]===85&&r5[8]===7&&near(r5[9],7/92),JSON.stringify(r5));
  ok('s3 үе: 46 дэр, 41 хэвийн, 5 тэнцэхгүй',
     r7[2]===46&&r7[4]===41&&r7[5]===5&&r7[8]===5,JSON.stringify(r7));
  ok('2-р замын НИЙТ (46/41/5)',
     /НИЙТ/.test(String(r8[0]))&&r8[2]===46&&r8[8]===5,JSON.stringify(r8));

  // Тогтмол хамаарал БҮХ мөрөнд
  let bad=[];
  ws.eachRow((rw,i)=>{
    if(i<3)return;const v=V(rw).slice(1);
    if(typeof v[2]!=='number')return;
    const [,,tot,,norm,badw,tbd,badt,badAll,pct]=v;
    if(norm+badw+tbd+badt!==tot)bad.push('мөр'+i+': нийлбэр '+(norm+badw+tbd+badt)+'≠'+tot);
    if(badw+badt!==badAll)bad.push('мөр'+i+': нийт тэнцэхгүй буруу');
    if(tot&&!near(pct,badAll/tot))bad.push('мөр'+i+': хувь буруу');
  });
  ok('Бүх мөрөнд Хэвийн+Тэнцэхгүй+ТБД=Нийт, хувь зөв',bad.length===0,bad.slice(0,3).join('; '));

  // Дэрийн торон хуудас — "—" яг тэнцэхгүй байрлалд
  const g=wb.worksheets.find(w=>/^1з/.test(w.name));
  ok('1-р замын торон хуудас байна',!!g,g&&g.name);
  if(g){
    const marks=[];
    for(let i=4;i<=49;i++){const v=V(g.getRow(i));if(v[2]==='—')marks.push(v[1])}
    ok('s1-ийн "—" тэмдэг яг 4,5,6,21 дэр дээр',JSON.stringify(marks)==='[4,5,6,21]',JSON.stringify(marks));
  }

  // Дараалсан судалгаа
  const c=wb.getWorksheet('Дараалсан судалгаа');
  ok('Дараалсан судалгаа хуудас байна',!!c);
  if(c){
    let tot=null;
    c.eachRow(rw=>{const v=V(rw).slice(1);if(/НИЙТ/.test(String(v[0]))&&/Шивээговь/.test(String(v[0])))tot=v});
    // [хэсэг, '', дараалал тоо, '', ш тоо, 3ш, 4ш, 5+ш, дамнасан]
    ok('Нийт 3 дараалал, 8 дэр, 3ш×2, 5+ш×1',
       tot&&tot[2]===3&&tot[4]===3&&tot[5]===2&&tot[6]===0&&tot[7]===1,JSON.stringify(tot));
  }
}

/* ══ 2. ПУ-5 дэвтэр — гол зам ══════════════════════════════ */
console.log('\nПУ-5 дэвтэр (гол зам)');
{
  const {wb}=await grab("exportPu5Book('main')");
  const ws=wb.getWorksheet('Нийт дүн');
  let hit=null;
  ws.eachRow((rw,i)=>{if(i>=3){const v=V(rw).slice(1);if(v[2]===46&&hit===null)hit=v}});
  ok('Гол замын км: 46 дэр, 3 тэнцэхгүй',hit&&hit[2]===46&&hit[5]===3&&hit[8]===3,JSON.stringify(hit));
  ok('Гол замд өртөөний зам ОРООГҮЙ',
     !wb.worksheets.some(w=>/^(1|2)-р зам$/.test(w.name)),wb.worksheets.map(w=>w.name).join(' | '));
}

/* ══ 3. Маягт-1 (өнгөт Excel) ══════════════════════════════ */
console.log('\nМаягт-1');
{
  const {wb}=await grab('exportColoredExcel()');
  const st=wb.worksheets.find(w=>/1-3/.test(w.name));
  ok('Маягт 1-3 (өртөө) хуудас байна',!!st,wb.worksheets.map(w=>w.name).join(' | '));
  if(st){
    const rows=[];
    st.eachRow((rw,i)=>{if(i>=8){const v=V(rw).slice(1);if(typeof v[2]==='number')rows.push(v)}});
    // [хэсэг, өртөө, зам№, нийт(томьёо), модон, бетон, тэнцэхгүй нийт, модон, бетон, ...]
    ok('Өртөөний 2 зам бичигдсэн',rows.length===2,rows.length+' мөр');
    ok('1-р зам: 92 модон эпюр, 7 тэнцэхгүй',rows[0]&&rows[0][4]===92&&rows[0][6]===7,JSON.stringify(rows[0]&&rows[0].slice(0,9)));
    ok('2-р зам: 46 модон эпюр, 5 тэнцэхгүй',rows[1]&&rows[1][4]===46&&rows[1][6]===5,JSON.stringify(rows[1]&&rows[1].slice(0,9)));
  }
  const main=wb.worksheets[0];
  let mr=null;main.eachRow((rw,i)=>{if(i>=9&&mr===null){const v=V(rw).slice(1);if(typeof v[1]==='number')mr=v}});
  ok('Гол замын мөр: км 12, 46 дэр, 3 тэнцэхгүй',mr&&mr[1]===12&&mr[2]===46&&mr[5]===3,JSON.stringify(mr&&mr.slice(0,9)));
}

/* ══ 4. Маягт-2 (сумын дүнз) ═══════════════════════════════ */
console.log('\nМаягт-2 (дүнз)');
{
  const {wb}=await grab('exportSwForms()');
  const ws=wb.worksheets[0];
  const rows=[];
  ws.eachRow((rw,i)=>{if(i>=9){const v=V(rw).slice(1);if(typeof v[1]==='number')rows.push(v)}});
  ok('2 сум бичигдсэн',rows.length===2,rows.length+' мөр');
  // [хэсэг, сум№, нийт дүнз, тэнцэхгүй ш, пог/м, ...]
  ok('Сум 1: 80 дүнз (84 үүр − 4 рам зам), 5 тэнцэхгүй, 15 пог/м',
     rows[0]&&rows[0][2]===80&&rows[0][3]===5&&rows[0][4]===15,JSON.stringify(rows[0]&&rows[0].slice(0,6)));
  ok('Сум 3-ын дугаар зөв',rows[1]&&rows[1][1]===3,JSON.stringify(rows[1]&&rows[1].slice(0,3)));

  // Нийт мөрийн томьёо БҮХ сумыг хамрах ёстой (1 сум байхад л зөв
  // байгаад олон сум дээр эхнийхийг нь л хардаг байх эрсдэлтэй)
  const a1=wb.worksheets.find(w=>/1\.1/.test(w.name));
  ok('Хавсралт-1.1 байна',!!a1,wb.worksheets.map(w=>w.name).join(' | '));
  if(a1){
    let tot=null;
    a1.eachRow(rw=>{const v=V(rw).slice(1);
      if(/Нийт/.test(String(v[1]))&&/Тэнцэхгүй/.test(String(v[3]))&&tot===null)tot=v});
    const f=tot&&tot[4]&&tot[4].formula;
    ok('Нийт мөр БҮХ сумын мөрийг нэмнэ',/\+/.test(String(f)),String(f));
  }
  const nm=wb.worksheets.map(w=>w.name);
  ok('Хуудасны нэр давхардаагүй (Excel дээр ялгаж болно)',
     new Set(nm.map(x=>x.trim())).size===nm.length,nm.join(' | '));
}

/* ══ 5. Админы нэгтгэл ═════════════════════════════════════
   v94-өөс хойш бичилт зөвхөн parts руу ордог. Админ хуучин
   баримтын `db`-ээс уншсаар байвал ПЧ-ийн нэгтгэл ХООСОН гарна. */
console.log('\nАдмины нэгтгэл');
{
  // Одоогийн өгөгдлийг үүлэнд бичээд, хуучин баримтыг архивлана
  await page.evaluate(async()=>{
    _clearPartHashes();
    await _writeParts(_packDB(DB));
    await fbDb.collection('sections').doc('ПД-6').set({archivedAt:Date.now()});
  });
  const {wb}=await grab('adminExportExcel()');
  const ws=wb.getWorksheet('Нэгтгэл');
  ok('Нэгтгэл хуудас гарсан',!!ws,wb.worksheets.map(w=>w.name).join(' | '));
  if(ws){
    let row=null;
    ws.eachRow((rw,i)=>{if(i>=3&&row===null){const v=V(rw).slice(1);
      if(/ПД-6/i.test(String(v[0])))row=v}});
    // [хэсэг, паспорт, зам тоо, нийт дэр, хэвийн, тэнцэхгүй, ТБД, хувь]
    ok('ПД-6 хэсгийн тоо parts-аас зөв уншигдсан',
       row&&row[3]===138&&row[5]===12,JSON.stringify(row));
  }
}

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
