/* LANDING — апп руу ороход ЭХЛЭЭД харагдах минималист хаалга.
   homeView-ийн агуулга зөвхөн "Паспорт" дарахад гарч ирдгийг,
   мөн СШ/өнгө/гарах холбоосууд landing дээрээс шууд ажилладгийг
   шалгана. Бодит навигацийн кодыг B.login() аль хэдийн ашигладаг
   (landing→Паспорт тойрог) тул энд зөвхөн landing-ийн ӨӨРИЙН
   зан төлөвийг нарийвчлан баталгаажуулна. */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const base=await B.ensureServer();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);

// ── 1. Нэвтэрсний дараа ЭХЛЭЭД landing, homeView БИШ ──
await B.loginToLanding(page,'ПД-6');
const first=await page.evaluate(()=>({
  landing:document.getElementById('landingView').classList.contains('active'),
  home:document.getElementById('homeView').classList.contains('active'),
  navBack:document.getElementById('landingView').classList.contains('nav-back'),
  tabbar:document.body.classList.contains('has-tabbar')
}));
ok('Нэвтэрсний дараа landingView идэвхтэй',first.landing,JSON.stringify(first));
ok('homeView идэвхгүй хэвээр',!first.home);
ok('Урагшаа орсон тул nav-back тэмдэггүй',!first.navBack);
ok('Доод таб landing дээр нуугдсан',!first.tabbar);

await page.waitForTimeout(1500);   // DB.location ачаалагдах хүртэл
const title=await page.evaluate(()=>document.getElementById('lndTitle').textContent.trim());
ok('Хэсгийн нэр landing дээр харагдав',title.length>0,title);

const build=await page.evaluate(()=>document.querySelector('#landingView .build-tag').textContent.trim());
ok('Хувилбарын тэмдэг landing дээр харагдав',build.length>0,build);

// ── 2. Товшилтын хэмжээ, хальсан элемент ──
const bad1=await B.tapTargets(page);
ok('Товчнууд хангалттай том (≥28px)',bad1.length===0,JSON.stringify(bad1));
const of1=await B.overflow(page);
ok('Хэвтээ хальсан элемент алга',of1.length===0,JSON.stringify(of1));

// ── 3. "Паспорт" дарахад homeView руу ──
await page.click('#lndPassBtn');
await page.waitForFunction(()=>document.getElementById('homeView').classList.contains('active'),{timeout:15000});
const toHome=await page.evaluate(()=>({
  home:document.getElementById('homeView').classList.contains('active'),
  landing:document.getElementById('landingView').classList.contains('active'),
  navBack:document.getElementById('homeView').classList.contains('nav-back'),
  tabbar:document.body.classList.contains('has-tabbar')
}));
ok('"Паспорт" дарахад homeView идэвхжив',toHome.home&&!toHome.landing,JSON.stringify(toHome));
ok('Урагшаа орсон тул homeView ч nav-back-гүй',!toHome.navBack);
ok('homeView дээр доод таб сэргэв',toHome.tabbar);

// ── 4-6: landing-ийн ӨӨРИЙН товчнуудыг дахин шалгахад жинхэнэ
//    гарах/дахин нэвтрэлтийн мөчлөг хэрэггүй (нэвтэрсэн хэвээр) —
//    зүгээр showView('landingView')-ээр буцаж очно. Ингэснээр
//    `_afterLoginInner`-ийг давтан дуудахаас зайлсхийнэ. Тест нь
//    S.seed() дуудаагүй тул үүлэнд "ПД-6" баримт байхгүй — энэ нь
//    тогтмол "Үүлэн дээр бичлэг олдсонгүй" errBanner үлдээдэг (зөвхөн
//    "татаж байна" гэсэн ТУХАЙН НЭГ мэдэгдлийг л апп өөрөө арилгадаг),
//    .lnd-top-ийн товчнуудыг халхалж орхиод — тестийн зорилгод
//    хамаагүй тул энд бодитоор л арилгана. ──
await page.evaluate(()=>{const e=document.getElementById('errBanner');if(e)e.remove()});
await page.evaluate(()=>showView('landingView'));
await page.waitForTimeout(200);

// ── 4. landing-аас шууд "СШ ПУ-5" руу (homeView-г алгасна) ──
await page.click('.lnd-sw-link');
await page.waitForTimeout(500);
const toSw=await page.evaluate(()=>({
  sw:document.getElementById('swHomeView').classList.contains('active'),
  landing:document.getElementById('landingView').classList.contains('active')
}));
ok('"СШ ПУ-5" холбоосоор шууд swHomeView руу орно',toSw.sw&&!toSw.landing,JSON.stringify(toSw));

// ── 5. Өнгө сэлгэх товч landing дээрээс ажиллана ──
await page.evaluate(()=>showView('landingView'));
await page.waitForTimeout(200);
await page.evaluate(()=>applyTheme('light'));await page.waitForTimeout(150);
const beforeTh=await page.evaluate(()=>document.documentElement.getAttribute('data-theme'));
await page.click('#lndThemeBtn');await page.waitForTimeout(200);
const afterTh=await page.evaluate(()=>({
  theme:document.documentElement.getAttribute('data-theme'),
  icon:document.getElementById('lndThemeBtn').innerHTML.length>0
}));
ok('landing дээрх өнгөний товч ажиллав',beforeTh==='light'&&afterTh.theme==='dark',beforeTh+'→'+afterTh.theme);
ok('Товчны дүрс шинэчлэгдэв',afterTh.icon);
await page.evaluate(()=>applyTheme('light'));   // дараагийн тестэд нөлөөлөхгүйн тулд сэргээнэ

// ── 6. "Гарах" товч landing дээрээс ажиллана (бодит баталгаажуулалтын цонхоор) ──
await page.evaluate(()=>showView('landingView'));
await page.waitForTimeout(200);
await page.click('#landingView .hero-edit[aria-label="Гарах"]');
await page.waitForFunction(()=>document.getElementById('logoutModal').classList.contains('open'),{timeout:3000});
await page.click('#logoutYesBtn');
await page.waitForFunction(()=>document.getElementById('loginView').classList.contains('active'),{timeout:6000});
const afterOut=await page.evaluate(()=>({
  login:document.getElementById('loginView').classList.contains('active'),
  landing:document.getElementById('landingView').classList.contains('active')
}));
ok('landing-ийн "Гарах" товч бодитоор гаргав',afterOut.login&&!afterOut.landing,JSON.stringify(afterOut));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
