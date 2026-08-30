// Хоёр утас зэрэг ажиллах — тусдаа баримт болсны гол ашиг.
// Өмнө нь бүтэн баримтыг бичдэг тул сүүлд хадгалсан нь нөгөөгийн
// ажлыг дардаг байв. Одоо өөр өөр паспорт хөндөлдөхгүй байх ёстой.
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

const r=await page.evaluate(async()=>{
  // Хуваалцсан "үүл" — хоёр төхөөрөмж нэг дэд бүлэг рүү бичнэ
  const cloud={};
  const mk=id=>({set:v=>{cloud[id]=JSON.parse(JSON.stringify(v));return Promise.resolve()},
    delete:()=>{delete cloud[id];return Promise.resolve()},
    get:()=>Promise.resolve({exists:!!cloud[id],data:()=>cloud[id]})});
  fbDb.collection=()=>({doc:()=>({
    get:()=>Promise.resolve({exists:false,data:()=>null}),
    set:()=>Promise.resolve(),onSnapshot:()=>()=>{},
    collection:()=>({doc:mk,
      get:()=>Promise.resolve({empty:!Object.keys(cloud).length,
        forEach:f=>Object.keys(cloud).forEach(k=>f({id:k,data:()=>cloud[k]}))})})})});
  fbDb.batch=()=>{const ops=[];return {set:(r,v)=>ops.push(()=>r.set(v)),
    delete:r=>ops.push(()=>r.delete()),
    commit:()=>Promise.all(ops.map(f=>f()))}};

  const mkSec=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},()=>({type:'normal',ts:0}))});
  const base=()=>({location:'ПД-6',v:3,tracks:[],rpt:{},main:[],sw:[],
    folders:[
      {id:'fA',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
       tracks:[{id:'tA',num:1,kind:'station',sections:[mkSec('a1',10)]}]},
      {id:'fB',name:'Намар',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',
       tracks:[{id:'tB',num:1,kind:'station',sections:[mkSec('b1',10)]}]}]});

  // Утас бүр ӨӨРИЙН хэшийн санамжтай — түүнийг хадгалж/сэргээж
  // хоёр тусдаа төхөөрөмжийг дуурайна
  const HK='sg_parts_'+(_sectionCode||'');
  const saveH=()=>localStorage.getItem(HK);
  const loadH=h=>{h?localStorage.setItem(HK,h):localStorage.removeItem(HK)};
  const wrote=()=>{const w=[];const oc=fbDb.collection;
    return {list:w,stop:()=>{fbDb.collection=oc}}};

  // Хоёулаа ижил суурьтай эхэлнэ
  DB=_unpackDB(base()); _clearPartHashes();
  await _pushCloud(_packDB(DB));
  const keys0=Object.keys(cloud).sort();
  const H0=saveH();                       // хоёр утасны нийтлэг эхлэл

  // Утас 1: ЗӨВХӨН Хавар паспортыг засна
  const seen1=[];const s1=Object.keys(cloud).slice();
  loadH(H0);
  const d1=_unpackDB(base());
  d1.folders[0].tracks[0].sections[0].sleepers[0].type='bad';
  DB=d1;
  const before1=JSON.stringify(cloud);
  await _pushCloud(_packDB(DB));
  Object.keys(cloud).forEach(k=>{if(JSON.parse(before1)[k]===undefined
    ||JSON.stringify(JSON.parse(before1)[k])!==JSON.stringify(cloud[k]))seen1.push(k)});

  // Утас 2: ӨӨРИЙН хуучин хуулбараас Намар паспортыг засна
  //         (Утас 1-ийн өөрчлөлтийг мэдэхгүй)
  const seen2=[];
  loadH(H0);                              // утас 2-ын санамж — хуучин
  const d2=_unpackDB(base());
  d2.folders[1].tracks[0].sections[0].sleepers[0].type='tbd';
  DB=d2;
  const before2=JSON.stringify(cloud);
  await _pushCloud(_packDB(DB));
  Object.keys(cloud).forEach(k=>{if(JSON.stringify(JSON.parse(before2)[k])!==JSON.stringify(cloud[k]))seen2.push(k)});

  // Үүлнээс буцааж угсарна
  const parts={};Object.keys(cloud).forEach(k=>parts[k]=cloud[k]);
  const merged=_unpackDB(_joinParts(parts));
  const fA=merged.folders.find(f=>f.id==='fA');
  const fB=merged.folders.find(f=>f.id==='fB');
  return {keys0,keys:Object.keys(cloud).sort(),seen1,seen2,
    a:fA&&fA.tracks[0].sections[0].sleepers[0].type,
    b:fB&&fB.tracks[0].sections[0].sleepers[0].type};
});

ok('Паспорт бүр тусдаа баримттай',
  JSON.stringify(r.keys)==='["main","meta","p_fA","p_fB"]',JSON.stringify(r.keys));
ok('Утас 1-ийн засвар үлдэв (Хавар)',r.a==='bad','a='+r.a);
ok('Утас 2-ийн засвар үлдэв (Намар)',r.b==='tbd','b='+r.b);
ok('Хоёулаа зэрэг хадгалагдав — дарж устгаагүй',r.a==='bad'&&r.b==='tbd');
ok('Утас 1 ЗӨВХӨН өөрийн паспортыг бичив',
  JSON.stringify(r.seen1)==='["p_fA"]',JSON.stringify(r.seen1));
ok('Утас 2 ЗӨВХӨН өөрийн паспортыг бичив',
  JSON.stringify(r.seen2)==='["p_fB"]',JSON.stringify(r.seen2));

// Нэг паспортыг ХОЁУЛАА засвал сүүлийнх нь хүчинтэй (энэ нь хэвийн)
const same=await page.evaluate(async()=>{
  const cloud={};
  const mk=id=>({set:v=>{cloud[id]=JSON.parse(JSON.stringify(v));return Promise.resolve()},
    delete:()=>{delete cloud[id];return Promise.resolve()}});
  fbDb.collection=()=>({doc:()=>({collection:()=>({doc:mk})})});
  fbDb.batch=()=>{const ops=[];return {set:(r,v)=>ops.push(()=>r.set(v)),
    delete:r=>ops.push(()=>r.delete()),commit:()=>Promise.all(ops.map(f=>f()))}};
  const mkSec=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},()=>({type:'normal',ts:0}))});
  const one=()=>({location:'ПД-6',v:3,tracks:[],rpt:{},main:[],sw:[],
    folders:[{id:'fA',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      tracks:[{id:'tA',num:1,kind:'station',sections:[mkSec('a1',10)]}]}]});
  const x=_unpackDB(one()); x.folders[0].tracks[0].sections[0].sleepers[0].type='bad';
  DB=x;_clearPartHashes();await _pushCloud(_packDB(DB));
  const y=_unpackDB(one()); y.folders[0].tracks[0].sections[0].sleepers[0].type='tbd';
  DB=y;_clearPartHashes();await _pushCloud(_packDB(DB));
  const m=_unpackDB(_joinParts(cloud));
  return m.folders[0].tracks[0].sections[0].sleepers[0].type});
ok('Нэг паспортыг хоёулаа засвал сүүлийнх нь',same==='tbd','='+same);

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
