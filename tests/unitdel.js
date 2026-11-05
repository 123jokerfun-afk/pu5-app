/* ══════════════════════════════════════════════════════════════
   УСТГАСАН СУМ/ЗАМ ДАХИН ГАРЧ ИРЭХ АЛДАА (нэгжийн түвшний нэгтгэл)

   Хэрэглэгч СШ паспорт дотроос сум устгаад, гараад орход буцаж
   гарч ирдэг байв. Шалтгаан: _writeParts нэгжийг устгахдаа "сервэр
   дэх хувилбар нь миний сүүлд мэдсэнтэй адил уу" гэж hash-аар
   тулгадаг. Гэтэл жинхэнэ Firestore объектын түлхүүрийг цагаан
   толгойн дарааллаар буцаадаг, апп харин {id,num,station,mak,...}
   дарааллаар үүсгэдэг — JSON.stringify нь өөр мөр гаргаж, hash
   хэзээ ч таарахгүй, устгал үргэлж алгасагдана.

   Хуурамч Firestore (stub.js) дарааллыг хадгалдаг тул энэ алдаа
   бусад тестэд харагддаггүй. Энд сервэрийн хуулбарыг _canon-оор
   эрэмбэлж, жинхэнэ Firestore-ыг дуурайна.

   Хоёрдугаар алдаа: нэвтрэх үед _syncUnitHashesFrom задалсан
   (дэр нь объект) DB-ээр hash тооцдог, сервэр дээр харин шахсан
   (дэр нь 1 тэмдэгт) — гол зам/паспортын зам устгал мөн алгасагдана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');
// Жинхэнэ апп өөрийн бичилтийн цуурайг _localWriting цонхонд (600мс)
// алгасдаг. Хуурамч Firestore харин сонсогчийг set() дотор ШУУД
// дууддаг тул _applyRemote сервэрийн объектыг байранд нь задалж,
// DB-г түүн рүү холбочихно. Цуурайг унтрааж жинхэнэ нөхцлийг дуурайна.
await page.evaluate(()=>{_applyRemote=function(){}});

// Сервэр дэх бүх хэсгийг жинхэнэ Firestore-ын адил эрэмбэлсэн түлхүүртэй болгоно
const sortServer=()=>page.evaluate(()=>{
  const pre='sections/'+_sectionCode+'/parts/';
  Object.keys(__fbStore).forEach(k=>{if(k.indexOf(pre)===0)__fbStore[k]=_canon(__fbStore[k])});
});
const srv=id=>page.evaluate(i=>JSON.parse(JSON.stringify(__fbStore['sections/'+_sectionCode+'/parts/'+i]||null)),id);
const push=()=>page.evaluate(async()=>{await _pushCloud(_packDB(DB))});

// ── 1. Сум: шинээр нэмээд (апп-ын дарааллаар) илгээнэ ──
await page.evaluate(async()=>{
  DB.sw=[{id:'SF1',name:'Намар сум',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',turnouts:[]}];
  const mk=(id,num)=>({id,num,station:'Өртөө',mak:'Р65',mark:'1/11',proj:'',head:null,it:''});
  DB.sw[0].turnouts.push(mk('W1',1),mk('W2',2),mk('W3',3));
  await _pushCloud(_packDB(DB));
});
let s=await srv('s_SF1');
ok('Сервэрт 3 сум бичигдэв',s&&s.sw&&s.sw.turnouts.length===3,s&&s.sw&&s.sw.turnouts.map(t=>t.id).join(','));

await sortServer();

// ── 2. W1-ийг устгана (confirmDelSwTurnout-ын адил) ──
await page.evaluate(()=>{DB.sw[0].turnouts=DB.sw[0].turnouts.filter(t=>t.id!=='W1')});
await push();
s=await srv('s_SF1');
const ids=s&&s.sw?s.sw.turnouts.map(t=>t.id):[];
ok('Устгасан W1 сервэрээс ч устав (эрэмбэлсэн түлхүүртэй сервэр)',!ids.includes('W1'),ids.join(','));
ok('Бусад сум (W2, W3) хэвээр',ids.includes('W2')&&ids.includes('W3'),ids.join(','));

// ── 3. Хамгаалалт хэвээр: ӨӨР утас W2-г засчихсан бол миний устгал
//       түүний ажлыг устгахгүй ──
await sortServer();
await page.evaluate(()=>{
  const k='sections/'+_sectionCode+'/parts/s_SF1';
  const d=JSON.parse(JSON.stringify(__fbStore[k]));
  d.sw.turnouts.find(t=>t.id==='W2').it='өөр утас бичсэн';
  __fbStore[k]=_canon(d);
  DB.sw[0].turnouts=DB.sw[0].turnouts.filter(t=>t.id!=='W2');
});
await push();
s=await srv('s_SF1');
const w2=s&&s.sw?s.sw.turnouts.find(t=>t.id==='W2'):null;
ok('Өөр утас засварласан W2 устгагдсангүй (ажил алдагдахгүй)',!!w2&&w2.it==='өөр утас бичсэн',JSON.stringify(w2));

// ── 4. Өөр утасны засварыг МИНИЙ өөрчлөөгүй нэгж дарахгүй ──
await page.evaluate(()=>{
  // Шинэчлэлт хүлээн авсны дараах төлөв: W2 буцаж ирсэн
  const k='sections/'+_sectionCode+'/parts/s_SF1';
  const d=JSON.parse(JSON.stringify(__fbStore[k]));
  DB.sw=[d.sw];
  _syncUnitHashesFrom(DB);
});
await sortServer();
await page.evaluate(()=>{
  const k='sections/'+_sectionCode+'/parts/s_SF1';
  const d=JSON.parse(JSON.stringify(__fbStore[k]));
  d.sw.turnouts.find(t=>t.id==='W3').station='Б утас';
  __fbStore[k]=_canon(d);
  DB.sw[0].turnouts.find(t=>t.id==='W2').it='А утас';   // би зөвхөн W2-г засна
});
await push();
s=await srv('s_SF1');
const t3=s&&s.sw?s.sw.turnouts.find(t=>t.id==='W3'):null;
const t2=s&&s.sw?s.sw.turnouts.find(t=>t.id==='W2'):null;
ok('Б утасны W3 засвар хадгалагдав',t3&&t3.station==='Б утас',JSON.stringify(t3));
ok('А утасны W2 засвар хадгалагдав',t2&&t2.it==='А утас',JSON.stringify(t2));

// ── 5. Гол зам: нэвтрэлтийн дараах hash (задалсан DB) — км устгал ──
await page.evaluate(async()=>{
  const sec=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},()=>({type:'normal',ts:0})),repl:{}});
  DB.main=[{id:'M1',num:1,kind:'main',note:'',sections:[sec('m1a',8)]},
           {id:'M2',num:2,kind:'main',note:'',sections:[sec('m2a',8)]}];
  await _pushCloud(_packDB(DB));
});
await sortServer();
await page.evaluate(()=>{
  // Нэвтрэлтийн адил: сервэрээс уншиж задлаад, hash кэшийг түүгээр дэвшүүлнэ
  const k='sections/'+_sectionCode+'/parts/main';
  const m=JSON.parse(JSON.stringify(__fbStore[k])).main;
  const d=_unpackDB({folders:[],sw:DB.sw,main:m});
  DB.main=d.main;
  _syncUnitHashesFrom(DB);
  DB.main=DB.main.filter(t=>t.id!=='M1');
});
await push();
let m=await srv('main');
const mids=m&&m.main?m.main.map(t=>t.id):[];
ok('Нэвтэрсний дараа устгасан гол замын M1 сервэрээс устав',!mids.includes('M1'),mids.join(','));
ok('M2 хэвээр',mids.includes('M2'),mids.join(','));

// ── 6. Дэрийн паспортын зам: мөн адил ──
await page.evaluate(async()=>{
  const sec=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},()=>({type:'normal',ts:0})),repl:{}});
  DB.folders=[{id:'F1',name:'Намар',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
    tracks:[{id:'T1',num:3,kind:'station',note:'',sections:[sec('a',6)]},
            {id:'T2',num:4,kind:'station',note:'',sections:[sec('b',6)]}]}];
  await _pushCloud(_packDB(DB));
});
await sortServer();
await page.evaluate(()=>{
  const k='sections/'+_sectionCode+'/parts/p_F1';
  const f=JSON.parse(JSON.stringify(__fbStore[k])).folder;
  const d=_unpackDB({folders:[f],sw:DB.sw,main:DB.main});
  DB.folders=d.folders;
  _syncUnitHashesFrom(DB);
  DB.folders[0].tracks=DB.folders[0].tracks.filter(t=>t.id!=='T1');
});
await push();
const pf=await srv('p_F1');
const tids=pf&&pf.folder?pf.folder.tracks.map(t=>t.id):[];
ok('Нэвтэрсний дараа устгасан паспортын T1 зам сервэрээс устав',!tids.includes('T1'),tids.join(','));
ok('T2 хэвээр',tids.includes('T2'),tids.join(','));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
