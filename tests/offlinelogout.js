/* ══════════════════════════════════════════════════════════════
   СҮЛЖЭЭГҮЙ ҮЕД ГАРАХ — ӨГӨГДӨЛ АЛДАГДАХГҮЙ

   Хэрэглэгчийн асуулт: сүлжээтэй газар нэвтэрч, ГАРАЛГҮЙ аппыг
   хаагаад, сүлжээгүй газар нээж бүртгэл хийгээд, СҮЛЖЭЭГҮЙ ХЭВЭЭРЭЭ
   хаягнаас гарвал сүүлд хийсэн бүртгэл алга болох уу?

   Хариулт — үгүй:
   1) saveDB() нь үүлд ХАМААРАЛГҮЙгээр ХАМГИЙН ЭХЭНД
      localStorage['sg_der_v3_<код>']-д шууд (синхрон) бичдэг —
      доороос нь л сая сүлжээ шаардсан (debounce хийсэн) үүл рүү
      илгээх хэсэг эхэлдэг.
   2) _doLogoutCore() ЗӨВХӨН санах ойн DB-г цэвэрлэж, нэвтрэх
      дэлгэц рүү шилждэг — localStorage-д ХАЛДДАГГҮЙ. Сүлжээгүй
      үед flushSave() нь амжилтгүй болдог ч "илгээгдээгүй" тэмдэг
      (sg_der_dirty_<код>) яг тэрнээсээ болж арилдаггүй.
   3) Дараа нь ЯГ ТЭР кодоор дахин нэвтэрэхэд _afterLoginInner()
      утсан дахь "илгээгдээгүй" өгөгдлийг илрүүлж, цаг тэмдгээр
      харьцуулаад ӨӨРӨӨ үүл рүү илгээдэг.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

// Firestore-ыг манай хяналтын дор тавина — __c.fail=true үед БҮХ
// сүлжээний үйлдэл REJECT болж, жинхэнэ сүлжээгүй байдлыг дуурайна.
// fbDb (объект ӨӨРӨӨ) гарах/дахин нэвтрэхэд ДАХИН ҮҮСГЭГДЭХГҮЙ
// (doLogin() нь fbApp аль хэдийн байвал дахин init хийдэггүй) тул
// энэ хяналт хоёр дахь нэвтрэлтэд ч хэвээр ажиллана.
await page.evaluate(()=>{
  window.__c={fail:false,parts:{}};
  const mkSnap=o=>({empty:!Object.keys(o).length,metadata:{hasPendingWrites:false},
    forEach:f=>Object.keys(o).forEach(k=>f({id:k,data:()=>o[k]}))});
  fbDb.collection=()=>({doc:()=>({
    get:()=>__c.fail?Promise.reject(new Error('offline')):Promise.resolve({exists:false,data:()=>null}),
    set:()=>__c.fail?Promise.reject(new Error('offline')):Promise.resolve(),
    onSnapshot:()=>()=>{},
    collection:()=>({
      get:()=>__c.fail?Promise.reject(new Error('offline')):Promise.resolve(mkSnap(__c.parts)),
      onSnapshot:()=>()=>{},
      doc:id=>({
        set:v=>{if(__c.fail)return Promise.reject(new Error('offline'));__c.parts[id]=v;return Promise.resolve()},
        get:()=>Promise.resolve({exists:!!__c.parts[id],data:()=>__c.parts[id]}),
        delete:()=>{delete __c.parts[id];return Promise.resolve()}})
    })
  })});
  fbDb.batch=()=>{const ops=[];return{
    set:(r,v)=>{ops.push(()=>r.set(v))},
    delete:r=>ops.push(()=>r.delete()),
    commit:()=>__c.fail?Promise.reject(new Error('offline')):Promise.all(ops.map(f=>f()))}};
});

// Эхний (онлайн) бүртгэлийг ЖИНХЭНЭ "үүлд" хадгална — доор "сүлжээгүйд
// хийсэн шинэ өөрчлөлт хуучнаасаа ялгаатай" эсэхийг харьцуулахад хэрэгтэй.
await page.evaluate(async()=>{
  openFolder('f-test1');openTrack('t1');
  const sec=DB.tracks[0].sections[0];
  openSection(sec.id);
  saveDB();
  await flushSave(true);
});
await page.waitForTimeout(300);

/* ── 1. Сүлжээгүй болгоод бүртгэл хийнэ ── */
console.log('\nСүлжээгүйд бүртгэл хийх');
const off=await page.evaluate(async()=>{
  __c.fail=true;
  const sec=activeSec();
  sec.sleepers[0].type='bad';      // шинэ бүртгэл — зөвхөн сүлжээгүйд хийгдсэн
  saveDB();
  await new Promise(r=>setTimeout(r,80));
  const raw=localStorage.getItem('sg_der_v3_ПД-6');
  return {dirty:_dirtyAt()>0,hasRaw:!!raw,code:_sectionCode}});
