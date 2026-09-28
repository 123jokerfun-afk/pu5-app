/* ══════════════════════════════════════════════════════════════
   ХОГИЙН САВ — паспорт устгах = устгах биш, ТЭМДЭГЛЭХ

   Өмнө нь deleteFolder()/delSwFolderById() нь DB.folders/DB.sw-с шууд
   ХАСДАГ байсан (мөн Firestore талд дараа тайлбарлах кэшийн алдаанаас
   болж заримдаа огт устдаггүй байсан). Одоо f.trashedAt тэмдэглэж,
   массивт ХЭВЭЭР үлдээж, 30 хоногийн дараа л ЖИНХЭНЭ устгана — устгаж
   сэргээхэд дотоод өгөгдөл (тракууд, дэр, сум) огт алдагдахгүй.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');

// ── Дэр: устгах → трэш → сэргээх ──
await page.evaluate(()=>{
  DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',
    tracks:[{id:'t1',num:1,kind:'station',sections:[{id:'s1',type:'normal',label:'1-р үе',
      sleepers:[{type:'normal',ts:0},{type:'bad',ts:0}]}]}]}];
  DB.main=[];DB.sw=[];
  saveDB();
});
const before=await page.evaluate(()=>JSON.stringify(DB.folders[0].tracks));
const del=await page.evaluate(async()=>{
  window.appConfirm=async()=>true;   // "Тийм" гэж автоматаар хариулна
  await deleteFolder('f1');
  return {active:derFolders().map(f=>f.id),raw:DB.folders.map(f=>({id:f.id,trashed:!!f.trashedAt}))}
});
ok('Устгасны дараа идэвхтэй жагсаалтаас алга',del.active.length===0,JSON.stringify(del.active));
ok('DB.folders дотор ХЭВЭЭР үлдэнэ (trashedAt тэмдэгтэй)',
   del.raw.length===1&&del.raw[0].id==='f1'&&del.raw[0].trashed,JSON.stringify(del.raw));
const afterTracks=await page.evaluate(()=>JSON.stringify(DB.folders[0].tracks));
ok('Дотоод өгөгдөл (тракууд/дэр) бүрэн хэвээр',before===afterTracks,'');

const trashList=await page.evaluate(()=>trashedItems().map(x=>({id:x.folder.id,kind:x.kind})));
ok('Хогийн саванд харагдана',trashList.length===1&&trashList[0].id==='f1'&&trashList[0].kind==='der',
   JSON.stringify(trashList));

const dl=await page.evaluate(()=>trashDaysLeft(DB.folders[0].trashedAt));
ok('Дөнгөж устсан бол ~30 хоног үлдэнэ',dl>=29&&dl<=30,String(dl));

const restored=await page.evaluate(()=>{
  restoreTrashItem('f1','der');
  return {active:derFolders().map(f=>f.id),trashed:!!DB.folders[0].trashedAt}
});
ok('Сэргээсний дараа идэвхтэй жагсаалтад буцна',restored.active.includes('f1'),JSON.stringify(restored));
ok('trashedAt арилна',restored.trashed===false,JSON.stringify(restored));
const afterRestoreTracks=await page.evaluate(()=>JSON.stringify(DB.folders[0].tracks));
ok('Сэргээсний дараа ч өгөгдөл бүрэн хэвээр',before===afterRestoreTracks,'');

// ── Дэр: бүр мөсөн устгах ──
const purged=await page.evaluate(async()=>{
  window.appConfirm=async()=>true;
  await deleteFolder('f1');
  await purgeTrashItem('f1','der');
  return {folders:DB.folders.map(f=>f.id)}
});
ok('Бүр мөсөн устгахад DB.folders-с бүрмөсөн алга болно',purged.folders.length===0,JSON.stringify(purged));

// ── Сум (DB.sw): ижил урсгал ──
await page.evaluate(()=>{
  DB.sw=[{id:'sf1',name:'Хавар 2026 сум',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,mak:'Р-65',mark:'1/11',head:0,it:'nnn'}]}];
  saveDB();
});
const swBefore=await page.evaluate(()=>JSON.stringify(DB.sw[0].turnouts));
const swDel=await page.evaluate(async()=>{
  window.appConfirm=async()=>true;
  await delSwFolderById('sf1');
  return {active:swFolders().map(f=>f.id),trashed:!!DB.sw[0].trashedAt}
});
ok('Сум: устгасны дараа идэвхтэй жагсаалтаас алга',swDel.active.length===0,JSON.stringify(swDel));
ok('Сум: trashedAt тэмдэглэгдэнэ',swDel.trashed===true,JSON.stringify(swDel));
const swAfter=await page.evaluate(()=>JSON.stringify(DB.sw[0].turnouts));
ok('Сум: дотоод өгөгдөл (турникет) бүрэн хэвээр',swBefore===swAfter,'');

const swRestored=await page.evaluate(()=>{
  restoreTrashItem('sf1','sw');
  return swFolders().map(f=>f.id)
});
ok('Сум: сэргээсний дараа идэвхтэй жагсаалтад буцна',swRestored.includes('sf1'),JSON.stringify(swRestored));

const swPurged=await page.evaluate(async()=>{
  window.appConfirm=async()=>true;
  await delSwFolderById('sf1');
  await purgeTrashItem('sf1','sw');
  return (DB.sw||[]).map(f=>f.id)
});
ok('Сум: бүр мөсөн устгахад DB.sw-с бүрмөсөн алга болно',swPurged.length===0,JSON.stringify(swPurged));

// ── 30 хоногийн автомат цэвэрлэгээ ──
await page.evaluate(()=>{
  const old31=new Date(Date.now()-31*86400000).toISOString();
  const old29=new Date(Date.now()-29*86400000).toISOString();
  DB.folders=[
    {id:'old31',name:'Хуучин (31 хоног)',tracks:[],trashedAt:old31},
    {id:'old29',name:'Шинэ (29 хоног)',tracks:[],trashedAt:old29}
  ];
  DB.sw=[{id:'swold31',name:'Сум хуучин',turnouts:[],trashedAt:old31}];
  saveDB();
});
const purgeAuto=await page.evaluate(()=>{
  _purgeOldTrash();
  return {folders:DB.folders.map(f=>f.id),sw:(DB.sw||[]).map(f=>f.id)}
});
ok('30+ хоногийнх автоматаар бүр мөсөн устана',!purgeAuto.folders.includes('old31')&&!purgeAuto.sw.includes('swold31'),
   JSON.stringify(purgeAuto));
ok('29 хоногийнх хэвээр үлдэнэ',purgeAuto.folders.includes('old29'),JSON.stringify(purgeAuto));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
