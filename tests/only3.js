const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

await page.evaluate(()=>{
  window.__c={parts:{},old:null,wOld:0,wParts:0,rOld:0,rParts:0,archived:false,listen:null};
  const mkSnap=o=>({empty:!Object.keys(o).length,metadata:{hasPendingWrites:false},
    forEach:f=>Object.keys(o).forEach(k=>f({id:k,data:()=>o[k]}))});
  fbDb.collection=()=>({doc:()=>({
    get:()=>{__c.rOld++;return Promise.resolve({exists:!!__c.old,
      data:()=>({db:__c.old,updatedAt:{toMillis:()=>1}})})},
    set:(d,opt)=>{if(d&&d.archivedAt!==undefined){__c.archived=true}else{__c.wOld++;__c.old=d.db}
      return Promise.resolve()},
    onSnapshot:(cb)=>{__c.listen='doc';return ()=>{}},
    collection:()=>({
      get:()=>{__c.rParts++;return Promise.resolve(mkSnap(__c.parts))},
      onSnapshot:(cb)=>{__c.listen='parts';return ()=>{}},
      doc:id=>({set:v=>{__c.wParts++;__c.parts[id]=v;return Promise.resolve()},
        get:()=>Promise.resolve({exists:true}),delete:()=>{delete __c.parts[id];return Promise.resolve()}})})
  })});
  fbDb.batch=()=>{const ops=[];return {
    set:(ref,v)=>ops.push(()=>ref.set(v)),delete:ref=>ops.push(()=>ref.delete()),
    commit:()=>{ops.forEach(f=>f());return Promise.resolve()}}};
  const packed=_packDB(DB);
  __c.old=JSON.parse(JSON.stringify(packed));
  const sp=_splitDB(packed);
  Object.keys(sp).forEach(k=>{__c.parts[k]=Object.assign({u:{toMillis:()=>9}},sp[k])});
  localStorage.setItem('sg_parts_on','1');
  localStorage.setItem('sg_parts_read','1');
  localStorage.setItem('sg_parts_only','0');
});

// 1. Шат 2 (хоёуланд нь бичнэ)
const s2=await page.evaluate(async()=>{
  __c.wOld=0;__c.wParts=0;_clearPartHashes();
  await _pushCloud(_packDB(DB));
  return {old:__c.wOld,parts:__c.wParts}});
ok('Шат 2 → хуучин + хэсгүүд хоёуланд нь',s2.old===1&&s2.parts>0,JSON.stringify(s2));

// 2. Шилжүүлэх хаалга
const gate=await page.evaluate(async()=>{
  const r=await tryPartsOnly();
  return {ok:r.ok,only:_partsOnly(),archived:__c.archived,listen:__c.listen}});
ok('Шилжив',gate.ok===true&&gate.only===true);
ok('Хуучин баримт архивлагдав',gate.archived===true);
ok('Сонсогч хэсгүүд рүү шилжив',gate.listen==='parts',gate.listen);

// 3. Шат 3 — ЗӨВХӨН хэсгүүдэд бичнэ
const s3=await page.evaluate(async()=>{
  __c.wOld=0;__c.wParts=0;_clearPartHashes();
  DB.location='ӨӨРЧЛӨВ';
  await _pushCloud(_packDB(DB));
  return {old:__c.wOld,parts:__c.wParts}});
ok('Шат 3 → ЗӨВХӨН хэсгүүдэд',s3.old===0&&s3.parts>0,JSON.stringify(s3));

// 4. ГОЛ ХАМГААЛАЛТ: хэсгүүд алга бол ХУУЧИРСАН баримтыг ачаалахгүй
const guard=await page.evaluate(async()=>{
  const keep=__c.parts; __c.parts={};
  __c.rOld=0;
  const d=await _readCloud(1);
  __c.parts=keep;
  return {exists:d.exists,readOld:__c.rOld}});
ok('Хэсгүүд алга → "үүлэнд юу ч алга"',guard.exists===false,JSON.stringify(guard));
ok('Хуучирсан баримтыг УНШААГҮЙ',guard.readOld===0,'rOld='+guard.readOld);

// 5. Шат 2 руу буцаавал хуучин руу дахин уначихдаг (хамгаалалт зөвхөн Шат 3-т)
const back=await page.evaluate(async()=>{
  setPartsOnly(false);
  const keep=__c.parts; __c.parts={}; __c.rOld=0;
  const d=await _readCloud(1);
  __c.parts=keep;
  return {exists:d.exists,readOld:__c.rOld,listen:__c.listen}});
ok('Шат 2-т буцаахад хуучин руу унана',back.exists===true&&back.readOld===1,JSON.stringify(back));
ok('Сонсогч хуучин руу буцав',back.listen==='doc',back.listen);

// 6. Хэмжээний хязгаар: Шат 3-т ХЭСЭГ тус бүрд
const sz=await page.evaluate(()=>{
  _packForSave();
  return {whole:_lastDocBytes,max:_lastPartMax,smaller:_lastPartMax<_lastDocBytes}});
ok('Хамгийн том хэсэг нь бүтнээсээ бага',sz.smaller,'бүтэн='+sz.whole+' том хэсэг='+sz.max);

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
