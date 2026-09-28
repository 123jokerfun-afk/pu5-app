/* ══════════════════════════════════════════════════════════════
   УСТГАСАН ПАСПОРТ ДАХИН ГАРЧ ИРЭХ АЛДАА — үндсэн шалтгааны засвар

   _writeParts() (index.html) нь устсан хэсгийг илрүүлэхдээ ЗӨВХӨН энэ
   ТӨХӨӨРӨМЖИЙН _loadPartHashes() (localStorage) кэштэй харьцуулдаг
   байв. Хэрэв паспортыг ӨӨР төхөөрөмж (эсвэл кэш цэвэрлэгдсэн ижил
   төхөөрөмж) үүсгэсэн бол, устгагч төхөөрөмжийн кэшид тэр ID огт
   байдаггүй тул batch.delete() ХЭЗЭЭ Ч дуудагдахгүй — Firestore дээр
   мөнхөд үлдэж, дараагийн НЭВТРЭЛТ бүрд дахин уншигдаж "сэргэдэг" байв.

   Одоо _knownPartIds — сервэрээс ЖИНХЭНЭ сүүлд уншсан ID (нэвтрэх/
   cloudReload бүрд _partsFromSnap-аар шинэчлэгдэнэ) — мөн "өмнө байсан"
   гэдгийн эх сурвалж болж, аль ч төхөөрөмж дээр зөв устгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

function stubScript(){
  window.__c={parts:{},old:null,arch:false,wOld:0,wParts:0,rOld:0,rParts:0,failParts:false,listen:null};
  const mkSnap=o=>({empty:!Object.keys(o).length,metadata:{hasPendingWrites:false},
    forEach:f=>Object.keys(o).forEach(k=>f({id:k,data:()=>o[k]}))});
  fbDb.collection=()=>({doc:()=>({
    get:()=>{__c.rOld++;return Promise.resolve({exists:!!__c.old,
      data:()=>Object.assign({db:__c.old,updatedAt:{toMillis:()=>1}},__c.arch?{archivedAt:1}:{})})},
    set:(d)=>{__c.wOld++;__c.old=d.db;return Promise.resolve()},
    onSnapshot:()=>{__c.listen='doc';return ()=>{}},
    collection:()=>({
      get:()=>{__c.rParts++;return __c.failParts?Promise.reject(new Error('сүлжээ тасарлаа'))
          :Promise.resolve(mkSnap(__c.parts))},
      onSnapshot:()=>{__c.listen='parts';return ()=>{}},
      doc:id=>({set:v=>{__c.wParts++;__c.parts[id]=v;return Promise.resolve()},
        get:()=>Promise.resolve({exists:true}),
        delete:()=>{delete __c.parts[id];return Promise.resolve()}})})
  })});
  fbDb.batch=()=>{const ops=[];return {set:(r,v)=>ops.push(()=>r.set(v)),
    delete:r=>ops.push(()=>r.delete()),
    commit:()=>{ops.forEach(f=>f());return Promise.resolve()}}};
}

(async()=>{
const br=await B.launch();

// ── ТӨХӨӨРӨМЖ A: паспорт үүсгэж бичнэ (сервэрт p_keepme үүснэ) ──
const pageA=await B.newPage(br,B.DEVICES[1]);
await B.login(pageA.page,'ПД-6');
await pageA.page.evaluate(stubScript);
const step1=await pageA.page.evaluate(async()=>{
  await _readCloud(1).catch(()=>{});             // жинхэнэ эхний унших (хоосон сервэр)
  DB.folders=[{id:'keepme',name:'Хуучин паспорт',season:'хавар',year:'2026',date:'2026-01-01',sc:'ПД-6',tracks:[]}];
  await _pushCloud(_packDB(DB));
  return Object.keys(__c.parts).sort()});
ok('Төхөөрөмж A паспорт бичив',step1.includes('p_keepme'),JSON.stringify(step1));
const serverAfterA=await pageA.page.evaluate(()=>__c.parts);
await pageA.page.close();

// ── ТӨХӨӨРӨМЖ B: ӨӨР (шинэ) сесс, СЕРВЭРТ АЛЬ ХЭДИЙН БАЙГАА
//    p_keepme-г эхлээд ЖИНХЭНЭ уншиж (нэвтрэлтийн адил), дараа нь
//    ТЭР ПАСПОРТЫГ устгана ──
const pageB=await B.newPage(br,B.DEVICES[1]);
await B.login(pageB.page,'ПД-6');
await pageB.page.evaluate(stubScript);
await pageB.page.evaluate((sv)=>{__c.parts=sv},serverAfterA);
const step2=await pageB.page.evaluate(async()=>{
  const doc=await _readCloud(1);          // жинхэнэ унших — _knownPartIds шинэчлэгдэнэ
  DB.folders=(DB.folders||[]).filter(f=>f.id!=='keepme');   // deleteFolder()-той адил
  await _pushCloud(_packDB(DB));
  return {docExists:doc.exists,partsAfter:Object.keys(__c.parts).sort()}});
ok('Төхөөрөмж B (шинэ сесс) паспортыг зөв уншив',step2.docExists===true,JSON.stringify(step2));
ok('Төхөөрөмж B устгасны дараа p_keepme Firestore-оос ЖИНХЭНЭ арилна',
   !step2.partsAfter.includes('p_keepme'),JSON.stringify(step2.partsAfter));

// ── ДАВХАРДСАН БАТАЛГАА: "Одоо устгах" (purgeTrashItem) — жинхэнэ
//    хатуу устгалын зам — мөн адил зөв ажиллахыг батална ──
const serverAfterB=await pageB.page.evaluate(()=>__c.parts);
await pageB.page.close();

const pageC=await B.newPage(br,B.DEVICES[1]);
await B.login(pageC.page,'ПД-6');
await pageC.page.evaluate(stubScript);
await pageC.page.evaluate(async(sv)=>{
  __c.parts=sv;
  DB.folders=[{id:'other',name:'Өөр паспорт',season:'намар',year:'2026',date:'2026-06-01',sc:'ПД-6',
    tracks:[],trashedAt:new Date().toISOString()}];
  await _readCloud(1).catch(()=>{});
  await _pushCloud(_packDB(DB));           // p_other-г сервэрт бичнэ
},serverAfterB);
const step3=await pageC.page.evaluate(async()=>{
  window.appConfirm=async()=>true;
  await purgeTrashItem('other','der');
  flushSave(true);                    // saveDB() 1500мс хойшлуулсныг шууд илгээнэ
  await new Promise(r=>setTimeout(r,400));
  return Object.keys(__c.parts).sort()});
ok('"Одоо устгах" (purgeTrashItem) ч Firestore-оос жинхэнэ арилгана',
   !step3.includes('p_other'),JSON.stringify(step3));
const bad=(pageC.errs||[]).filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));

console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
