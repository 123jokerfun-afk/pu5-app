/* ══════════════════════════════════════════════════════════════
   ХУРДАН ХОЁР ДАРАХАД ДАВХАР ҮҮСЭХ

   Утас удаашрахад хэрэглэгч "Хадгалах"-ыг хоёр удаа дардаг. Хоёр
   дахь даралт нь хаагдсан цонхны товчийг ажиллуулж, ижил паспорт
   эсвэл үе ХОЁР удаа үүсдэг байв — ПУ-5 дэвтэр хуулийн бичиг
   баримт тул давхардсан үе шууд алдаа болно.

   Мөн ЗӨВ зан төлөв алдагдаагүйг шалгана: нэг удаа дарахад заавал
   үүсэх ёстой.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);
await page.evaluate(()=>{const b=document.getElementById('__errbar');if(b)b.remove()});

/* setup → тоолох → нэг удаа дарах → тоолох → дахин setup →
   ХУРДАН хоёр дарах → тоолох */
async function pair(nm,setup,act,count){
  const r=await page.evaluate(async([s,a])=>{
    const S=()=>new Function('return (async()=>{'+s+'})()')();
    const A=()=>new Function('return (async()=>{'+a+'})()')();
    const C=()=>new Function('return ('+window.__cnt+')()')();
    await S();await new Promise(r=>setTimeout(r,400));
    const n0=C();
    await A();await new Promise(r=>setTimeout(r,700));
    const one=C();
    await S();await new Promise(r=>setTimeout(r,400));
    const n1=C();
    A();await new Promise(r=>setTimeout(r,40));A();   // 40мс зайтай хоёр даралт
    await new Promise(r=>setTimeout(r,900));
    const two=C();
    return {added1:one-n0,added2:two-n1}
  },[setup,act]);
  ok(nm+' — нэг дарахад нэг үүснэ',r.added1===1,'+'+r.added1);
  ok(nm+' — хоёр дарахад ч нэг л үүснэ',r.added2===1,'+'+r.added2);
}
const setCnt=async fn=>{await page.evaluate(f=>{window.__cnt=f},fn.toString())};

await setCnt(()=>DB.folders.length);
await pair('Паспорт',
  `goHome();openAddFolder();document.getElementById('afName').value='Тест паспорт'`,
  `addFolder()`);

await setCnt(()=>getTrack('t1').sections.length);
await pair('Үе',
  `goHome();openFolder('f-test1');openTrack('t1');openAddSection('normal');
   document.getElementById('asNum').value='99'`,
  `addSection()`);

await setCnt(()=>swFolders().length);
await pair('Сумын паспорт',
  `goSwHome();openSwFolder&&openSwFolder();openModal('swFolderModal');
   document.getElementById('swfName').value='Тест сум'`,
  `addSwFolder()`);

/* Дугаараар давхардлыг шалгадаг үйлдлүүд — өөрсдөө татгалзана */
const guard=await page.evaluate(async()=>{
  goHome();openFolder('f-test1');
  const n0=DB.tracks.length;
  openAddTrack();document.getElementById('atNum').value='77';
  addTrack();await new Promise(r=>setTimeout(r,500));
  const one=DB.tracks.length;
  // ижил дугаараар дахин — татгалзах ёстой
  openAddTrack();document.getElementById('atNum').value='77';
  addTrack();await new Promise(r=>setTimeout(r,500));
  return {added:one-n0,after:DB.tracks.length-one}});
ok('Зам — нэг удаа нэмэгдэнэ',guard.added===1,'+'+guard.added);
ok('Зам — ижил дугаар давхардахгүй',guard.after===0,'+'+guard.after);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon|sw\.js/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
