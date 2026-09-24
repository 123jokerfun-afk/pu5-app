/* ══════════════════════════════════════════════════════════════
   СОЛИЛТЫН УЛАМЖЛАЛ — 2 ПАСПОРТЫН ХАТУУ ХЯЗГААР

   resolveReplMap/swResolveDRepl нь өмнө нь ХЯЗГААРГҮЙ ухарч хайдаг
   байсан тул сольсон тэмдэглэгээ мөнхөд харагддаг байв. Одоо ЗӨВХӨН
   сольсон паспорт өөрөө + дараагийн 2 паспортод (нийт 3) харагдаж,
   4-р паспортоос алга болох ёстой.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');

// ── Дэр: 4 дараалсан паспорт (хавар→намар→хавар→намар), 1-р дэрийг
//    эхний паспортад сольно ──
await page.evaluate(()=>{
  const mkSec=()=>({id:'sx',type:'normal',label:'1-р үе',note:'',date:'2026-01-01',
    sleepers:Array.from({length:5},()=>({type:'normal',ts:0}))});
  const mkFolder=(id,date,season)=>({id,name:id,season,year:'2026',date,sc:'ПД-6',
    tracks:[{id:'t1',num:1,kind:'station',sections:[mkSec()]}]});
  DB.folders=[
    mkFolder('r1','2026-01-01','хавар'),
    mkFolder('r2','2026-04-01','намар'),
    mkFolder('r3','2026-07-01','хавар'),
    mkFolder('r4','2026-10-01','намар')
  ];
  DB.main=[];DB.sw=[];
  // r1-д 1-р дэрийг (idx0) сольсон гэж тэмдэглэнэ
  DB.folders[0].tracks[0].sections[0].repl={0:{d:'2026-01-01',t:'normal',m:'wood',o:1}};
  activeFolderId='r1';DB.tracks=DB.folders[0].tracks;
  saveDB();
});
const checkFolder=async(fid)=>page.evaluate(fid=>{
  activeFolderId=fid;DB.tracks=DB.folders.find(f=>f.id===fid).tracks;
  const t=DB.tracks[0],s=t.sections[0];
  const m=resolveReplMap(t,s);
  return m[0]?{own:m[0].own,d:m[0].rec.d}:null
},fid);

ok('r1 (сольсон паспорт өөрөө): own=true',
   JSON.stringify(await checkFolder('r1'))==='{"own":true,"d":"2026-01-01"}',
   JSON.stringify(await checkFolder('r1')));
ok('r2 (дараагийн 1): уламжлагдсан, own=false',
   JSON.stringify(await checkFolder('r2'))==='{"own":false,"d":"2026-01-01"}',
   JSON.stringify(await checkFolder('r2')));
ok('r3 (дараагийн 2): уламжлагдсан, own=false',
   JSON.stringify(await checkFolder('r3'))==='{"own":false,"d":"2026-01-01"}',
   JSON.stringify(await checkFolder('r3')));
ok('r4 (дараагийн 3) — ЭНД АЛГА БОЛНО',
   (await checkFolder('r4'))===null,
   JSON.stringify(await checkFolder('r4')));

// ── Дүнз: swResolveDRepl мөн адил 2 паспортын хязгаартай ──
await page.evaluate(()=>{
  const mkTo=()=>({id:'w1',num:1,mak:'Р-65',mark:'1/11',head:0,it:'nnnnn'});
  const mkFolder=(id,date,season)=>({id,name:id,season,year:'2026',date,sc:'ПД-6',turnouts:[mkTo()]});
  DB.sw=[
    mkFolder('sr1','2026-01-01','хавар'),
    mkFolder('sr2','2026-04-01','намар'),
    mkFolder('sr3','2026-07-01','хавар'),
    mkFolder('sr4','2026-10-01','намар')
  ];
  DB.sw[0].turnouts[0].dRepl={0:{d:'2026-01-01',L:3,o:1}};
  swFolderId='sr1';
  saveDB();
});
const checkSw=async(fid)=>page.evaluate(fid=>{
  swFolderId=fid;
  const to=DB.sw.find(f=>f.id===fid).turnouts[0];
  const m=swResolveDRepl(to);
  return m[0]?{own:m[0].own,d:m[0].rec.d}:null
},fid);

ok('sr1 (сольсон паспорт өөрөө): own=true',
   JSON.stringify(await checkSw('sr1'))==='{"own":true,"d":"2026-01-01"}',
   JSON.stringify(await checkSw('sr1')));
ok('sr2 (дараагийн 1): уламжлагдсан',
   JSON.stringify(await checkSw('sr2'))==='{"own":false,"d":"2026-01-01"}',
   JSON.stringify(await checkSw('sr2')));
ok('sr3 (дараагийн 2): уламжлагдсан',
   JSON.stringify(await checkSw('sr3'))==='{"own":false,"d":"2026-01-01"}',
   JSON.stringify(await checkSw('sr3')));
ok('sr4 (дараагийн 3) — ЭНД АЛГА БОЛНО',
   (await checkSw('sr4'))===null,
   JSON.stringify(await checkSw('sr4')));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
