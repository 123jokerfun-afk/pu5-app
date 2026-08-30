// Ирмэгийн тохиолдол, өгөгдлийн бүрэн бүтэн байдал, аюулгүй байдал
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

// ── 1. Шахалт/задлалтын бүрэн бүтэн байдал ──
const rt=await page.evaluate(()=>{
  const mkUe=(id,n,repl)=>{const s={id,type:'normal',label:id+'-р үе',note:'тэмдэглэл',
    date:'2026-05-01',sleepers:Array.from({length:n},(_,i)=>({type:['normal','bad','tbd','bad_tbd'][i%4],ts:0}))};
    if(repl)s.repl={0:{d:'2026-05-12',t:'normal',m:'wood',o:1},2:{d:'2026-05-13',t:'tbd',m:'tbd',s:1,o:1}};
    return s};
  DB.folders=[{id:'f1',name:'Тест',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[{id:'t1',num:1,kind:'station',sections:[mkUe('u1',8,true),mkUe('u2',0),mkUe('u3',1)]}]}];
  DB.tracks=DB.folders[0].tracks;
  DB.main=[{id:'km1',num:5,kind:'main',mat:'tbd',fast:'CZ',sections:[mkUe('m1',40,true)]}];
  DB.sw=[{id:'s1',name:'Сум',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,station:'Ш',mak:'Р-65',mark:'1/11',proj:'2764',head:4,
      it:'nbnbnnbb',dRepl:{1:{d:'2026-05-12',L:2.7,o:1}}}]}];
  const a=_packDB(DB);
  const b=_unpackDB(JSON.parse(JSON.stringify(a)));
  const c=_packDB(b);
  // Дэрийн ТӨРӨЛ бүрэн эсэх
  const t0=DB.folders[0].tracks[0].sections[0].sleepers.map(x=>x.type).join(',');
  const t1=b.folders[0].tracks[0].sections[0].sleepers.map(x=>x.type).join(',');
  return {same:JSON.stringify(a)===JSON.stringify(c),types:t0===t1,t0,t1,
    repl:JSON.stringify(b.folders[0].tracks[0].sections[0].repl||{}),
    dRepl:JSON.stringify(b.sw[0].turnouts[0].dRepl||{}),
    empty:b.folders[0].tracks[0].sections[1].sleepers.length,
    one:b.folders[0].tracks[0].sections[2].sleepers.length}});
ok('Шахаад задлахад ЯГ адилхан',rt.same);
ok('Дэрийн 4 төрөл бүгд хадгалагдав',rt.types,rt.t1);
ok('Солилтын бүртгэл хэвээр',/2026-05-12/.test(rt.repl)&&/"s":1/.test(rt.repl));
ok('Сумын солилт хэвээр',/2026-05-12/.test(rt.dRepl));
ok('0 дэртэй үе гацахгүй',rt.empty===0,'дэр='+rt.empty);
ok('1 дэртэй үе зөв',rt.one===1);

// ── 2. Хэсэгт хуваагаад буцаахад ── 
const sp=await page.evaluate(()=>{
  const p=_packDB(DB);
  return _cmpKey(_joinParts(_splitDB(p)))===_cmpKey(p)});
ok('Хэсэгт хуваагаад нийлүүлэхэд адилхан',sp);

// ── 3. HTML тарилтаас хамгаалагдсан эсэх ──
const inj=await page.evaluate(()=>{
  const bad='<img src=x onerror="window.__pwn=1">';
  DB.location=bad;
  DB.folders[0].name=bad;
  DB.sw[0].turnouts[0].station=bad;
  saveDB();renderHome();renderSwHome();
  goSwHome();openSwFolderView('s1');
  return {pwn:!!window.__pwn,
    imgs:document.querySelectorAll('img[src="x"]').length,
    shown:document.body.textContent.indexOf('onerror')>=0}});
