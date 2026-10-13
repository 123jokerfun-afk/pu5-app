/* ══════════════════════════════════════════════════════════════
   БӨМБӨРГИЙН ХҮРЭЭНД ТААРСАН МӨР — ТЕКСТ БАГА ЗЭРЭГ ТОМОРЧ ХАРАГДАНА

   v189-д мөрийг БҮХЭЛД нь scale хийж томруулсан боловч хүрээг мөртэй
   хамт томруулах шаардлагатай болж, агуулга гажуудан, зэргэлдээ мөрүүд
   хэтэрхий бүдгэрч харагдсан тул хэрэглэгч буцаахыг хүссэн (v191).
   Одоо: мөр ӨӨРӨӨ холдох тусам л бага зэрэг жижигэрнэ (анхны бөмбөрөгийн
   мэдрэмж, scale<=1), харин хүрээнд яг таарсан төвийн мөрийн ТЕКСТ
   (дугаар, төрөл) л өөр CSS дүрмээр (.dr-in) бага зэрэг томорно — мөрийг
   scale хийдэггүй тул хүрээ ч мөрийн хэмжээнд (52) буцсан.
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

ok('Хүрээнд яг таарсан мөр ХЭВИЙН хэмжээтэй (scale=1.0, мөрийг scale хийхгүй)',
   Math.abs(center-1)<0.001,String(center));
ok('Хажуу мөр төвөөс арай жижиг (0.95 < scale < 1)',near<1&&near>0.95,String(near));
ok('Холын (ad>=4) мөр хамгийн жижиг хэмжээндээ тогтворжино (scale=0.885)',
   Math.abs(far-0.885)<0.001,String(far));

// Хүрээ одоо мөртэй яг тэнцүү хэмжээтэй (v189-ийн өмнөх байдалд буцсан)
const frameGeo=await page.evaluate(()=>{
  const f=document.getElementById('drumFrame'),r=f.getBoundingClientRect();
  const row=DRM.rows[5].getBoundingClientRect();
  return {frameH:r.height,rowCenter:row.top+row.height/2,frameCenter:r.top+r.height/2}
});
ok('Хүрээний өндөр мөртэй яг тэнцүү (52, дахин томроогүй)',
   Math.abs(frameGeo.frameH-52)<0.5,String(frameGeo.frameH));
ok('Хүрээ мөрийн төвтэй зэрэгцсэн хэвээр (±2px)',
   Math.abs(frameGeo.rowCenter-frameGeo.frameCenter)<2,JSON.stringify(frameGeo));

// Текстийн хэмжээ: төвийн мөрний дугаар/төрөл холын мөрнөөс том байх ёстой
const txt=await page.evaluate(()=>{
  const cNum=DRM.rows[5].querySelector('.dr-num'),fNum=DRM.rows[9].querySelector('.dr-num');
  const cBadge=DRM.rows[5].querySelector('.drum-badge span'),
        fBadge=DRM.rows[9].querySelector('.drum-badge span');
  return{
    centerIn:DRM.rows[5].classList.contains('dr-in'),
    farIn:DRM.rows[9].classList.contains('dr-in'),
    numC:cNum?parseFloat(getComputedStyle(cNum).fontSize):null,
    numF:fNum?parseFloat(getComputedStyle(fNum).fontSize):null,
    badgeC:cBadge?parseFloat(getComputedStyle(cBadge).fontSize):null,
    badgeF:fBadge?parseFloat(getComputedStyle(fBadge).fontSize):null
  }
});
ok('Төвийн мөр .dr-in классыг авна, холын мөр авахгүй',
   txt.centerIn&&!txt.farIn,JSON.stringify(txt));
ok('Төвийн мөрний дугаарын текст холын мөрнөөс том',
   txt.numC>txt.numF,`${txt.numC} vs ${txt.numF}`);
ok('Төвийн мөрний төрлийн текст холын мөрнөөс том',
   txt.badgeC>txt.badgeF,`${txt.badgeC} vs ${txt.badgeF}`);

// Сумын рам замын дэр дээр ч ижил зарчим ажиллана
await page.evaluate(()=>{
  DB.sw=[{id:'sf1',name:'Хавар 2026',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
    turnouts:[{id:'sw1',num:1,mak:'Р-65',mark:'1/11',head:4,it:'n'.repeat(39)}]}];
  saveDB();goSwHome();openSwFolderView('sf1');openSwRec('sw1')
});
await page.waitForTimeout(400);
const sw=await page.evaluate(()=>{
  _drumTo(5,true);
  const r=DRM.rows[5],far=DRM.rows[9];
  const m=(r.style.transform||'').match(/scale\(([\d.]+)\)/);
  const cKind=r.querySelector('.sw-kind'),fKind=far.querySelector('.sw-kind');
  return{
    scale:m?+m[1]:null,
    kindC:cKind?parseFloat(getComputedStyle(cKind).fontSize):null,
    kindF:fKind?parseFloat(getComputedStyle(fKind).fontSize):null
  }
});
ok('Сумын рам замын дэр дээр ч мөр scale хийгдэхгүй (scale=1.0)',
   Math.abs(sw.scale-1)<0.001,String(sw.scale));
ok('Сумын рам замын дэр дээр ч төвийн текст холын мөрнөөс том',
   sw.kindC>sw.kindF,`${sw.kindC} vs ${sw.kindF}`);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('\nSUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
