/* НҮҮРНИЙ ДАШБОАРД — тухайн паспортоо нээлгүйгээр шууд харагдах
   ерөнхий тойм (`renderDashboard`): тэнцэхгүй хувийн цагираг, материал,
   Маягт 1-3-ийн 25%+ ба дараалан муудсан хүснэгт, анхаарах үе,
   хувиар шүүсэн үеийн тоолуур. Тоо бүрийг нарийн
   тооцоолсон эх өгөгдөлтэй тулган баталгаажуулна. */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');

// ── 1. Хоосон: паспорт нэг ч байхгүй ──
const empty=await page.evaluate(()=>{
  DB.folders=[];DB.sw=[];saveDB();renderHome();
  return {name:document.getElementById('dashFolderName').textContent,
    html:document.getElementById('dashBody').innerHTML}
});
ok('Паспортгүй үед хоосон төлөв харагдана',/Паспорт нэмэгдэхэд/.test(empty.html),empty.html.slice(0,60));
ok('Паспортгүй үед нэр "—"',empty.name==='—',empty.name);

// ── 2. Эх өгөгдөл: 2 дэрийн паспорт (хуучин/шинэ), 1 сумын паспорт ──
await page.evaluate(()=>{
  const mkSec=(id,label,n,badIdx,repl)=>({id,label,type:'normal',note:'',
    sleepers:Array.from({length:n},(_,i)=>({type:badIdx.includes(i)?'bad':'normal',ts:0})),
    repl:repl||{}});
  DB.folders=[
    {id:'FPREV',name:'Хавар паспорт',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',
     tracks:[
       {id:'T1',num:1,kind:'station',note:'',sections:[
         mkSec('S1','1-р үе',20,[0,1,2,3],{0:{d:'2026-01-05',t:'normal',m:'wood'},1:{d:'2026-01-06',t:'normal',m:'wood'}})
       ]},
       // Гол зам — дашбоардын тооцоонд орохгүй ёстой (50 тэнцэхгүй ч нөлөөлөхгүй)
       {id:'TM1',num:681,kind:'main',mat:'tbd',sections:[
         mkSec('SM1','ГЗ үе',50,Array.from({length:50},(_,i)=>i),{})
       ]}
     ]},
    {id:'FLAST',name:'Намар паспорт',season:'намар',year:'2026',date:'2026-06-01',sc:'ПД-6',
     tracks:[
       {id:'T2',num:2,kind:'station',note:'',sections:[
         // 15% — босго дээр яг таарна (>= тул ОРНО)
         mkSec('S2','1-р үе',20,[0,1,2],{0:{d:'2026-06-05',t:'normal',m:'wood'},1:{d:'2026-06-06',t:'normal',m:'wood'}}),
         // 5% — 15%-ийн босгонд ОРОХГҮЙ
         mkSec('S3','2-р үе',20,[0],{0:{d:'2026-06-07',t:'normal',m:'wood'},1:{d:'2026-06-08',t:'normal',m:'wood'},2:{d:'2026-06-09',t:'normal',m:'wood'}}),
         // 30% — бүх босгонд ОРНО (25% хүртэл)
         mkSec('S4','3-р үе',20,[0,1,2,3,4,5],{})
       ]},
       {id:'TM2',num:681,kind:'main',mat:'tbd',sections:[mkSec('SM2','ГЗ үе',10,[0,1,2,3,4,5,6,7,8,9],{})]}
     ]}
  ];
  DB.sw=[{id:'SWF',name:'Сумын паспорт',season:'хавар',year:'2026',date:'2026-02-01',sc:'ПД-6',
    turnouts:[
      {id:'W1',num:1,mak:'Р-65',mark:'1/9',head:0,it:'bnnnn',dRepl:{},slRepl:{}},
      {id:'W2',num:2,mak:'Р-65',mark:'1/9',head:0,it:'nnbnb',dRepl:{},slRepl:{}}
    ]}];
  activeFolderId=null;DB.tracks=[];saveDB();renderHome();
});

const dash=await page.evaluate(()=>{
  const g=[...document.querySelectorAll('#dashBody .dash-mini-n')].map(e=>e.textContent.trim());
  const tb=id=>[...document.querySelectorAll('#'+id+' tr')].map(r=>[...r.children].map(c=>c.textContent.trim()));
  // Excel (Маягт 1-3)-ийн тооцоотой ЯГ ижил байх ёстой — тэр функцээр нь бодно
  const f=DB.folders.find(x=>x.id==='FLAST');
  const trs=f.tracks.filter(t=>!isMainTrack(t));
  return {
    name:document.getElementById('dashFolderName').textContent,
    minis:g,
    pct:(document.getElementById('dashPct')||{}).textContent,
    trend:(document.querySelector('#dashHero .dash-trend')||{}).className||'',
    hasChart:document.querySelectorAll('.dash-cmp,.dash-bars,.dash-band-wrap').length,
    speedTxt:/Хурд хязгаар/.test(document.getElementById('dashBody').textContent),
    pctTbl:tb('dashPctTbl'),runTbl:tb('dashRunTbl'),
    expPct:trs.map(_pctBuckets),expRun:trs.map(_runBuckets),
    worst:[...document.querySelectorAll('#dashWorst .dash-wr-n')].map(e=>e.textContent.trim()),
    worstP:[...document.querySelectorAll('#dashWorst .dash-wr-p')].map(e=>e.textContent.trim()),
    thrResult:document.querySelector('.dash-thr-result').textContent,
    activeChip:(document.querySelector('.dash-thr-chip.active')||{}).textContent
  }
});
ok('Паспортын нэр сүүлийн (намар) паспортынх',/Намар паспорт/.test(dash.name),dash.name);
ok('Модон/ТБД/Сум-дүнз mini-карт зөв (60/0/10)',
   dash.minis[0]==='60'&&dash.minis[1]==='0'&&dash.minis[2]==='10',JSON.stringify(dash.minis));