ok('Скрипт ажиллаагүй',inj.pwn===false);
ok('img элемент үүсээгүй',inj.imgs===0,'img='+inj.imgs);
ok('Текст болгож харуулав',inj.shown===true);

// ── 4. Тайлангууд гацахгүй ──
const rep=await page.evaluate(()=>{
  DB.location='ПД-6';DB.folders[0].name='Тест';
  activeFolderId='f1';DB.tracks=DB.folders[0].tracks;
  const out={};
  try{out.repl=collectRepl().length;out.replOk=true}catch(e){out.replOk=false;out.replErr=e.message}
  try{out.cons=collectConsec().length;out.consOk=true}catch(e){out.consOk=false;out.consErr=e.message}
  try{out.tot=replTotalCount();out.totOk=true}catch(e){out.totOk=false}
  return out});
ok('Сольсон дэрийн тайлан',rep.replOk,'мөр='+rep.repl+(rep.replErr||''));
ok('Дараалсан цэгийн тайлан',rep.consOk,'бүлэг='+rep.cons+(rep.consErr||''));
ok('Нийт солилтын тоо',rep.totOk,'='+rep.tot);

// ── 5. Хоосон байдал (юу ч байхгүй) ──
const zero=await page.evaluate(()=>{
  DB.folders=[];DB.tracks=[];DB.main=[];DB.sw=[];activeFolderId=null;
  let e1=null,e2=null;
  try{renderHome()}catch(e){e1=e.message}
  try{goSwHome();renderSwHome()}catch(e){e2=e.message}
  const packed=_packDB(DB);
  return {e1,e2,parts:Object.keys(_splitDB(packed)).sort(),
    home:document.getElementById('hsTotal').textContent}});
ok('Хоосон үед нүүр гацахгүй',zero.e1===null,zero.e1||'ok');
ok('Хоосон үед СШ гацахгүй',zero.e2===null,zero.e2||'ok');
ok('Хоосон үед ч meta+main үүснэ',JSON.stringify(zero.parts)==='["main","meta"]',JSON.stringify(zero.parts));

// ── 6. Маш том тоо ──
const big=await page.evaluate(()=>{
  let it='';for(let i=0;i<5000;i++)it+=i%3?'n':'b';
  DB.sw=[{id:'sb',name:'Том',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'wb',num:1,station:'Ш',mak:'Р-65',mark:'1/11',proj:'2764',head:4,it,dRepl:{}}]}];
  const t0=performance.now();
  const a=swTally(DB.sw[0].turnouts[0]);
  const ms=performance.now()-t0;
  return {total:a.total,ms:Math.round(ms)}});
ok('5000 дүнз тооцоолов',big.total>0,'нийт='+big.total+' '+big.ms+'мс');
ok('Удаашраагүй (<400мс)',big.ms<400,big.ms+'мс');

// ── 7. Firestore-ын нэрийн дүрэм — хачин id ──
const ids=await page.evaluate(()=>{
  DB.folders=[{id:'ф-1/2\\\\3',name:'A',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',tracks:[]},
              {id:'__x__',name:'B',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',tracks:[]}];
  return Object.keys(_splitDB(_packDB(DB)))});
const badId=ids.filter(x=>/^__.*__$/.test(x)||x.includes('/')||x==='.'||x==='..');
ok('Хачин id-аас хүчинтэй нэр гарав',badId.length===0,JSON.stringify(ids));
// Кирилл id-ууд ижил нэр рүү БУУРАХГҮЙ байх (өмнө нь дарж устгах эрсдэлтэй байв)
const coll=await page.evaluate(()=>{
  const a=_partId('p','ф-1'), b=_partId('p','х-1'), c=_partId('p','ф-1');
  return {a,b,c,same:a===b,stable:a===c}});
ok('Өөр кирилл id → өөр нэр',coll.same===false,coll.a+' vs '+coll.b);
ok('Ижил id → ижил нэр (тогтвортой)',coll.stable===true);

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
