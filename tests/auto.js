// Автомат шилжилт — унтраалгагүй болсны дараах ажиллагаа
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

await page.evaluate(()=>{
  window.__c={parts:{},old:null,arch:false,wOld:0,wParts:0,rOld:0,rParts:0,
    failParts:false,listen:null};
  const mkSnap=o=>({empty:!Object.keys(o).length,metadata:{hasPendingWrites:false},
    forEach:f=>Object.keys(o).forEach(k=>f({id:k,data:()=>o[k]}))});
  fbDb.collection=()=>({doc:()=>({
    get:()=>{__c.rOld++;return Promise.resolve({exists:!!__c.old,
      data:()=>Object.assign({db:__c.old,updatedAt:{toMillis:()=>1}},
        __c.arch?{archivedAt:1}:{})})},
    set:(d)=>{__c.wOld++;__c.old=d.db;return Promise.resolve()},
    onSnapshot:()=>{__c.listen='doc';return ()=>{}},
    collection:()=>({
      get:()=>{__c.rParts++;
        return __c.failParts?Promise.reject(new Error('сүлжээ тасарлаа'))
          :Promise.resolve(mkSnap(__c.parts))},
      onSnapshot:()=>{__c.listen='parts';return ()=>{}},
      doc:id=>({set:v=>{__c.wParts++;__c.parts[id]=v;return Promise.resolve()},
        get:()=>Promise.resolve({exists:true}),
        delete:()=>{delete __c.parts[id];return Promise.resolve()}})})
  })});
  fbDb.batch=()=>{const ops=[];return {set:(r,v)=>ops.push(()=>r.set(v)),
    delete:r=>ops.push(()=>r.delete()),
    commit:()=>{ops.forEach(f=>f());return Promise.resolve()}}};
});

// 1. Хадгалалт үргэлж ЗӨВХӨН хэсгүүдэд
const w=await page.evaluate(async()=>{
  __c.wOld=0;__c.wParts=0;_clearPartHashes();
  await _pushCloud(_packDB(DB));
  return {old:__c.wOld,parts:__c.wParts}});
ok('Бичилт зөвхөн хэсгүүдэд',w.old===0&&w.parts>0,JSON.stringify(w));

// 2. Хэсэг байвал хуучныг ОГТ уншихгүй
const r1=await page.evaluate(async()=>{
  __c.rOld=0;__c.rParts=0;
  const d=await _readCloud(1);
  return {parts:d.__parts===true,rOld:__c.rOld,rParts:__c.rParts}});
ok('Хэсэг байвал хэсгүүдээс',r1.parts&&r1.rOld===0,JSON.stringify(r1));

// 3. Хэсэг АЛГА → хуучнаас уншаад ӨӨРӨӨ шилжүүлнэ
const mig=await page.evaluate(async()=>{
  __c.parts={};__c.old={location:'ХУУЧИН',v:3,folders:[],main:[],sw:[],rpt:{}};
  __c.rOld=0;__c.wParts=0;_clearPartHashes();
  const d=await _readCloud(1);
  await new Promise(r=>setTimeout(r,200));
  return {exists:d.exists,loc:d.data().db&&d.data().db.location,
    rOld:__c.rOld,wParts:__c.wParts,partKeys:Object.keys(__c.parts).sort()}});
ok('Хэсэг алга → хуучнаас уншив',mig.exists===true&&mig.loc==='ХУУЧИН',JSON.stringify({e:mig.exists,l:mig.loc}));
ok('Хэсгүүдийг ӨӨРӨӨ үүсгэв',mig.wParts>0&&mig.partKeys.includes('meta'),JSON.stringify(mig.partKeys));

// 4. Сүлжээний алдаа → хуучин руу ОРОХГҮЙ
const err=await page.evaluate(async()=>{
  __c.failParts=true;__c.rOld=0;
  let threw=false;
  try{await _readCloud(1)}catch(e){threw=true}
  __c.failParts=false;
  return {threw,rOld:__c.rOld}});
ok('Хэсэг уншиж чадаагүй → алдаа шиднэ',err.threw===true,'rOld='+err.rOld);
ok('Хуучин руу ОРООГҮЙ',err.rOld===0,'rOld='+err.rOld);

// 5. Архивлагдсан хуучин баримтыг уншихгүй
const arch=await page.evaluate(async()=>{
  __c.parts={};__c.arch=true;__c.old={location:'ХУУЧИРСАН',v:3,folders:[],main:[],sw:[],rpt:{}};
  const d=await _readCloud(1);
  __c.arch=false;
  return {exists:d.exists,archived:d.__archived===true}});
