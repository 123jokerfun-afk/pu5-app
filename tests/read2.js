const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

// Үүлийг хуурамчаар загварчилна: хэсгүүд ба хуучин баримтыг өөрсдөө удирдана
await page.evaluate(()=>{
  window.__cloud={parts:{},old:null,readParts:0,readOld:0};
  const mkSnap=obj=>({empty:!Object.keys(obj).length,
    forEach:f=>Object.keys(obj).forEach(k=>f({id:k,data:()=>obj[k]}))});
  fbDb.collection=function(){return {doc:function(){return {
    get:()=>{__cloud.readOld++;return Promise.resolve({
      exists:!!__cloud.old,data:()=>({db:__cloud.old,updatedAt:{toMillis:()=>1}})})},
    set:()=>Promise.resolve(),
    onSnapshot:()=>()=>{},
    collection:function(){return {
      get:()=>{__cloud.readParts++;return Promise.resolve(mkSnap(__cloud.parts))},
      doc:()=>({set:()=>Promise.resolve(),get:()=>Promise.resolve({exists:true}),
        delete:()=>Promise.resolve()})}}
  }}}};
  // Одоогийн өгөгдлөөс хэсгүүдийг үүсгэнэ
  const packed=_packDB(DB);
  __cloud.old=JSON.parse(JSON.stringify(packed));
  const sp=_splitDB(packed);
  Object.keys(sp).forEach(k=>{__cloud.parts[k]=Object.assign({u:{toMillis:()=>7}},sp[k])});
});

// 1. Унтраалттай үед хуучин баримтаас уншина
const off=await page.evaluate(async()=>{
  try{localStorage.setItem('sg_parts_read','0')}catch(e){}
  __cloud.readParts=0;__cloud.readOld=0;
  const d=await _readCloud(1);
  return {parts:__cloud.readParts,old:__cloud.readOld,isParts:!!d.__parts}});
ok('Унтраалттай → хуучин баримтаас',off.old===1&&off.parts===0&&!off.isParts,JSON.stringify(off));

// 2. Асаалттай үед хэсгүүдээс уншина
const on=await page.evaluate(async()=>{
  try{localStorage.setItem('sg_parts_read','1')}catch(e){}
  __cloud.readParts=0;__cloud.readOld=0;
  const d=await _readCloud(1);
  return {parts:__cloud.readParts,old:__cloud.readOld,isParts:!!d.__parts,
    n:d.__n,ms:d.data().updatedAt&&d.data().updatedAt.toMillis()}});
ok('Асаалттай → хэсгүүдээс',on.isParts&&on.parts===1&&on.old===0,JSON.stringify(on));
ok('Серверийн цаг уншигдав',on.ms===7,'ms='+on.ms);

// 3. Уншсан өгөгдөл хуучинтай ЯГ адилхан
const same=await page.evaluate(async()=>{
  const d=await _readCloud(1);
  return _cmpKey(d.data().db)===_cmpKey(__cloud.old)});
ok('Уншсан өгөгдөл хуучинтай адилхан',same);

// 4. Хэсгүүд ДУТУУ бол хуучин руу өөрөө унана
const fb=await page.evaluate(async()=>{
  const keep=__cloud.parts; __cloud.parts={};       // хоосон
  __cloud.readOld=0;
  const d=await _readCloud(1);
  const r={isParts:!!d.__parts,old:__cloud.readOld};
  __cloud.parts=keep; return r});
ok('Хэсгүүд хоосон → хуучин руу унав',!fb.isParts&&fb.old===1,JSON.stringify(fb));
const fb2=await page.evaluate(async()=>{
  const keep=__cloud.parts.meta; delete __cloud.parts.meta;   // meta дутуу
  __cloud.readOld=0;
  const d=await _readCloud(1);
  const r={isParts:!!d.__parts,old:__cloud.readOld};
  __cloud.parts.meta=keep; return r});
ok('meta дутуу → хуучин руу унав',!fb2.isParts&&fb2.old===1,JSON.stringify(fb2));

// 5. Шилжүүлэх хаалга: таарвал зөвшөөрнө, зөрвөл ЗӨВШӨӨРӨХГҮЙ
const gate=await page.evaluate(async()=>{
  localStorage.setItem('sg_parts_on','1');localStorage.setItem('sg_parts_read','0');
  const good=await tryPartsRead();
  const readAfterGood=_partsRead();
  localStorage.setItem('sg_parts_read','0');
  const keep=JSON.parse(JSON.stringify(__cloud.old));
  __cloud.old.location='ӨӨР ГАЗАР';                 // зориуд зөрүүлнэ
  const bad=await tryPartsRead();
  const readAfterBad=_partsRead();
  __cloud.old=keep;
  return {good:good.ok,readAfterGood,bad:bad.ok,badWhy:bad.why,readAfterBad}});
ok('Таарвал шилжинэ',gate.good===true&&gate.readAfterGood===true);
ok('ЗӨРВӨЛ шилжихгүй',gate.bad===false&&gate.readAfterBad===false,gate.badWhy);

// 6. Бичилтийг унтраахад уншилт ч буцна
const offBoth=await page.evaluate(()=>{
  localStorage.setItem('sg_parts_read','1');
  setPartsOn(false);
  return {on:_partsOn(),read:_partsRead()}});
ok('Бичилт унтраахад уншилт ч буцав',offBoth.on===false&&offBoth.read===false);

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
