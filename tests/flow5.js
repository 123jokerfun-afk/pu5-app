const B=require('./base'),T=require('./touch'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{
  DB.sw=[{id:'sf1',name:'Хавар 2026 сумын паспорт',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    turnouts:[{id:'sw1',num:1,station:'Багануур',mak:'Р-65',mark:'1/11',proj:'2764',head:4,it:'nnnnnnbbbnnnnnnnnnn'}]}];saveDB()});

// ── 1. Sheet: бариулаас доош шудрах ──
await page.evaluate(()=>{goHome();openFolder('f-test1');openTrack('t1');openSection(DB.tracks[0].sections[0].id);openEditSleeper(5)});
await page.waitForTimeout(600);
ok('Дэр засах цонх нээгдэв',await page.evaluate(()=>document.getElementById('editSleeperModal').classList.contains('open')));
let h=await T.center(page,'#editSleeperModal .sheet-handle');
if(h){await T.swipe(page,h.x,h.y,0,150,10);await page.waitForTimeout(500);
  ok('Бариулаас доош шудрах → хаагдав',await page.evaluate(()=>!document.getElementById('editSleeperModal').classList.contains('open')));}
else ok('sheet-handle олдсонгүй',false);

// ── 2. Sheet: ард дарах ──
await page.evaluate(()=>openEditSleeper(5));
await page.waitForTimeout(500);
await T.tap(page,195,80);
await page.waitForTimeout(500);
ok('Ард дарах → хаагдав',await page.evaluate(()=>!document.getElementById('editSleeperModal').classList.contains('open')));

// ── 3. _appBack давхарласан цонх ──
await page.evaluate(()=>{openEditSleeper(5);openTypeModal()});
await page.waitForTimeout(500);
await page.evaluate(()=>_appBack());
await page.waitForTimeout(400);
ok('Back → зөвхөн Төрөл хаагдав',await page.evaluate(()=>!document.getElementById('typeModal').classList.contains('open')&&document.getElementById('editSleeperModal').classList.contains('open')),
  await page.evaluate(()=>[...document.querySelectorAll('.overlay.open')].map(o=>o.id).join(',')));
await page.evaluate(()=>_appBack());
await page.waitForTimeout(400);
ok('Back → Дэр засах хаагдав',await page.evaluate(()=>[...document.querySelectorAll('.overlay.open')].length===0));

// ── 4. Үе хооронд шудрах ──
await page.evaluate(()=>{openSection(DB.tracks[0].sections[0].id)});
await page.waitForTimeout(500);
let s0=await page.evaluate(()=>activeSectionId);
await T.swipe(page,330,420,-260,0,4);
await page.waitForTimeout(700);
let s1=await page.evaluate(()=>activeSectionId);
ok('Зүүн шудрах → өмнөх үе (эхэнд тул хэвээр)',s0===s1,s0+' → '+s1);
await T.swipe(page,60,420,260,0,4);
await page.waitForTimeout(700);
ok('Баруун шудрах → дараагийн үе',await page.evaluate(()=>activeSectionId)!==s0,
   s0+' → '+await page.evaluate(()=>activeSectionId));

// ── 5. Нүүр ↔ СШ шудрах ──
await page.evaluate(()=>goHome());await page.waitForTimeout(600);
// 10 алхам үед харнесс өөрөө 604мс зарцуулж, аппын 600мс хязгаараас
// хэтэрдэг байв — тест аппыг биш, CDP-ийн хоцролтыг хэмжиж байсан.
// 4 алхам = 356мс, жинхэнэ хүний шудралттай (150–400мс) ойрхон.
await T.swipe(page,340,300,-280,0,4);
await page.waitForTimeout(800);
ok('Нүүрээс зүүн шудрах → СШ ПУ-5',await page.evaluate(()=>document.getElementById('swHomeView').classList.contains('active')),
   await page.evaluate(()=>[...document.querySelectorAll('.view.active')].map(v=>v.id).join(',')));
await T.swipe(page,50,300,280,0,4);
await page.waitForTimeout(800);
ok('СШ-ээс баруун шудрах → Нүүр',await page.evaluate(()=>document.getElementById('homeView').classList.contains('active')),
   await page.evaluate(()=>[...document.querySelectorAll('.view.active')].map(v=>v.id).join(',')));

// ── 6. Урт дарж устгах идэвхжүүлэх ──
await page.evaluate(()=>goHome());await page.waitForTimeout(500);
const fc=await page.$('.folder-card.lp-del');
if(fc){
  const bb=await fc.boundingBox();
  // энгийн дарахад устгах товч ажиллахгүй
  const del=await fc.$('.folder-del');
  const db=await del.boundingBox();
  await T.tap(page,db.x+db.width/2,db.y+db.height/2);
  await page.waitForTimeout(500);
  ok('Энгийн дарахад устгахгүй',await page.evaluate(()=>DB.folders.length===2)&&!(await page.evaluate(()=>document.getElementById('appConfirmModal').classList.contains('open'))));
  await T.longPress(page,bb.x+bb.width/2,bb.y+10,800);
  await page.waitForTimeout(400);
  ok('Урт дарахад идэвхжив',await page.evaluate(()=>!!document.querySelector('.folder-card.del-armed')));
  await T.tap(page,db.x+db.width/2,db.y+db.height/2);
  await page.waitForTimeout(500);
  ok('Идэвхжсэний дараа баталгаажуулалт гарав',await page.evaluate(()=>document.getElementById('appConfirmModal').classList.contains('open')));
  await page.evaluate(()=>document.getElementById('appConfirmCancelBtn').click());
} else ok('folder-card олдсонгүй',false);

console.log('\nERRORS:',JSON.stringify(errs,null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
