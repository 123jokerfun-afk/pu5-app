/* ══════════════════════════════════════════════════════════════
   СОЛИГДСОН ДЭР / ДҮНЗНИЙ ЖАГСААЛТ — Excel экспорт

   "Солигдсон дэр" (replReportModal) ба "Сольсон дүнз" (swReplRepModal)
   цонхнуудад Excel татах товч нэмэгдэв. Гарсан файлыг ExcelJS-ээр
   буцааж уншиж, мөр мөрөөрөө collectRepl()/swReplRows()-той тулгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
let ExcelJS=null;try{ExcelJS=require('exceljs')}catch(e){
  try{ExcelJS=require('./node_modules/exceljs')}catch(e2){}}
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
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

// ── Дэр: 2 солигдсон дэр (1 энгийн, 1 сийрэгжилт) ──
await page.evaluate(()=>{
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  const s1={id:'s1',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',
    sleepers:Array.from({length:10},()=>({type:'normal',ts:0})),
    repl:{2:{d:'2026-06-10',t:'normal',m:'wood',o:1},5:{d:'2026-07-15',t:'tbd',m:'tbd',s:1,o:1}}};
  DB.folders=[{id:'fx',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'t1',num:1,kind:'station',sections:[s1]}]}];
  activeFolderId='fx';DB.tracks=DB.folders[0].tracks;
  DB.main=[];DB.sw=[];
  saveDB();
});

async function grab(call){
  await page.evaluate(async s=>{window.__b64=null;await new Function('return ('+s+')')()},call);
  await page.waitForFunction(()=>window.__b64,{timeout:20000});
  const r=await page.evaluate(()=>window.__b64);
  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(r.d,'base64'));
  return {wb,name:r.name}
}

{
  const {wb,name}=await grab('exportReplForm()');
  ok('Файлын нэрэнд "Солигдсон_дэр" орсон',/Солигдсон_дэр/.test(name),name);
  const ws=wb.getWorksheet('Дэр');
  ok('"Дэр" хуудас үүссэн',!!ws,String(!!ws));
  const HD=['Д/д','Зам','Үе','Дэрийн дугаар','Материал','Огноо','Сийрэгжилт'];
  ok('Толгой мөр тохирно',JSON.stringify(V(ws.getRow(5)).slice(1))===JSON.stringify(HD),
     JSON.stringify(V(ws.getRow(5)).slice(1)));
  const r1=V(ws.getRow(7)).slice(1),r2=V(ws.getRow(8)).slice(1);
  ok('1-р мөр: #3, Модон, 2026.06.10, сийрэгжилтгүй',
     r1[3]===3&&r1[4]==='Модон'&&r1[5]==='2026.06.10'&&!r1[6],JSON.stringify(r1));
  ok('2-р мөр: #6, ТБД, 2026.07.15, сийрэгжилттэй',
     r2[3]===6&&r2[4]==='ТБД'&&r2[5]==='2026.07.15'&&/тийм/.test(String(r2[6])),JSON.stringify(r2));
  const totRow=V(ws.getRow(9)).slice(1);
  ok('Нийт мөрөнд 2 дэр гэж бичигдэнэ',/2 дэр/.test(String(totRow[5])),JSON.stringify(totRow));
}

// ── Хоосон үед зохих зурвас гарна ──
await page.evaluate(()=>{DB.folders[0].tracks[0].sections[0].repl={};saveDB()});
const emptyToast=await page.evaluate(async()=>{
  let msg=null;const orig=window.showToast;window.showToast=(m)=>{msg=m;if(orig)return orig(m)};
  await exportReplForm();
  window.showToast=orig;return msg
});
ok('Хоосон үед татахгүй, зурвас гарна',/алга/.test(emptyToast||''),String(emptyToast));

// ── Дүнз: сумын паспортод 2 солигдсон дүнз ──
await page.evaluate(()=>{
  let it='';for(let i=0;i<12;i++)it+='n';
  DB.sw=[{id:'sf',name:'Зун 2026',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,mak:'Р-65',mark:'1/11',head:4,it,
      dRepl:{5:{d:'2026-06-20',L:3,o:1},9:{d:'2026-07-01',L:3.25,o:0}}}]}];
  swFolderId='sf';saveDB();
});
{
  const {wb,name}=await grab('exportSwReplForm()');
  ok('Файлын нэрэнд "Солигдсон_дүнз" орсон',/Солигдсон_дүнз/.test(name),name);
  const ws=wb.getWorksheet('Дүнз');
  ok('"Дүнз" хуудас үүссэн',!!ws,String(!!ws));
  const HD=['Д/д','Сум №','Сумын маяг','Марк','Дүнзний дугаар','Одоогийн урт, пог/м','Сольсон урт, пог/м','Огноо'];
  ok('Толгой мөр тохирно',JSON.stringify(V(ws.getRow(5)).slice(1))===JSON.stringify(HD),
     JSON.stringify(V(ws.getRow(5)).slice(1)));
  const r1=V(ws.getRow(7)).slice(1),r2=V(ws.getRow(8)).slice(1);
  ok('1-р мөр: сум 1, дүнз #2, 2026.06.20',
     r1[1]===1&&r1[4]===2&&r1[7]==='2026.06.20',JSON.stringify(r1));
  ok('2-р мөр: сум 1, дүнз #6, 2026.07.01',
     r2[1]===1&&r2[4]===6&&r2[7]==='2026.07.01',JSON.stringify(r2));
  const totRow=V(ws.getRow(9)).slice(1);
  ok('Нийт мөрөнд 2 ш гэж бичигдэнэ',/2 ш/.test(String(totRow[6])),JSON.stringify(totRow));
}

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
