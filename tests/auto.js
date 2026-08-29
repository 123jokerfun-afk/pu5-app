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

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
