/* НҮҮР ↔ ПАСПОРТ ДЭД-ТАБ — Нүүр таб зөвхөн Ерөнхий тойм (dashSection)
   харуулж, Гол зам/Дэрийн агуулах/Паспортууд зөвхөн Паспорт табд
   харагддаг болсныг шалгана (_homeSubTab, _applyHomeSubTab). */
const B=require('./base');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6');

await page.evaluate(()=>{
  DB.folders=[{id:'F1',name:'Намар паспорт',season:'намар',year:'2026',date:'2026-06-01',sc:'ПД-6',
    tracks:[{id:'T1',num:1,kind:'station',note:'',sections:[
      {id:'S1',label:'1-р үе',type:'normal',note:'',sleepers:Array.from({length:10},()=>({type:'normal',ts:0})),repl:{}}
    ]}]}];
  DB.sw=[];activeFolderId=null;DB.tracks=[];saveDB();goHome()});

const vis=id=>page.evaluate(i=>{
  const el=document.getElementById(i);if(!el)return 'MISSING';
  return getComputedStyle(el).display},id);
const cur=()=>page.evaluate(()=>document.getElementById('tabPass').getAttribute('aria-current'));

// ── 1. Анхны төлөв: Нүүр таб идэвхтэй, зөвхөн тойм харагдана ──
ok('Эхлээд "Нүүр" идэвхтэй',await page.evaluate(()=>document.getElementById('tabHome').getAttribute('aria-current'))==='true');
ok('dashSection харагдана',await vis('dashSection')!=='none');
ok('mainTrackSection НУУГДСАН',await vis('mainTrackSection')==='none');
ok('derWarehouseSection НУУГДСАН',await vis('derWarehouseSection')==='none');
ok('foldersSection НУУГДСАН',await vis('foldersSection')==='none');

// ── 2. "Паспорт" таб дарахад эсрэгээр сэлгэнэ ──
await page.click('#tabPass');
await page.waitForTimeout(300);
ok('"Паспорт" идэвхтэй болов',await cur()==='true');
ok('dashSection НУУГДСАН',await vis('dashSection')==='none');
ok('mainTrackSection харагдана',await vis('mainTrackSection')!=='none');
ok('derWarehouseSection харагдана',await vis('derWarehouseSection')!=='none');
ok('foldersSection харагдана',await vis('foldersSection')!=='none');
ok('"Шинэ паспорт нэмэх" товч харагдаж, дарагдахуйц боллоо',
   await page.evaluate(()=>{const b=[...document.querySelectorAll('.add-track-btn')].find(x=>/Шинэ паспорт нэмэх/.test(x.textContent));
     if(!b)return false;const r=b.getBoundingClientRect();return r.width>0&&r.height>0}));

// ── 3. Дахин "Нүүр" рүү буцахад анхны төлөв сэргэнэ ──
await page.click('#tabHome');
await page.waitForTimeout(300);
ok('dashSection дахин харагдана',await vis('dashSection')!=='none');
ok('foldersSection дахин нуугдана',await vis('foldersSection')==='none');

// ── 4. renderHome() өөр замаар (goHome зэрэг) дуудагдсан ч сонгосон
//        дэд-таб хадгалагдана — Паспорт сонговол Паспорт хэвээр ──
await page.click('#tabPass');
await page.waitForTimeout(250);
await page.evaluate(()=>{openFolder('F1');goHome()});
await page.waitForTimeout(250);
ok('goHome() дуудсан ч "Паспорт" дэд-таб хэвээр үлдэв',await vis('foldersSection')!=='none');
ok('activeFolderId-той үед Замууд хэсэг ч Паспорт табд харагдана',await vis('tracksSection')!=='none');

await page.click('#tabHome');
await page.waitForTimeout(250);
ok('Нүүр рүү шилжихэд activeFolderId байсан ч Замууд хэсэг нуугдана',await vis('tracksSection')==='none');

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,5)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
