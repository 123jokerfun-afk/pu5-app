const B=require('./base'),S=require('./seed');
const R=[];function ok(n,c,d){R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))}
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

// _fsSize нь Firestore-ын дүрмийг зөв дагаж байна уу
const unit=await page.evaluate(()=>({
  str:_fsSize('abc'),          // 3+1
  cyr:_fsSize('аб'),           // кирилл = 2 байт тус бүр → 4+1
  num:_fsSize(5),              // 8
  emptyMap:_fsSize({}),        // 32
  emptyArr:_fsSize([]),        // 32
  map:_fsSize({a:1})           // 32 + (1+1) + 8
}));
ok('Латин мөр',unit.str===4,unit.str);
ok('Кирилл 2 байт',unit.cyr===5,unit.cyr);
ok('Тоо 8 байт',unit.num===8,unit.num);
ok('Map нэмэлт 32',unit.emptyMap===32,unit.emptyMap);
ok('Массив нэмэлт 32',unit.emptyArr===32,unit.emptyArr);
ok('Map + талбар',unit.map===42,unit.map);

const real=await page.evaluate(()=>({b:docBytes(),lim:DOC_LIMIT,f:fmtBytes(docBytes())}));
ok('Бодит өгөгдлийн хэмжээ гарав',real.b>100&&real.b<real.lim,real.f);
ok('Хязгаар 1 МиБ',real.lim===1048576,real.lim);

// Форматлалт
const fm=await page.evaluate(()=>[fmtBytes(500),fmtBytes(2048),fmtBytes(92104),fmtBytes(2623704)]);
ok('Хэмжээ уншигдахуйц',JSON.stringify(fm)==='["500 Б","2.0 КБ","90 КБ","2.50 МБ"]',JSON.stringify(fm));

// ── Хязгаар давсан үед бичихийг завдахгүй ──
const big=await page.evaluate(()=>{
  const mkSec=(i,n)=>{const s={id:'s'+i,name:'ПК '+i,km:12,pk:i,len:n,
    sleepers:Array.from({length:n},()=>({type:'normal',ts:0})),slRepl:{}};
    for(let k=0;k<n;k++)s.slRepl[k]={d:'2026-05-12',o:'ЖД',t:'shpal'};return s};
  DB.folders=[{id:'fbig',name:'Том',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    tracks:[{id:'tb',num:1,name:'Зам',type:'station',
      sections:Array.from({length:400},(_,k)=>mkSec(k,100))}]}];
  DB.tracks=DB.folders[0].tracks;
  const bytes=docBytes();
  _lastSaveErr='';
  const r=flushSave(true);
  return {bytes,f:fmtBytes(bytes),flushReturned:r,err:_lastSaveErr}});
ok('Том өгөгдөл 1 МиБ давав',big.bytes>1048576,big.f);
ok('Бичихийг завдсангүй',big.flushReturned===false,'flushSave='+big.flushReturned);
ok('Шалтгааныг тэмдэглэв',/Хэмжээ хэтэрсэн/.test(big.err),big.err);

// Мэдэгдэл дээр харагдана уу
const sheet=await page.evaluate(()=>{openSyncSheet();
  const b=document.getElementById('syncBody');
  return {meter:!!b.querySelector('.sy-meter'),bar:(b.querySelector('.sy-bar i')||{}).style?.width,
    errShown:/Илгээхэд алдаа/.test(b.textContent),txt:b.textContent.replace(/\s+/g,' ').slice(0,150)}});
ok('Хэмжигч харагдав',sheet.meter);
ok('Улаан бүсэд дүүрсэн',parseFloat(sheet.bar)===100,sheet.bar);
ok('Алдааны шалтгаан харагдав',sheet.errShown);

// Профайл дээрх мөр
const pf=await page.evaluate(()=>{closeModal('syncSheet');openProfSheet();
  const t=document.getElementById('profBody').textContent;
  return {has:/Хамгийн том паспорт/.test(t),txt:t.replace(/\s+/g,' ').match(/Хамгийн том паспорт[^›]*/)?.[0]||''}});
ok('Профайл дээр хэмжээ',pf.has,pf.txt.trim());

// Хэвийн хэмжээнд эргэж ороход дахин илгээнэ
const back=await page.evaluate(()=>{DB.folders=[];DB.tracks=[];
  return {bytes:docBytes(),blocked:docBytes()>DOC_LIMIT}});
ok('Багасгавал хязгаарт багтав',!back.blocked,fmtBytes=back.bytes);

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();
process.exit(R.every(Boolean)?0:1);
})();
