/* ══════════════════════════════════════════════════════════════
   _packDB — ГАРАЛТ ӨӨРЧЛӨГДӨӨГҮЙ ЭСЭХ

   v107-т дэр товших бүрд хийгддэг гүн хуулалтыг (нийт зардлын 88%)
   арилгав. Шахалтын гаралт нь ХУУЛИЙН БИЧИГ БАРИМТ болох ПУ-5
   дэвтэрийн эх өгөгдөл тул хуучин алгоритмтай ЯГ адилхан байх ёстой.
   Энд хуучин хувилбарыг сэргээж, шинэтэй нь тулгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

const r=await page.evaluate(()=>{
  // ── Хуучин хувилбар (v106) ──
  const oldPack=db=>{
    const d=JSON.parse(JSON.stringify(db));
    const walk=t=>(t.sections||[]).forEach(s=>{
      if(Array.isArray(s.sleepers))s.sleepers=s.sleepers.map(sl=>_SLMAP[sl.type]||'n').join('')
    });
    (d.folders||[]).forEach(f=>(f.tracks||[]).forEach(walk));
    (d.main||[]).forEach(walk);
    d.tracks=[];
    return d
  };

  // ── Бүх талбарыг хамарсан баялаг өгөгдөл ──
  const mkSec=(id,n,opt)=>{
    const s={id,type:'normal',label:id+' үе',note:'тайлбар',date:'2026-05-01',
      sleepers:Array.from({length:n},(_,i)=>({type:['normal','bad','tbd','bad_tbd'][i%4],ts:i*7}))};
    Object.assign(s,opt||{});
    return s};
  DB.location='Шивээговь';
  DB.rpt={cls:'3',sec:'6',secName:'ПД-6',season:'хавар',year:'2026',date:'2026-04-01'};
  DB.folders=[{id:'f1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    tracks:[
      {id:'t1',num:1,kind:'station',note:'зөрлөг',sections:[
        mkSec('s1',46,{repl:{3:{d:'2026-05-12',t:'normal',m:'wood',o:1,s:1},
                             9:{d:'2026-06-01',t:'tbd',m:'tbd',o:2}}}),
        mkSec('s2',46,{manual:{normal:40,bad:6},type:'connecting'}),
        mkSec('s3',0),                       // хоосон үе
        mkSec('s4',1),                       // ганц дэр
        {id:'sw1',type:'turnout',label:'5-р сум',note:'',num:5,btw:{a:1,b:2},sleepers:[]}]},
      {id:'t2',num:2,kind:'station',sections:[]}]},
    {id:'f2',name:'Намар 2026',season:'намар',year:'2026',date:'2026-09-01',sc:'ПД-6',tracks:[]}];
  activeFolderId='f1';DB.tracks=DB.folders[0].tracks;
  DB.main=[{id:'m12',num:12,kind:'main',mat:'tbd',fast:'CZ',
    sections:[mkSec('mm',46,{repl:{7:{d:'2026-05-12',t:'normal',m:'wood',o:1}}})]},
    {id:'m13',num:13,kind:'main',mat:'wood',sections:[]}];
  let it='';for(let i=0;i<84;i++)it+=(i%11===0?'b':'n');
  DB.sw=[{id:'sf',name:'Зун',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:[{id:'w1',num:1,station:'Шивээговь',mak:'Р-65',mark:'1/11',proj:'2764',
      head:4,it,dRepl:{5:{d:'2026-05-12',L:2.7,o:1}}}]}];
  swFolderId='sf';

  const a=oldPack(DB), b=_packDB(DB);
  const sa=JSON.stringify(a), sb=JSON.stringify(b);

  // Ялгаа гарвал хаана байгааг олно
  let diff='';
  if(sa!==sb){
    const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();
    if(ka.join()!==kb.join())diff='дээд түвшний талбар: '+ka.join()+' ≠ '+kb.join();
    else for(const k of ka){
      if(JSON.stringify(a[k])!==JSON.stringify(b[k])){diff='талбар "'+k+'" зөрж байна';break}
    }
  }

  // Хурд
  const avg=(f,n)=>{const t=[];for(let i=0;i<n;i++){const s=performance.now();f();t.push(performance.now()-s)}
    t.sort((x,y)=>x-y);return t[n>>1]};
  const tOld=avg(()=>oldPack(DB),30), tNew=avg(()=>_packDB(DB),30);

  // Гаралт нь DB-г ЗАСААГҮЙ байх ёстой
  const before=JSON.stringify(DB);
  _packDB(DB); saveDB();
  const after=JSON.stringify(DB);

  // Шахаад буцааж задлахад анхны төлөвт эргэж ирэх ёстой
  const round=_unpackDB(JSON.parse(JSON.stringify(_packDB(DB))));
  const rt=JSON.stringify((round.folders||[]).map(f=>(f.tracks||[])
        .map(t=>(t.sections||[]).map(x=>(x.sleepers||[]).map(y=>y.type)))))
     ===JSON.stringify((DB.folders||[]).map(f=>(f.tracks||[])
        .map(t=>(t.sections||[]).map(x=>(x.sleepers||[]).map(y=>y.type)))));

  return {ижил:sa===sb,diff,tOld:+tOld.toFixed(2),tNew:+tNew.toFixed(2),
    dbHevereer:before===after,round:rt,
    hemjee:Math.round(sb.length/1024)};
});

ok('Гаралт хуучин хувилбартай ЯГ ижил',r.ижил,r.diff||('~'+r.hemjee+' КиБ'));
ok('_packDB нь DB-г засдаггүй',r.dbHevereer);
ok('Шахаад задлахад дэрийн төрөл хэвээр',r.round);
ok('Хурд сайжирсан (жижиг өгөгдөл)',r.tNew<=r.tOld,'хуучин '+r.tOld+' мс → шинэ '+r.tNew+' мс');

/* ── 13 хэсгийн БОДИТ хэмжээгээр ────────────────────────────
   Гол зам 23км × 20 үе + өртөө 7 зам × 8 үе + 17 сум */
