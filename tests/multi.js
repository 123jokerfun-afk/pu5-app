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
    get:()=>Promise.resolve({exists:id in cloud,data:()=>cloud[id]}),
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

/* ══════════════════════════════════════════════════════════════
   ӨӨР НЭГЖ (зам/км/сум) дээр хоёулаа зэрэг засвал — ХОЁУЛАНГИЙНХ нь
   хадгалагдана (v193 засвар). Жишээ: нэг паспорт дотор 2-р зам дээр
   нэг хүн, 3-р зам дээр нөгөө хүн зэрэг бүртгэл хийх тохиолдол.
   _writeParts() одоо main/p_.../s_... хэсгийг транзакцаар НЭГЖИЙН
   түвшинд нэгтгэдэг тул дээрх "сүүлийнх нь хүчинтэй" ЗӨВХӨН яг ижил
   нэгж дээр л хэвээр байна — өөр нэгжийн хооронд алдагдал гарахгүй.
   ══════════════════════════════════════════════════════════════ */
console.log('\nӨӨР нэгж дээр зэрэг ажиллах (v193)');

// ── Жишээ 1: нэг паспорт дотор 2-р зам / 3-р зам ──
const diffTrack=await page.evaluate(async()=>{
  const cloud={};
  const mk=id=>({set:v=>{cloud[id]=JSON.parse(JSON.stringify(v));return Promise.resolve()},
    get:()=>Promise.resolve({exists:id in cloud,data:()=>cloud[id]}),
    delete:()=>{delete cloud[id];return Promise.resolve()}});
  fbDb.collection=()=>({doc:()=>({collection:()=>({doc:mk})})});
  fbDb.batch=()=>{const ops=[];return {set:(r,v)=>ops.push(()=>r.set(v)),
    delete:r=>ops.push(()=>r.delete()),commit:()=>Promise.all(ops.map(f=>f()))}};
  const mkSec=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},()=>({type:'normal',ts:0}))});
  const base=()=>({location:'ПД-6',v:3,tracks:[],rpt:{},main:[],sw:[],
    folders:[{id:'fT',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      tracks:[{id:'t2',num:2,kind:'station',sections:[mkSec('s2',10)]},
              {id:'t3',num:3,kind:'station',sections:[mkSec('s3',10)]}]}]});

  // Эхлэлийн нийтлэг төлвийг илгээгээд хоёр "утасны" мэдэх суурь болгоно
  DB=_unpackDB(base());_clearPartHashes();localStorage.removeItem(_unitsKey());
  await _pushCloud(_packDB(DB));
  const H0u=localStorage.getItem(_unitsKey()),H0p=localStorage.getItem(_partsKey());

  // Утас А: ЗӨВХӨН 2-р замдаа бичнэ (ижил эхлэлийн суурьтай)
  localStorage.setItem(_unitsKey(),H0u);localStorage.setItem(_partsKey(),H0p);
  const A=_unpackDB(base());
  A.folders[0].tracks[0].sections[0].sleepers[0].type='bad';
  DB=A;await _pushCloud(_packDB(DB));

  // Утас Б: А-гийн өөрчлөлтийг МЭДЭХГҮЙ, ЗӨВХӨН 3-р замдаа бичнэ
  localStorage.setItem(_unitsKey(),H0u);localStorage.setItem(_partsKey(),H0p);
  const Bd=_unpackDB(base());
  Bd.folders[0].tracks[1].sections[0].sleepers[0].type='tbd';
  DB=Bd;await _pushCloud(_packDB(DB));

  const merged=_unpackDB(_joinParts(cloud)),f=merged.folders[0];
  return {t2:f.tracks.find(t=>t.id==='t2').sections[0].sleepers[0].type,
          t3:f.tracks.find(t=>t.id==='t3').sections[0].sleepers[0].type}
});
ok('2-р зам / 3-р зам дээр зэрэг бичвэл ХОЁУЛАНГИЙНХ нь хадгалагдана',
   diffTrack.t2==='bad'&&diffTrack.t3==='tbd',JSON.stringify(diffTrack));