ok('Архивлагдсаныг үл тоомсорлов',arch.exists===false&&arch.archived,JSON.stringify(arch));

// 6. Сонсогч хэсгүүдийг сонсоно
const ls=await page.evaluate(()=>{__c.listen=null;startRealtimeSync();return __c.listen});
ok('Сонсогч хэсгүүд рүү',ls==='parts',ls);

// 7. Хязгаар хэсэг тус бүрд
const sz=await page.evaluate(()=>{_packForSave();
  return {whole:_lastDocBytes,max:_lastPartMax,ok:_lastPartMax<=_lastDocBytes}});
ok('Хязгаар хэсгийн хэмжээгээр',sz.ok,'бүтэн='+sz.whole+' хэсэг='+sz.max);

// 8. Унтраалга үлдээгүй
const gone=await page.evaluate(()=>['_partsOn','_partsRead','_partsOnly','probeParts','_dualWrite']
  .filter(f=>typeof window[f]==='function'));
ok('Унтраалгын функцууд устсан',gone.length===0,JSON.stringify(gone));

/* 9-12. Өөр утаснаас бодит цагт ирсэн өөрчлөлт (_applyRemote) — өмнө нь
   зөвхөн "илгээгдээгүй тэмдэг байгаа эсэх"-ээр шийддэг байсан тул
   сүлжээ сул үед богино зуур тэмдэг идэвхтэй байхад ч өөр утасны
   ЖИНХЭНЭ шинэ өөрчлөлтийг чимээгүйхэн орхигдуулдаг байв.
   cloudReload()-той адил _canOverwriteLocal()-оор цаг тэмдгээр
   харьцуулдаг болсныг батална. */
console.log('\nБодит цагийн синхрончлол — өөр утаснаас ирсэн өөрчлөлт');

const live=await page.evaluate(()=>{
  const mk=loc=>({location:loc,v:3,folders:[],main:[{id:'m1',num:1,kind:'main',sections:[]}],sw:[],rpt:{}});
  localStorage.removeItem(_dirtyKey());
  _cloudHadData=true;
  DB=mk('ХУУЧИН');
  const remote=_packDB(mk('ШИНЭ'));
  _applyRemote(remote,Date.now());
  return {loc:DB.location}
});
ok('Тэмдэггүй үед алсын шинэ өгөгдөл шууд хэрэгждэг (регресс шалгалт)',
   live.loc==='ШИНЭ',JSON.stringify(live));

const near=await page.evaluate(()=>{
  const mk=loc=>({location:loc,v:3,folders:[],main:[{id:'m1',num:1,kind:'main',sections:[]}],sw:[],rpt:{}});
  const dt=Date.now()-500;
  localStorage.setItem(_dirtyKey(),String(dt));
  _cloudHadData=true;
  DB=mk('УТАСНЫХ');
  const remote=_packDB(mk('ҮҮЛНИЙХ'));
  _applyRemote(remote,dt+500);        // dt+500 ≤ dt+2000 → ялгаа тодорхойгүй, false
  return {loc:DB.location}
});
ok('Ялгаа тодорхойгүй үед утсан дахийг ХАМГААЛНА, дарж бичихгүй',
   near.loc==='УТАСНЫХ',JSON.stringify(near));

const conflict=await page.evaluate(()=>{
  const mk=loc=>({location:loc,v:3,folders:[],main:[{id:'m1',num:1,kind:'main',sections:[]}],sw:[],rpt:{}});
  const b=document.getElementById('errBanner');if(b)b.remove();
  const dt=Date.now()-5000;
  localStorage.setItem(_dirtyKey(),String(dt));
  _cloudHadData=true;
  DB=mk('УТАСНЫХ2');
  const remote=_packDB(mk('ҮҮЛНИЙХ2'));
  _applyRemote(remote,dt+5000);        // dt+5000 > dt+2000 → жинхэнэ зөрчил, null
  const banner=document.getElementById('errBanner');
  const r={loc:DB.location,bannerShown:!!banner,bannerText:banner?banner.textContent.slice(0,50):''};
  if(banner)banner.remove();
  localStorage.removeItem(_dirtyKey());
  return r
});
ok('Жинхэнэ зөрчилтэй үед хэрэглэгчид МЭДЭГДЭНЭ (өмнө нь чимээгүй орхигддог байсан алдаа)',
   conflict.loc==='УТАСНЫХ2'&&conflict.bannerShown,JSON.stringify(conflict));

const wire=await page.evaluate(()=>startRealtimeSync.toString().includes('_applyRemote(p.db,p.ms)'));
ok('startRealtimeSync() нь цаг тэмдгийг (p.ms) _applyRemote рүү дамжуулдаг',wire,String(wire));

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
