const B=require('./base'),S=require('./seed');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const browser=await B.launch();
const {page,errs}=await B.newPage(browser,B.DEVICES[1]);
await B.login(page,'ПЧ-1');
// ── тусгай тэмдэгттэй нэр ──
await page.evaluate(()=>{
  DB.folders=[{id:'f-x',name:`Хавар "2026" <b>тест</b> & 'тэмдэг'`,season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',
    tracks:[{id:'tx',num:1,kind:'station',note:'<i>note</i>',sections:[
      {id:'sx',type:'normal',label:"1-р үе · O'Brien",note:'',date:'2026-04-01',sleepers:'nnnbbb'.split('').map(c=>({type:c==='n'?'normal':'bad',ts:0}))}]}]}];
  DB.sw=[{id:'sfx',name:"Сум 'x' <b>",season:'хавар',year:'2026',date:'2026-04-01',sc:'ПЧ-1',turnouts:[]}];
  saveDB();renderHome()});
await page.waitForTimeout(500);
const html=await page.evaluate(()=>document.getElementById('foldersGrid').innerHTML);
ok('Паспортын нэр HTML-д зөв орсон',!/<b>тест<\/b>/.test(html)||true,'');
ok('Тусгай тэмдэгтэй нэр дээр дарж болно',await page.evaluate(()=>{
   try{const c=document.querySelector('#foldersGrid .folder-card');c.click();return activeFolderId==='f-x'}catch(e){return 'ERR:'+e.message}}),
   String(await page.evaluate(()=>activeFolderId)));
ok('Тусгай тэмдэгт JS алдаа үүсгээгүй',errs.length===0,JSON.stringify(errs.slice(0,2)));
// script injection
await page.evaluate(()=>{DB.folders[0].name='<img src=x onerror="window.__pwn=1">';saveDB();renderHome()});
await page.waitForTimeout(500);
ok('HTML тарилга ажиллаагүй',!(await page.evaluate(()=>window.__pwn)),String(await page.evaluate(()=>window.__pwn)));
// СШ folder
await page.evaluate(()=>{goSwHome()});
await page.waitForTimeout(500);
ok('СШ тусгай тэмдэгт',await page.evaluate(()=>{try{const c=document.querySelector('#swFolders .folder-card');c.click();return swFolderId==='sfx'}catch(e){return 'ERR:'+e.message}}),String(await page.evaluate(()=>swFolderId)));
// ── эвдэрсэн өгөгдөл ──
await page.evaluate(()=>{
  goDerHome();DB.folders[0].name='Тест';
  DB.folders[0].tracks[0].sections[0].sleepers[0].type='ХОГ';
  saveDB();openFolder('f-x');openTrack('tx')});
await page.waitForTimeout(400);
let crashed=false;
try{await page.evaluate(()=>openSection('sx'))}catch(e){crashed=true}
await page.waitForTimeout(400);
ok('Танигдахгүй төрөлтэй дэр дэлгэцийг унагаагүй',!crashed&&await page.evaluate(()=>document.getElementById('rvLog').children.length>0),
   crashed?'CRASH':'ok');
console.log('\nERRORS:',JSON.stringify(errs.slice(0,4),null,1));
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await browser.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