// ── Жишээ 2: гол замын 5-р км / 7-р км ──
const diffKm=await page.evaluate(async()=>{
  const cloud={};
  const mk=id=>({set:v=>{cloud[id]=JSON.parse(JSON.stringify(v));return Promise.resolve()},
    get:()=>Promise.resolve({exists:id in cloud,data:()=>cloud[id]}),
    delete:()=>{delete cloud[id];return Promise.resolve()}});
  fbDb.collection=()=>({doc:()=>({collection:()=>({doc:mk})})});
  fbDb.batch=()=>{const ops=[];return {set:(r,v)=>ops.push(()=>r.set(v)),
    delete:r=>ops.push(()=>r.delete()),commit:()=>Promise.all(ops.map(f=>f()))}};
  const mkSec=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    sleepers:Array.from({length:n},()=>({type:'normal',ts:0}))});
  const base=()=>({location:'ПД-6',v:3,tracks:[],rpt:{},folders:[],sw:[],
    main:[{id:'km5',num:5,kind:'main',mat:'wood',sections:[mkSec('k5',10)]},
          {id:'km7',num:7,kind:'main',mat:'wood',sections:[mkSec('k7',10)]}]});

  DB=_unpackDB(base());_clearPartHashes();localStorage.removeItem(_unitsKey());
  await _pushCloud(_packDB(DB));
  const H0u=localStorage.getItem(_unitsKey()),H0p=localStorage.getItem(_partsKey());

  // Утас А: ЗӨВХӨН 5-р км дээрээ бичнэ
  localStorage.setItem(_unitsKey(),H0u);localStorage.setItem(_partsKey(),H0p);
  const A=_unpackDB(base());
  A.main[0].sections[0].sleepers[0].type='bad';
  DB=A;await _pushCloud(_packDB(DB));

  // Утас Б: А-гийн өөрчлөлтийг МЭДЭХГҮЙ, ЗӨВХӨН 7-р км дээрээ бичнэ
  localStorage.setItem(_unitsKey(),H0u);localStorage.setItem(_partsKey(),H0p);
  const Bd=_unpackDB(base());
  Bd.main[1].sections[0].sleepers[0].type='tbd';
  DB=Bd;await _pushCloud(_packDB(DB));

  const merged=_unpackDB(_joinParts(cloud));
  return {km5:merged.main.find(k=>k.id==='km5').sections[0].sleepers[0].type,
          km7:merged.main.find(k=>k.id==='km7').sections[0].sleepers[0].type}
});
ok('5-р км / 7-р км дээр зэрэг бичвэл ХОЁУЛАНГИЙНХ нь хадгалагдана',
   diffKm.km5==='bad'&&diffKm.km7==='tbd',JSON.stringify(diffKm));

// ── Жишээ 3: нэг сумын паспорт дотор 2 өөр сум (тэгш хэмийн баталгаа) ──
const diffSw=await page.evaluate(async()=>{
  const cloud={};
  const mk=id=>({set:v=>{cloud[id]=JSON.parse(JSON.stringify(v));return Promise.resolve()},
    get:()=>Promise.resolve({exists:id in cloud,data:()=>cloud[id]}),
    delete:()=>{delete cloud[id];return Promise.resolve()}});
  fbDb.collection=()=>({doc:()=>({collection:()=>({doc:mk})})});
  fbDb.batch=()=>{const ops=[];return {set:(r,v)=>ops.push(()=>r.set(v)),
    delete:r=>ops.push(()=>r.delete()),commit:()=>Promise.all(ops.map(f=>f()))}};
  const base=()=>({location:'ПД-6',v:3,tracks:[],rpt:{},main:[],folders:[],
    sw:[{id:'swF',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      turnouts:[{id:'w1',num:1,mak:'Р-65',mark:'1/9',head:0,it:'nn',dRepl:{}},
                {id:'w2',num:2,mak:'Р-65',mark:'1/9',head:0,it:'nn',dRepl:{}}]}]});

  DB=_unpackDB(base());_clearPartHashes();localStorage.removeItem(_unitsKey());
  await _pushCloud(_packDB(DB));
  const H0u=localStorage.getItem(_unitsKey()),H0p=localStorage.getItem(_partsKey());

  // Утас А: ЗӨВХӨН 1-р сум дээрээ бичнэ
  localStorage.setItem(_unitsKey(),H0u);localStorage.setItem(_partsKey(),H0p);
  const A=_unpackDB(base());
  A.sw[0].turnouts[0].it='bn';
  DB=A;await _pushCloud(_packDB(DB));

  // Утас Б: А-гийн өөрчлөлтийг МЭДЭХГҮЙ, ЗӨВХӨН 2-р сум дээрээ бичнэ
  localStorage.setItem(_unitsKey(),H0u);localStorage.setItem(_partsKey(),H0p);
  const Bd=_unpackDB(base());
  Bd.sw[0].turnouts[1].it='nb';
  DB=Bd;await _pushCloud(_packDB(DB));

  const merged=_unpackDB(_joinParts(cloud)),f=merged.sw[0];
  return {w1:f.turnouts.find(t=>t.id==='w1').it,w2:f.turnouts.find(t=>t.id==='w2').it}
});
ok('Нэг сумын паспорт дотор 2 өөр сум дээр зэрэг бичвэл ХОЁУЛАНГИЙНХ нь хадгалагдана',
   diffSw.w1==='bn'&&diffSw.w2==='nb',JSON.stringify(diffSw));

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
