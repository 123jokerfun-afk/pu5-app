/* ══════════════════════════════════════════════════════════════
   УСТГАХ ТОВЧНЫ ҮЗЭГДЭЛ — appConfirm("Тийм") дарсны дараа цүнхийг
   хогийн сав руу хийдэг хүн #delFly хөвөгч самбар дээр тоглоод,
   ЗӨВХӨН дараа нь жинхэнэ устгалт (trashedAt тэмдэглэл) хийгдэнэ.
   (санаа: uulzwar_zai сиб апп). appConfirm олон өөр зүйлд ч
   хэрэглэгддэг нийтлэг модал тул үзэгдлийг тэр модал дээр биш,
   тусдаа хөвөгч самбар дээр тоглуулдгийг шалгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await page.emulateMedia({reducedMotion:'no-preference'});
await B.login(page,'ПД-6');

// ── 1. Эхлэлийн байдал ──
const init=await page.evaluate(()=>{
  const fly=document.getElementById('delFly');
  return {flyExists:!!fly,flyOn:fly&&fly.classList.contains('on')};
});
ok('#delFly самбар бэлэн, анхандаа нуугдмал',init.flyExists&&!init.flyOn,JSON.stringify(init));

// ── 2. Дэр: батлахад үзэгдэл ЭХЛЭЭД тоглоод, ДАРАА НЬ устгалт хийгдэнэ ──
await page.evaluate(()=>{
  DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',
    tracks:[{id:'t1',num:1,kind:'station',sections:[{id:'s1',type:'normal',label:'1-р үе',
      sleepers:[{type:'normal',ts:0},{type:'bad',ts:0}]}]}]}];
  DB.main=[];DB.sw=[];saveDB()
});
await page.evaluate(()=>{
  window.appConfirm=async()=>true;
  window.__delPromise=deleteFolder('f1');   // ХҮЛЭЭХГҮЙ — дундах байдлыг шалгана
});
await page.waitForTimeout(300);
const mid=await page.evaluate(()=>({
  flyOn:document.getElementById('delFly').classList.contains('on'),
  stillActive:derFolders().map(f=>f.id),
  trashedYet:!!DB.folders[0].trashedAt
}));
ok('Үзэгдэл эхэлсэн (#delFly тоглож байна)',mid.flyOn,JSON.stringify(mid));
ok('Үзэгдэл дуустал устгалт ХИЙГДЭЭГҮЙ',!mid.trashedYet&&mid.stillActive.length===1,JSON.stringify(mid));

await page.waitForFunction(()=>!document.getElementById('delFly').classList.contains('on'),
  {timeout:8000});
await page.evaluate(()=>window.__delPromise);
const after=await page.evaluate(()=>({
  flyOn:document.getElementById('delFly').classList.contains('on'),
  active:derFolders().map(f=>f.id),
  trashed:!!DB.folders[0].trashedAt
}));
ok('Үзэгдэл дуусаад л жинхэнэ устгалт (trashedAt) хийгдэнэ',
   after.trashed&&after.active.length===0&&!after.flyOn,JSON.stringify(after));

// ── 3. Сум: ижил зарчим (delSwFolderById) ──
await page.evaluate(()=>{
  DB.sw=[{id:'sf1',name:'Сум 2026',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',turnouts:[]}];
  saveDB();
  window.appConfirm=async()=>true;
  window.__delPromise2=delSwFolderById('sf1')
});
await page.waitForTimeout(300);
const swMid=await page.evaluate(()=>({
  flyOn:document.getElementById('delFly').classList.contains('on'),
  trashedYet:!!DB.sw[0].trashedAt
}));
ok('Сум: үзэгдэл эхэлж, устгалт хойшлогдоно',swMid.flyOn&&!swMid.trashedYet,JSON.stringify(swMid));
await page.waitForFunction(()=>!document.getElementById('delFly').classList.contains('on'),
  {timeout:8000});
await page.evaluate(()=>window.__delPromise2);
ok('Сум: дуусаад устгалт хийгдэв',await page.evaluate(()=>!!DB.sw[0].trashedAt));

// ── 4. prefers-reduced-motion: reduce үед шууд гүйцэтгэнэ ──
await page.evaluate(()=>{
  DB.folders=[{id:'f2',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',tracks:[]}];
  saveDB();window.appConfirm=async()=>true
});
await page.emulateMedia({reducedMotion:'reduce'});
const calmStart=Date.now();
await page.evaluate(()=>deleteFolder('f2'));
const calmMs=Date.now()-calmStart;
ok('Хөдөлгөөн хязгаарласан горимд шууд гүйцэтгэнэ (<500мс)',calmMs<500,calmMs+'мс');
ok('Хязгаарласан горимд ч устгалт зөв хийгдэв',await page.evaluate(()=>!!DB.folders[0].trashedAt));
await page.emulateMedia({reducedMotion:'no-preference'});

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