const big=await page.evaluate(()=>{
  const oldPack=db=>{
    const d=JSON.parse(JSON.stringify(db));
    const walk=t=>(t.sections||[]).forEach(s=>{
      if(Array.isArray(s.sleepers))s.sleepers=s.sleepers.map(sl=>_SLMAP[sl.type]||'n').join('')
    });
    (d.folders||[]).forEach(f=>(f.tracks||[]).forEach(walk));
    (d.main||[]).forEach(walk);
    d.tracks=[];return d};
  const mkSec=(id,n)=>({id,type:'normal',label:id,note:'',date:'2026-05-01',
    repl:{2:{d:'2026-05-12',t:'normal',m:'wood',o:1}},
    sleepers:Array.from({length:n},(_,i)=>({type:['normal','bad','tbd','bad_tbd'][i%4],ts:i}))});
  const mains=[];for(let k=1;k<=23;k++)mains.push({id:'m'+k,num:k,kind:'main',mat:'tbd',fast:'CZ',
    sections:Array.from({length:20},(_,j)=>mkSec('m'+k+'_'+j,46))});
  DB.main=mains;
  const tracks=[];for(let z=1;z<=7;z++)tracks.push({id:'t'+z,num:z,kind:'station',note:'',
    sections:Array.from({length:8},(_,j)=>mkSec('t'+z+'_'+j,46))});
  DB.folders=[{id:'fbig',name:'Хавар',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',tracks}];
  activeFolderId='fbig';DB.tracks=tracks;
  let it='';for(let i=0;i<84;i++)it+=(i%13===0?'b':'n');
  DB.sw=[{id:'sf',name:'Зун',season:'зун',year:'2026',date:'2026-06-01',sc:'ПД-6',
    turnouts:Array.from({length:17},(_,i)=>({id:'w'+i,num:i+1,station:'Ш',mak:'Р-65',
      mark:'1/11',proj:'2764',head:4,it}))}];
  swFolderId='sf';
  const avg=(f,n)=>{const t=[];for(let i=0;i<n;i++){const s=performance.now();f();t.push(performance.now()-s)}
    t.sort((x,y)=>x-y);return t[n>>1]};
  const sa=JSON.stringify(oldPack(DB)),sb=JSON.stringify(_packDB(DB));
  return {ижил:sa===sb,hemjee:Math.round(sb.length/1024),
    tOld:+avg(()=>oldPack(DB),20).toFixed(2),
    tNew:+avg(()=>_packDB(DB),20).toFixed(2),
    tSave:+avg(()=>saveDB(),20).toFixed(2)}});
ok('Бодит хэмжээнд ч гаралт ижил',big.ижил,'~'+big.hemjee+' КиБ');
ok('Бодит хэмжээнд хурд дор хаяж 2 дахин сайжирсан',big.tNew*2<=big.tOld,
   'хуучин '+big.tOld+' мс → шинэ '+big.tNew+' мс  (saveDB '+big.tSave+' мс)');

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