ok('Сүлжээгүйд хийсэн бүртгэл ШУУД localStorage-д бичигдэв',off.hasRaw,JSON.stringify(off));
ok('"Илгээгдээгүй" тэмдэг асав',off.dirty,String(off.dirty));

/* ── 2. Сүлжээгүй ХЭВЭЭРЭЭ хаягнаас гарна ── */
console.log('\nСүлжээгүй хэвээр гарах');
const out=await page.evaluate(()=>{
  const beforeRaw=localStorage.getItem('sg_der_v3_ПД-6');
  const beforeDirty=localStorage.getItem('sg_der_dirty_ПД-6');
  _doLogoutCore();            // doLogout()-ийн бодит, үзэгдэлгүй цөм
  return {
    view:document.querySelector('.view.active').id,
    sectionCode:_sectionCode,dbEmpty:(DB.tracks||[]).length===0,
    afterRaw:localStorage.getItem('sg_der_v3_ПД-6'),
    afterDirty:localStorage.getItem('sg_der_dirty_ПД-6'),
    beforeRaw,beforeDirty}});
ok('Гарсны дараа нэвтрэх дэлгэц рүү шилжив',out.view==='loginView',out.view);
ok('Санах ойн сесс цэвэрлэгдэв (DB хоосорсон, код алга)',
   out.sectionCode===null&&out.dbEmpty,JSON.stringify({code:out.sectionCode,dbEmpty:out.dbEmpty}));
ok('localStorage-ийн бүртгэл ГАРСНЫ ДАРАА Ч хэвээр үлдэв (алдагдаагүй)',
   !!out.afterRaw&&out.afterRaw===out.beforeRaw,'тэнцүү эсэх: '+(out.afterRaw===out.beforeRaw));
ok('"Илгээгдээгүй" тэмдэг ч гарсны дараа арилаагүй',
   !!out.afterDirty&&out.afterDirty===out.beforeDirty,
   JSON.stringify({before:out.beforeDirty,after:out.afterDirty}));

/* ── 3. Сүлжээ сэргэнэ, ЯГ ТЭР кодоор дахин нэвтэрнэ ── */
console.log('\nСэргээд дахин нэвтрэх');
await page.evaluate(()=>{__c.fail=false});
await B.login(page,'ПД-6');
await page.waitForTimeout(400);
const back=await page.evaluate(()=>{
  openFolder('f-test1');          // нэвтрэх бүрд DB.tracks хоосордог тул дахин нээнэ
  const sec=DB.tracks[0]&&DB.tracks[0].sections[0];
  return {
    type:sec&&sec.sleepers[0].type,
    dirtyRemains:!!localStorage.getItem('sg_der_dirty_ПД-6'),
    partKeys:Object.keys(__c.parts)}});
ok('Дахин нэвтрэхэд сүлжээгүйд хийсэн бүртгэл СЭРГЭВ',back.type==='bad',JSON.stringify(back));
ok('"Илгээгдээгүй" тэмдэг амжилттай илгээгдээд арилав',!back.dirtyRemains,String(back.dirtyRemains));
ok('Үүл рүү жинхэнэ бичигдэв (parts)',back.partKeys.length>0,JSON.stringify(back.partKeys));

// Сүлжээгүй үеийн зориудын offline-алдааг хасаад бусад алдаа алга эсэхийг шалгана
const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|offline|Flush err|Save err/.test(e));
ok('Бусад консолын алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
