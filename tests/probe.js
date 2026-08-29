const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

ok('Анхнаасаа УНТРААЛТТАЙ',await page.evaluate(()=>_partsOn()===false));
ok('Унтраалттай үед бичихийг завдахгүй',await page.evaluate(()=>{
  let called=0; const orig=_writeParts;
  window._writeParts=function(){called++;return Promise.resolve(0)};
  _dualWrite({}); window._writeParts=orig; return called===0}));

// Асаах / унтраах нь утсанд хадгалагдана
ok('Асаах ажиллав',await page.evaluate(()=>{setPartsOn(true);return _partsOn()===true}));
// Асаангуут ШУУД бичих ёстой — хадгалалт хүлээхгүй
const nowW=await page.evaluate(async()=>{
  setPartsOn(false);
  let calls=0; const orig=window._writeParts;
  window._writeParts=function(p){calls++;return Promise.resolve(5)};
  setPartsOn(true);
  await new Promise(r=>setTimeout(r,150));
  window._writeParts=orig;
  return calls});
ok('Асаангуут шууд бичив',nowW>=1,'дуудалт='+nowW);
const offW=await page.evaluate(async()=>{
  let calls=0; const orig=window._writeParts;
  window._writeParts=function(){calls++;return Promise.resolve(0)};
  setPartsOn(false);
  await new Promise(r=>setTimeout(r,150));
  window._writeParts=orig;
  return calls});
ok('Унтраахад бичихгүй',offW===0,'дуудалт='+offW);
await page.evaluate(()=>setPartsOn(true));   // дараагийн шалгалтын нөхцөл
ok('Утсанд хадгалагдав',await page.evaluate(()=>localStorage.getItem('sg_parts_on')==='1'));
ok('Унтраах ажиллав',await page.evaluate(()=>{setPartsOn(false);return _partsOn()===false}));

// Гурван удаа алдвал өөрөө унтарна
const cb=await page.evaluate(async()=>{
  setPartsOn(true);
  const orig=_writeParts;
  window._writeParts=()=>Promise.reject(new Error('permission-denied туршилт'));
  for(let i=0;i<3;i++){_dualWrite({});await new Promise(r=>setTimeout(r,30))}
  await new Promise(r=>setTimeout(r,120));
  window._writeParts=orig;
  return {on:_partsOn(),fails:_partsFails,err:_partsErr}});
ok('3 алдааны дараа ӨӨРӨӨ унтарлаа',cb.on===false,'алдаа='+cb.fails);
ok('Шалтгааныг тэмдэглэв',/өөрөө унтарлаа/.test(cb.err),cb.err.slice(0,60));

// Мэдэгдэл дээрх мөрүүд
const ui=await page.evaluate(()=>{openSyncSheet();
  const t=document.getElementById('syncBody').textContent.replace(/\s+/g,' ');
  return {probe:/1\. Эрхийг туршиж үзэх/.test(t),
    toggle:/2\. (Асаалттай|Унтраалттай)/.test(t),
    verifyHidden:!/3\. Хуучинтай таарч/.test(t)}});
ok('Туршилтын мөр харагдав',ui.probe);
ok('Асаах/унтраах мөр харагдав',ui.toggle);
ok('Унтраалттай үед 3-р мөр нуугдав',ui.verifyHidden);
const ui2=await page.evaluate(()=>{setPartsOn(true);openSyncSheet();
  return /3\. Хуучинтай таарч/.test(document.getElementById('syncBody').textContent)});
ok('Асаалттай үед 3-р мөр гарав',ui2);
await page.evaluate(()=>setPartsOn(false));

console.log('\nERRORS:',JSON.stringify(errs.filter(e=>!/ERR_REQUEST_RANGE/.test(e)).slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
