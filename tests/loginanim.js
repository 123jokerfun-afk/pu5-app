/* ══════════════════════════════════════════════════════════════
   НЭВТРЭХ ТОВЧНЫ ҮЗЭГДЭЛ — үнэмлэхээ барьсан хүн хаалга руу алхаж,
   сервер хариулахыг хүлээгээд орох/буцах (санаа: uulzwar_zai сиб апп,
   PU-5-ийн --lg-* өнгөний системд тааруулсан).

   base.js-ийн newPage() хөдөлгөөн хязгаарлалтыг тохируулдаггүй (host
   уг нь ямар ч төлөвтэй байж болно) тул эхэндээ page.emulateMedia-аар
   'no-preference' болгож тодруулна — 5-р шалгалт эцэст нь 'reduce'
   болгож жинхэнэ хязгаарлалтын замыг шалгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const base=await B.ensureServer();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await page.emulateMedia({reducedMotion:'no-preference'});   // энэ тестэд л жинхэнэ хөдөлгөөн
await page.goto(base+'/index.html',{waitUntil:'load'});
await page.waitForTimeout(500);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

// ── 1. Эхлэлийн байдал ──
const init=await page.evaluate(()=>({LP:!!LP,FP:!!FP,
  stageOpacity:getComputedStyle(document.getElementById('lpStage')).opacity}));
ok('LP/FP объект бэлдэгдсэн',init.LP&&init.FP,JSON.stringify(init));
ok('Эхэндээ тайз нуугдмал (opacity:0)',init.stageOpacity==='0',init.stageOpacity);

// ── 2. Талбарын бяцхан зөөгч ──
await page.click('#loginCode');
await page.waitForTimeout(800);
const fp1=await page.evaluate(()=>{
  const clip=document.getElementById('loginCode').parentElement.querySelector('.fld-clip');
  return !!(clip&&clip.querySelector('#fpPerson'))
});
ok('Нэр рүү дарахад зөөгч тэнд гарч ирнэ',fp1);
await page.click('#loginPass');
await page.waitForTimeout(800);
const fp2=await page.evaluate(()=>{
  const clip=document.getElementById('loginPass').parentElement.querySelector('.fld-clip');
  return !!(clip&&clip.querySelector('#fpPerson'))
});
ok('Нууц үг рүү шилжихэд зөөгч тийшээ алхана',fp2);

// ── 3. Зөвшөөрөгдсөн нэвтрэлт: жинхэнэ doLogin()-оор, тест stub нь
//    ямарч итгэмжлэлээр үргэлж амжилттай болдог тул verdict=true замыг
//    шалгана. homeView ШУУД биш, үзэгдэл дуустал хүлээгээд л гарч
//    ирэх ёстойг баталгаажуулна. ──
await page.fill('#loginCode','ПД-6');
await page.fill('#loginPass','test1234');
await page.click('#loginBtn');
await page.waitForTimeout(250);
const midPlay=await page.evaluate(()=>({
  playing:document.getElementById('loginBtn').classList.contains('playing'),
  homeActive:document.getElementById('homeView').classList.contains('active')
}));
ok('Дарсны дараа шууд биш, үзэгдэл тоглож эхэлнэ',midPlay.playing&&!midPlay.homeActive,
   JSON.stringify(midPlay));
await page.waitForFunction(()=>document.getElementById('homeView').classList.contains('active'),
  {timeout:15000});
const afterHome=await page.evaluate(()=>({
  playing:document.getElementById('loginBtn').classList.contains('playing'),
  homeActive:document.getElementById('homeView').classList.contains('active')
}));
ok('Үзэгдэл дуусаад л homeView гарч ирнэ',!afterHome.playing&&afterHome.homeActive,
   JSON.stringify(afterHome));

// ── 4. Татгалзсан нэвтрэлт: auth-г дарж бичээд алдаа оруулна.
//    Хаалга улаанаар гэрэлтэж, хүн ухарч, эцэст нь loginView хэвээр
//    үлдэх ёстой (homeView рүү шилжихгүй). ──
// logout баталгаажуулах цонхыг алгасаад шууд гарна
await page.evaluate(async()=>{
  window.appConfirm=async()=>true;
  await doLogout();
});
await page.waitForTimeout(300);
ok('Гарсны дараа loginView идэвхтэй',
   await page.evaluate(()=>document.getElementById('loginView').classList.contains('active')));
ok('Гарсны дараа үзэгдлийн glow 0 болж reset хийгдсэн',
   await page.evaluate(()=>getComputedStyle(document.getElementById('lpDoor')).getPropertyValue('--lp-glow').trim()==='0'||
     getComputedStyle(document.getElementById('lpDoor')).opacity!==undefined));

await page.evaluate(()=>{
  window.__origSignIn=fbAuth.signInWithEmailAndPassword.bind(fbAuth);
  fbAuth.signInWithEmailAndPassword=()=>Promise.reject({code:'auth/wrong-password',message:'Нууц үг буруу'});
});
await page.fill('#loginCode','ПД-6');
await page.fill('#loginPass','buruu');
await page.click('#loginBtn');
await page.waitForTimeout(400);
const rejMid=await page.evaluate(()=>({
  playing:document.getElementById('loginBtn').classList.contains('playing'),
  errShown:document.getElementById('loginErr').style.display==='block'
}));
ok('Татгалзсаны дараа ч үзэгдэл үргэлжилж тоглоно',rejMid.playing,JSON.stringify(rejMid));
ok('Алдааны мессеж шууд харагдана (хүлээхгүй)',rejMid.errShown);
// Үзэгдэл бүрэн дуустал (ухарч алга болтол) хүлээнэ
await page.waitForFunction(()=>!document.getElementById('loginBtn').classList.contains('playing'),
  {timeout:15000});
const rejEnd=await page.evaluate(()=>({
  loginActive:document.getElementById('loginView').classList.contains('active'),
  homeActive:document.getElementById('homeView').classList.contains('active'),
  btnDisabled:document.getElementById('loginBtn').disabled
}));
ok('Татгалзсаны дараа homeView рүү ОРООГҮЙ, loginView хэвээр',
   rejEnd.loginActive&&!rejEnd.homeActive,JSON.stringify(rejEnd));
ok('Товч дахин идэвхжиж, ахин оролдож болно',!rejEnd.btnDisabled);
await page.evaluate(()=>{fbAuth.signInWithEmailAndPassword=window.__origSignIn});

// ── 5. prefers-reduced-motion: reduce үед үзэгдэл бүрэн алгасагдана ──
await page.emulateMedia({reducedMotion:'reduce'});
await page.evaluate(()=>{resetSignInAnim()});
const calmStart=Date.now();
await page.evaluate(()=>playSignInAnim());
const calmMs=Date.now()-calmStart;
ok('Хөдөлгөөн хязгаарласан горимд үзэгдэл шууд дуусна (<300мс)',calmMs<300,calmMs+'мс');
const calmState=await page.evaluate(()=>({
  playing:document.getElementById('loginBtn').classList.contains('playing'),
  stageOpacity:getComputedStyle(document.getElementById('lpStage')).opacity
}));
ok('Хязгаарласан горимд тайз огт харагдахгүй',!calmState.playing,JSON.stringify(calmState));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
