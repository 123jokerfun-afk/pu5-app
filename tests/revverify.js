/* ══════════════════════════════════════════════════════════════
   УХРАХ ГОРИМД БАТАЛГААЖУУЛАХ (Шалгах) — ЭРГЭЛТИЙН АЛДАА

   Ухарч (reverse) бүртгэдэг замд "Шалгах" (Баталгаажуулах) товчоор
   үеэ давхар шалгахад startVerification() нь _revEnter()-ийг
   ДУУДДАГГҮЙ байсан тул анхны (жинхэнэ) дарааллаар харьцуулж, #1 гэдэг
   нь бодит ХОЛ талын дэртэй биш, ЭХНИЙ талын дэртэй таарч, "зөрж
   байна" гэсэн ХУДАЛ анхааруулга гарч, зассан ч буруу байрлалд бичигдэж
   байв. Одоо openSection()-той яг ижил дараалал баримталж эргүүлнэ.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');

await page.evaluate(()=>{
  const sec={id:'sv1',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',
    sleepers:[{type:'normal',ts:0},{type:'normal',ts:0},{type:'bad',ts:0}]};
  DB.folders=[{id:'fv',name:'Ухрах шалгалт',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'tv',num:5,kind:'station',sections:[sec]}]}];
  DB.main=[];DB.sw=[];
  activeFolderId='fv';DB.tracks=DB.folders[0].tracks;
  _revTrk['tv']=1;   // pickWalk(true)-той ижил төлөв — ухарч бүртгэх
  saveDB();
});

// 1) Энгийн нээлт: reverse горимд _revEnter() эргүүлнэ
await page.evaluate(()=>{openTrack('tv');openSection('sv1')});
await page.waitForTimeout(300);
let types=await page.evaluate(()=>DB.tracks[0].sections[0].sleepers.map(s=>s.type));
let rw=await page.evaluate(()=>!!DB.tracks[0].sections[0].rw);
ok('Нээхэд эргэсэн: [bad,normal,normal], rw=1',
   JSON.stringify(types)==='["bad","normal","normal"]'&&rw,JSON.stringify({types,rw}));

// 2) Зөв гарах (goTrack): жинхэнэ дараалалдаа буцна
await page.evaluate(()=>goTrack());
await page.waitForTimeout(300);
types=await page.evaluate(()=>DB.tracks[0].sections[0].sleepers.map(s=>s.type));
rw=await page.evaluate(()=>!!DB.tracks[0].sections[0].rw);
ok('goTrack()-ийн дараа жинхэнэ дараалал: [normal,normal,bad], rw байхгүй',
   JSON.stringify(types)==='["normal","normal","bad"]'&&!rw,JSON.stringify({types,rw}));

// 3) ГОЛ ШАЛГАЛТ: "Шалгах" (Баталгаажуулах) нээхэд мөн ижил эргэнэ
await page.evaluate(()=>{openVerifModal('sv1');startVerification()});
await page.waitForTimeout(300);
types=await page.evaluate(()=>DB.tracks[0].sections[0].sleepers.map(s=>s.type));
rw=await page.evaluate(()=>!!DB.tracks[0].sections[0].rw);
const verifOn=await page.evaluate(()=>!!_verifMode);
ok('Баталгаажуулах горим асав',verifOn);
ok('Баталгаажуулах нээхэд ЭРГЭСЭН: [bad,normal,normal], rw=1 (АЛДААГ ЗАСАВ)',
   JSON.stringify(types)==='["bad","normal","normal"]'&&rw,JSON.stringify({types,rw}));

// 4) #1-ийг "bad" гэж шалгахад ЗӨРӨӨГҮЙ (match) байх ёстой — учир нь
//    эргэсний дараа sleepers[0] нь ЖИНХЭНЭ #1 (хол талын bad дэр)
await page.evaluate(()=>recordVerif('bad'));
await page.waitForTimeout(200);
const log0=await page.evaluate(()=>_verifLog[0]);
ok('#1-ийг bad гэж баталгаажуулахад ЗӨРӨӨГҮЙ (match=true)',
   log0&&log0.match===true,JSON.stringify(log0));

// 5) Дуусгаад бүрэн гарахад буцаад жинхэнэ дараалалдаа орно
await page.evaluate(()=>{endVerification();goTrack()});
await page.waitForTimeout(300);
types=await page.evaluate(()=>DB.tracks[0].sections[0].sleepers.map(s=>s.type));
rw=await page.evaluate(()=>!!DB.tracks[0].sections[0].rw);
ok('Бүх мөчлөгийн эцэст жинхэнэ дараалал сэргэсэн, rw байхгүй',
   JSON.stringify(types)==='["normal","normal","bad"]'&&!rw,JSON.stringify({types,rw}));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