ok('Гол зам дашбоардын тооцоонд ОРООГҮЙ (50 тэнцэхгүй нэмэгдээгүй)',
   dash.minis[0]==='60',dash.minis[0]);
ok('Цагираг: тэнцэхгүй хувь 10/60 = 16.7%',dash.pct==='16.7%',dash.pct);
ok('Өмнөх паспортоос (4/20=20%) буурсан тул "down"',/down/.test(dash.trend),dash.trend);
ok('Чиг хандлагын график, "Хурд хязгаарлах" гарчиг ХАСАГДСАН',
   dash.hasChart===0&&!dash.speedTxt,dash.hasChart+' / '+dash.speedTxt);
// Хүснэгт 1: толгой + зам бүр + Нийт
ok('25%+ хүснэгтийн толгой маягтынх шиг',
   JSON.stringify(dash.pctTbl[0])===JSON.stringify(['Зам','25-30','31-40','41-50','50 их']),JSON.stringify(dash.pctTbl[0]));
ok('25%+ хүснэгт: 2-р зам, 30%-ийн үе 25-30 баганад',
   dash.pctTbl[1]&&dash.pctTbl[1][0]==='2-р зам'&&dash.pctTbl[1][1]==='1',JSON.stringify(dash.pctTbl[1]));
ok('25%+ хүснэгт Excel-ийн _pctBuckets-тэй ижил',
   JSON.stringify(dash.pctTbl.slice(1,-1).map(r=>r.slice(1).map(v=>+v||0)))===JSON.stringify(dash.expPct),
   JSON.stringify(dash.expPct));
ok('25%+ хүснэгтийн Нийт мөр: 1 / 0 / 0 / 0',
   JSON.stringify(dash.pctTbl[dash.pctTbl.length-1])===JSON.stringify(['Нийт','1','0','0','0']),
   JSON.stringify(dash.pctTbl[dash.pctTbl.length-1]));
// Хүснэгт 2: дараалан муудсан
ok('Дараалан муудсан хүснэгтийн толгой: 3 / 4 / 5 ба<',
   JSON.stringify(dash.runTbl[0])===JSON.stringify(['Зам','3','4','5 ба<']),JSON.stringify(dash.runTbl[0]));
ok('Дараалан муудсан Excel-ийн _runBuckets-тэй ижил',
   JSON.stringify(dash.runTbl.slice(1,-1).map(r=>r.slice(1).map(v=>+v||0)))===JSON.stringify(dash.expRun),
   JSON.stringify(dash.runTbl)+' vs '+JSON.stringify(dash.expRun));
ok('Дараалан муудсан: 6 дараалсан (3-р үе) "5 ба<" баганад',
   dash.expRun[0][2]===1&&dash.runTbl[dash.runTbl.length-1][3]==='1',JSON.stringify(dash.runTbl));
ok('Анхаарах үе: хамгийн өндөр нь 3-р үе (30%)',
   /2-р зам · 3-р үе/.test(dash.worst[0]||'')&&dash.worstP[0]==='30%',JSON.stringify(dash.worst)+' '+JSON.stringify(dash.worstP));
ok('Анхдагч 15% босго идэвхтэй',/15%/.test(dash.activeChip),dash.activeChip);
ok('15% босгод 2 үе орно (15% ба 30%, 3-аас)',
   /^2\s/.test(dash.thrResult.trim())||/>\s*2\s*</.test(dash.thrResult),dash.thrResult);

// ── 3. Босго товч солиход дахин тооцоологдоно ──
const thr5=await page.evaluate(()=>{dashSetThreshold(5);
  return document.querySelector('.dash-thr-result').textContent});
ok('5% босгод бүх 3 үе орно',/^3\s/.test(thr5.trim()),thr5);
const thr25=await page.evaluate(()=>{dashSetThreshold(25);
  return document.querySelector('.dash-thr-result').textContent});
ok('25% босгод зөвхөн 1 үе (30%) орно',/^1\s/.test(thr25.trim()),thr25);
await page.evaluate(()=>dashSetThreshold(15));   // дараагийн тестэд нөлөөлөхгүй

// ── 4. "Сум/дүнз" mini-карт дээр дарахад swHomeView руу шууд орно ──
await page.click('.dash-mini-link');
await page.waitForTimeout(500);
const toSw=await page.evaluate(()=>document.getElementById('swHomeView').classList.contains('active'));
ok('"Сум/дүнз" mini-карт дээр дарахад СШ рүү орно',toSw);
await page.evaluate(()=>goDerHome());
await page.waitForTimeout(300);

// ── 5. Ганц паспорт (хуучин нь байхгүй) — графикгүй, алдаагүй ──
const single=await page.evaluate(()=>{
  DB.folders=DB.folders.filter(f=>f.id==='FLAST');saveDB();renderHome();
  return {pill:document.querySelectorAll('#dashHero .dash-trend').length,
    thr:document.querySelectorAll('.dash-thr').length,
    tbl:document.querySelectorAll('#dashPctTbl table,#dashRunTbl table').length,
    minis:document.querySelectorAll('.dash-mini').length}
});
ok('Ганц паспорттой үед "өмнөхөөс" харьцуулалт гарахгүй, хүснэгт хэвээр',single.pill===0&&single.tbl===2,JSON.stringify(single));
ok('Ганц паспорттой ч mini-карт, босго хэсэг хэвээр ажиллана',
   single.thr===1&&single.minis===3,JSON.stringify(single));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
