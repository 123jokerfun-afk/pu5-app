/* ══════════════════════════════════════════════════════════════
   БӨМБӨРГИЙН ХҮРЭЭНД ТААРСАН МӨР — ТОМОРЧ ХАРАГДАНА

   Хэрэглэгчийн хүссэнээр: холын мөрүүд хэвийн хэмжээндээ (scale 1.0)
   үлдэж, хүрээнд яг таарсан төвийн мөр ТОМОРЧ харагдана (scale>1).
   Өмнө нь эсрэгээр байсан — төв нь хэвийн, холдох тусам жижигэрдэг.
   Дэр, дүнз хоёул DRM/_drumPaint-ийг хуваалцдаг тул нэг шалгалт хоёуланд
   нь хамаарна.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};

(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

await page.evaluate(()=>{
  openFolder('f-test1');openTrack('t1');
  const sec=DB.tracks[0].sections[0];
  openSection(sec.id,5)
});
await page.waitForTimeout(400);

// Бөмбөрөгийг 5-р мөр дээр НЭГ УДАА тааруулаад, хэд хэдэн мөрийн хэмжээг
// ДАХИН ТӨВЛӨРҮҮЛЭЛГҮЙ нэг дор уншина — эс тэгвэл мөр бүрийг шалгахдаа
// дахин төвлөрүүлэх нь өөрөө "хажуу" мөрийг шинэ төв болгочихно.
const scales=await page.evaluate(()=>{
  _drumTo(5,true);
  const scaleOf=i=>{
    const m=(DRM.rows[i].style.transform||'').match(/scale\(([\d.]+)\)/);
    return m?+m[1]:null
  };
  return {center:scaleOf(5),near:scaleOf(6),far:scaleOf(9)}
});
const {center,near,far}=scales;

ok('Хүрээнд яг таарсан мөр хэвийнээс ТОМ (scale>1.1)',center>1.1&&center<=1.2,String(center));
ok('Хажуу мөр төвөөс жижиг ч хэвийнээс том',near>1&&near<center,String(near));
ok('Холын (ad>=4) мөр яг ХЭВИЙН хэмжээнд тогтворжино (scale=1.0)',
   Math.abs(far-1)<0.001,String(far));

// Хүрээ өөрөө мөрийн өндрөөс (52) арай том, мөр дээрээ төвлөрсөн хэвээр
const frameGeo=await page.evaluate(()=>{
  const f=document.getElementById('drumFrame'),r=f.getBoundingClientRect();
  const row=DRM.rows[5].getBoundingClientRect();
  return {frameH:r.height,rowCenter:row.top+row.height/2,frameCenter:r.top+r.height/2}
});
ok('Хүрээний өндөр 52-оос том (жаахан томорсон)',frameGeo.frameH>52&&frameGeo.frameH<=64,
   String(frameGeo.frameH));
ok('Хүрээ мөрийн төвтэй зэрэгцсэн хэвээр (±2px)',
   Math.abs(frameGeo.rowCenter-frameGeo.frameCenter)<2,JSON.stringify(frameGeo));

// Сумын рам замын дэр дээр ч ижил зарчим ажиллана
await page.evaluate(()=>{
  DB.sw=[{id:'sf1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    turnouts:[{id:'sw1',num:1,mak:'Р-65',mark:'1/11',head:4,it:'n'.repeat(39)}]}];
  saveDB();goSwHome();openSwFolderView('sf1');openSwRec('sw1')
});
await page.waitForTimeout(400);
const swCenter=await page.evaluate(()=>{
  _drumTo(5,true);
  const r=DRM.rows[5];
  const m=(r.style.transform||'').match(/scale\(([\d.]+)\)/);
  return m?+m[1]:null
});
ok('Сумын рам замын дэр дээр ч ижил зарчим (scale>1.1)',swCenter>1.1&&swCenter<=1.2,String(swCenter));

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
