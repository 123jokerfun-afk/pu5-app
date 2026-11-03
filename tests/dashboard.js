/* НҮҮРНИЙ ДАШБОАРД — тухайн паспортоо нээлгүйгээр шууд харагдах
   ерөнхий тойм (`renderDashboard`): материал, сум/дүнз, 2 паспортын
   чиг хандлага, хувиар шүүсэн үеийн тоолуур. Тоо бүрийг нарийн
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
  return {
    name:document.getElementById('dashFolderName').textContent,
    minis:g,
    trendTxt:(document.querySelector('.dash-trend')||{}).textContent,
    trendCls:(document.querySelector('.dash-trend')||{}).className,
    barNs:[...document.querySelectorAll('.dash-bar-n')].map(e=>e.textContent.trim()),
    thrResult:document.querySelector('.dash-thr-result').textContent,
    activeChip:(document.querySelector('.dash-thr-chip.active')||{}).textContent
  }
});
ok('Паспортын нэр сүүлийн (намар) паспортынх',/Намар паспорт/.test(dash.name),dash.name);
ok('Модон/ТБД/Сум-дүнз mini-карт зөв (60/0/10)',
   dash.minis[0]==='60'&&dash.minis[1]==='0'&&dash.minis[2]==='10',JSON.stringify(dash.minis));
ok('Гол зам дашбоардын тооцоонд ОРООГҮЙ (50 тэнцэхгүй нэмэгдээгүй)',
   dash.minis[0]==='60',dash.minis[0]);
ok('Чиг хандлага: тэнцэхгүй өссөн тул "up" анги, +6',
   /up/.test(dash.trendCls)&&/\+6/.test(dash.trendTxt),dash.trendCls+' / '+dash.trendTxt);
ok('Баарны тоо: тэнцэхгүй хуучин=4 шинэ=10, сольсон хуучин=2 шинэ=5',
   JSON.stringify(dash.barNs)===JSON.stringify(['4','10','2','5']),JSON.stringify(dash.barNs));
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
  return {cmp:document.querySelectorAll('.dash-cmp').length,
    thr:document.querySelectorAll('.dash-thr').length,
    minis:document.querySelectorAll('.dash-mini').length}
});
ok('Ганц паспорттой үед харьцуулах график гарахгүй',single.cmp===0,JSON.stringify(single));
ok('Ганц паспорттой ч mini-карт, босго хэсэг хэвээр ажиллана',
   single.thr===1&&single.minis===3,JSON.stringify(single));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
