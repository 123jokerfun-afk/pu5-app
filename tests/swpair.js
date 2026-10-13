/* ══════════════════════════════════════════════════════════════
   РАМ ЗАМЫН ДЭР — УЛИРЛААР ДЭР↔СУМ ПАСПОРТ ХОСЛУУЛАХ

   v188-аас хойш идэвхтэй паспорт season+year-ээр өвөрмөц тул дэр
   паспорт бүрт яг 0 эсвэл 1 "хос" сумын паспорт тодорхой олдоно.
   Энэ файл баталгаажуулна: дараалсан цэг/сольсон/төлөвлөгөө гурав
   ЗӨВХӨН тэр улирлын хос сумын паспортоос л ордог, өөр улирлынхтай
   огт холихгүй.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');
await page.evaluate(()=>{window.appConfirm=()=>Promise.resolve(true)});

// Хоёр улирал: ХАВАР ба НАМАР, тус бүрдээ дэр+сум хос паспорттай.
// Рам замын дэр head=5, эхний 3 нь дараалсан тэнцэхгүй (bbb).
await page.evaluate(()=>{
  const mk=(id,season,num)=>({id,num,mak:'Р-65',mark:'1/11',head:5,
    it:'bbbnn'+'n'.repeat(19),               // 0,1,2 — 3 дараалсан (head дотор)
    slPlan:{3:'wood'},
    slRepl:{4:{d:season==='хавар'?'2026-05-01':'2026-10-01',t:'normal',m:'wood',o:0}}});
  DB.folders=[
    {id:'fh',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',tracks:[]},
    {id:'fn',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',tracks:[]}
  ];
  DB.sw=[
    {id:'sh',name:'Хавар 2026 сум',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
     turnouts:[mk('th','хавар',1)]},
    {id:'sn',name:'Намар 2026 сум',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
     turnouts:[mk('tn','намар',2)]}
  ];
  saveDB();
});

// 1. swFolderBySeasonOf / activeSwPairFolder — цэвэр функцууд
const pair=await page.evaluate(()=>({
  h:(swFolderBySeasonOf(DB.folders.find(f=>f.id==='fh'))||{}).id,
  n:(swFolderBySeasonOf(DB.folders.find(f=>f.id==='fn'))||{}).id,
  none:swFolderBySeasonOf(null)
}));
ok('Хавар дэр → хавар сум паспорт олдоно',pair.h==='sh',JSON.stringify(pair));
ok('Намар дэр → намар сум паспорт олдоно',pair.n==='sn',JSON.stringify(pair));
ok('null дэр → null (crash-гүй)',pair.none===null,String(pair.none));

// 2. collectConsec() — идэвхтэй дэр паспортоос хамаарч зөв сум хос харагдана
await page.evaluate(()=>{openFolder('fh')});
const consH=await page.evaluate(()=>collectConsec().filter(g=>g.sw).map(g=>g.name));
ok('Хавар идэвхтэй үед зөвхөн 1-р сум (хавар) харагдана',
   consH.length===1&&/^1-р сум/.test(consH[0]),JSON.stringify(consH));
await page.evaluate(()=>openFolder('fn'));
const consN=await page.evaluate(()=>collectConsec().filter(g=>g.sw).map(g=>g.name));
ok('Намар идэвхтэй үед зөвхөн 2-р сум (намар) харагдана',
   consN.length===1&&/^2-р сум/.test(consN[0]),JSON.stringify(consN));

// 3. collectRepl() — мөн адил улирлаар тусгаарлагдана
await page.evaluate(()=>openFolder('fh'));
const replH=await page.evaluate(()=>collectRepl().filter(t=>/рам зам/.test(t.name)).map(t=>t.name));
ok('Хавар: сольсон тайланд зөвхөн 1-р сум орно',
   replH.length===1&&/^1-р сум/.test(replH[0]),JSON.stringify(replH));
await page.evaluate(()=>openFolder('fn'));
const replN=await page.evaluate(()=>collectRepl().filter(t=>/рам зам/.test(t.name)).map(t=>t.name));
ok('Намар: сольсон тайланд зөвхөн 2-р сум орно',
   replN.length===1&&/^2-р сум/.test(replN[0]),JSON.stringify(replN));

// 4. collectPlanFor(fid) — рам-дэрийн төлөвлөгөө зөвхөн хос улиралд
await page.evaluate(()=>openFolder('fh'));
const planH=await page.evaluate(()=>collectPlanFor('fh').filter(t=>t.sw).map(t=>t.name));
ok('Хавар: төлөвлөгөөнд зөвхөн 1-р сум орно (2-р сум ОРОХГҮЙ)',
   planH.length===1&&/^1-р сум/.test(planH[0]),JSON.stringify(planH));
const planGlobal=await page.evaluate(()=>collectPlan().filter(t=>t.sw).length);
ok('collectPlan() (global) хоёулаа хэвээр хамаарна (2)',planGlobal===2,String(planGlobal));

// 5. Гол (unscoped) collectConsec/collectRepl — идэвхтэй паспортгүй үед сум ороогүй
await page.evaluate(()=>{activeFolderId=null;DB.tracks=[]});
const noneActive=await page.evaluate(()=>({
  cons:collectConsec().filter(g=>g.sw).length,
  repl:collectRepl().filter(t=>/рам зам/.test(t.name)).length
}));
ok('Идэвхтэй дэр паспортгүй үед рам-дэр дараалсан/сольсон ОРОХГҮЙ',
   noneActive.cons===0&&noneActive.repl===0,JSON.stringify(noneActive));

// 6. jumpToConsecSw — зөв сум руу шилжинэ (swFolderId солигдоно)
await page.evaluate(()=>{openFolder('fn')});
const jump=await page.evaluate(()=>{
  jumpToConsecSw('th',1);                   // 'th' бол 'sn' биш 'sh' паспортод харьяалагдана
  return {swFolderId,swTurnoutId,view:(document.querySelector('.view.active')||{}).id}
});
ok('jumpToConsecSw: өөр улирлын сум руу шилжихэд swFolderId зөв сольогдоно',
   jump.swFolderId==='sh'&&jump.swTurnoutId==='th'&&jump.view==='swRecView',JSON.stringify(jump));

// 7. swHeadRuns — зөвхөн head мужид (0..head), дүнзийг хөндөхгүй
const headRuns=await page.evaluate(()=>{
  const to={head:5,it:'bbbnnbbbnn'};        // head дотор 0-2 (3 дараалсан), head гадна 5-7 (хамаарахгүй ёстой)
  return {h:swHeadRuns(to),d:swRuns(to)}
});
ok('swHeadRuns зөвхөн head мужийн (0-2) дараалсныг олно',
   headRuns.h.length===1&&headRuns.h[0].join(',')==='0,1,2',JSON.stringify(headRuns.h));
ok('swRuns (дүнз) head-ээс гадуурх (5-7) дараалсныг олно, head дотроо хамаарахгүй',
   headRuns.d.length===1&&headRuns.d[0].join(',')==='5,6,7',JSON.stringify(headRuns.d));

// 8. swFullOrigIt — солигдсон (o:1) рам-дэр ч буцааж "b" болно
const fullOrig=await page.evaluate(()=>{
  const to={it:'nbnnn',slRepl:{0:{o:1}},dRepl:{}};   // 0-р байрлал: одоо 'n', гэвч солихоос ӨМНӨ муу байсан
  return swFullOrigIt(to)
});
ok('swFullOrigIt: slRepl.o=1 бол тэр байрлал буцааж "b" болно',fullOrig==='bbnnn',fullOrig);

// 9. jumpToConsecSw — буцах товч "Дараалсан цэг" тайлан руугаа буцна
// (code-review: _fromConsec тавигдаагүй байсан тул swBackFromRec() нь
// swHomeView рүү шилждэг байсныг засав).
await page.evaluate(()=>{openFolder('fh');openConsecReport()});
const backJump=await page.evaluate(()=>{
  jumpToConsecSw('th',1);
  const fromConsec=_fromConsec;
  swBackFromRec();
  return {fromConsec,modalOpen:_modalOpen('consecReportModal'),
    view:(document.querySelector('.view.active')||{}).id}
});
ok('jumpToConsecSw: _fromConsec=true тавигдана',backJump.fromConsec===true,JSON.stringify(backJump));
ok('Буцах товч "Дараалсан цэг" тайлан руугаа буцна',
   backJump.modalOpen===true&&backJump.view==='homeView',JSON.stringify(backJump));

// 10. swFolderBySeasonOf — season/year хоосон бол хослуулахгүй, хэд
// хэдэн тохирол олдвол (хуучин, v188-аас өмнөх давхардсан өгөгдөл)
// дэр паспортын огноонд хамгийн ойрыг сонгоно (санамсаргүй биш).
const tieBreak=await page.evaluate(()=>{
  const der={id:'fx',season:'хавар',year:'2026',date:'2026-04-20'};
  const noSeason=swFolderBySeasonOf({id:'fy',season:'',year:'2026',date:'2026-04-20'});
  // Хоёр "хавар 2026" сумын паспорт — нэг нь 04-10 (10 хоногийн зөрүү),
  // нөгөө нь 04-25 (5 хоногийн зөрүү) — сүүлийнх нь илүү ойр байх ёстой.
  DB.sw.push({id:'close',season:'хавар',year:'2026',date:'2026-04-25',turnouts:[]});
  DB.sw.push({id:'far',season:'хавар',year:'2026',date:'2026-03-01',turnouts:[]});
  const picked=swFolderBySeasonOf(der);
  return {noSeason,pickedId:picked?picked.id:null}
});
ok('season хоосон дэр паспорт хослуулахгүй (null)',tieBreak.noSeason===null,JSON.stringify(tieBreak));
ok('Хэд хэдэн тохиролоос дэр паспортын огноонд хамгийн ойрыг сонгоно',
   tieBreak.pickedId==='close',JSON.stringify(tieBreak));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
