/* ══════════════════════════════════════════════════════════════
   ТОВЧ ҮНЭХЭЭР ДАРАГДАХ УУ

   v104-т доод таб (z-index 300) "Үе нэмэх" тавцанг (z-index 10)
   бүрэн дарж, замын дэлгэц дээр товч огт дарагдахгүй байв.
   Хадгалалтын тэмдэг (z-index 9997) мөн "Нүүр", "Паспорт" табыг
   дарж байлаа.

   Тогтмол (fixed) давхарга нь товч дарж болохгүй. Дэлгэц бүрийг
   ЁРООЛ ХҮРТЭЛ гүйлгээд (эс тэгвэл нугалаанаас доош байгаа товч
   худал дохио өгнө) elementFromPoint-оор шалгана.
   ══════════════════════════════════════════════════════════════ */
const B=require('./base'),S=require('./seed');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
(async()=>{
const br=await B.launch();
const {page,errs}=await B.newPage(br,B.DEVICES[1]);
await B.login(page,'ПД-6'); await S.seed(page);

// Хадгалалтын тэмдэг гарч ирэхийн тулд илгээгээгүй өөрчлөлт хэрэгтэй
await page.evaluate(()=>{
  const sl=Array.from({length:46},(_,i)=>({type:i%7===0?'bad':'normal',ts:0}));
  DB.folders=[
    {id:'fz',name:'Хоосон зам',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      tracks:[{id:'tz',num:5,kind:'station',note:'Шивээговь зөрлөг',sections:[]}]},
    {id:'fr',name:'Үетэй',season:'хавар',year:'2026',date:'2026-04-01',sc:'ПД-6',
      tracks:[{id:'tr',num:9,kind:'station',note:'',sections:[
        {id:'sr',type:'normal',label:'1-р үе',note:'',date:'2026-05-01',sleepers:sl}]}]}];
  activeFolderId='fr';DB.tracks=DB.folders[1].tracks;
  DB.main=[{id:'mz',num:12,kind:'main',mat:'tbd',fast:'CZ',sections:[]}];
  saveDB();
});
await page.waitForTimeout(400);
const hasBadge=await page.evaluate(()=>!!document.getElementById('saveBadge'));
ok('Хадгалалтын тэмдэг гарсан (шалгах нөхцөл бүрдсэн)',hasBadge);

async function check(label,setup){
  const r=await page.evaluate(async(fn)=>{
    // Алдааны улаан мөр нь түр зуурын, хэрэглэгч хааж болдог тул
    // энэ шалгалтад хамаарахгүй
    const eb=document.getElementById('errBanner');if(eb)eb.remove();
    // Хадгалалтын тэмдгийг ЗААВАЛ гаргана. Үүлэнд амжиж илгээгдвэл
    // тэмдэг алга болж, давхарлалт шалгагдахгүй өнгөрөх эрсдэлтэй.
    _dirtySet();
    await new Function('return (async()=>{'+fn+'})()')();
    _dirtySet();
    await new Promise(r=>setTimeout(r,450));
    // Идэвхтэй дэлгэцийг ЁРООЛ хүртэл гүйлгэнэ
    const v=document.querySelector('.view.active');
    const sc=v&&v.querySelector('.home-body,.track-body,.sum-body');
    if(sc){sc.scrollTop=sc.scrollHeight;await new Promise(r=>setTimeout(r,300))}
    _dirtySet();                       // хэмжихийн ЯГ өмнө — завсарт илгээгдэж алга болдог
    const D=el=>el.tagName+'#'+(el.id||'-')+'.'+((el.className||'').toString().trim().slice(0,24)||'-');
    const bad=[];
    document.querySelectorAll('button,[onclick]').forEach(el=>{
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0||cs.pointerEvents==='none')return;
      const b=el.getBoundingClientRect();
      if(b.width<4||b.height<4)return;
      if(b.bottom<=0||b.top>=innerHeight||b.right<=0||b.left>=innerWidth)return;
      const cx=b.left+b.width/2, cy=b.top+b.height/2;
      if(cx<0||cx>innerWidth||cy<0||cy>innerHeight)return;
      const hit=document.elementFromPoint(cx,cy);
      if(!hit||hit===el||el.contains(hit)||hit.contains(el))return;
      // Зөвхөн ТОГТМОЛ давхарга дарж байвал алдаа. Гүйлгээд байхад
      // нугалаанаас гарсан товчийг тооцохгүй.
      let p=hit,fixed=null;
      while(p&&p!==document.body){
        if(getComputedStyle(p).position==='fixed'){fixed=p;break}
        p=p.parentElement}
      if(!fixed)return;
      // Товчийг ӨӨРИЙНХӨӨ сав дарж байвал энэ нь давхарлалт биш,
      // зүгээр л гүйлгэлтийн хайчлалт — тооцохгүй
      if(fixed.contains(el))return;
      bad.push({tovch:(el.textContent||'').trim().slice(0,20)||el.id,darsan:D(fixed)});
    });
    const seen=new Set(),out=[];
    bad.forEach(b=>{const k=b.tovch+b.darsan;if(!seen.has(k)){seen.add(k);out.push(b)}});
    return {bad:out.slice(0,5),badge:!!document.getElementById('saveBadge')}
  },setup);
  ok(label,r.bad.length===0&&r.badge,
     (r.badge?'':'ТЭМДЭГ АЛГА — шалгалт хүчингүй  ')+(r.bad.length?JSON.stringify(r.bad):''));
}

await check('Нүүр',`goHome();`);
await check('Паспортын жагсаалт',`goTab('folders');`);
await check('Сумууд',`goTab('sw');`);
await check('Хоосон зам',`goHome();openFolder('fz');openTrack('tz');`);
await check('Үетэй зам',`goHome();openFolder('fr');openTrack('tr');`);
await check('Гол замын км',`goHome();openTrack('mz');`);
await check('Бүртгэлийн дэлгэц',`goHome();openFolder('fr');openTrack('tr');openSection('sr');`);
await check('Замын дүн',`goHome();openFolder('fr');openTrack('tr');showTrackSummary();`);
await check('Бүх дүн',`showSummaryAll();`);

// Таб гүн дэлгэц дээр доош гулсаж алга болно, буцахад эргэж ирнэ
const slide=await page.evaluate(async()=>{
  goHome();await new Promise(r=>setTimeout(r,400));
  const bar=document.getElementById('tabbar');
  const home=Math.round(bar.getBoundingClientRect().top);
  openFolder('fr');openTrack('tr');await new Promise(r=>setTimeout(r,500));
  const track=Math.round(bar.getBoundingClientRect().top);
  const pe=getComputedStyle(bar).pointerEvents;
  goHome();await new Promise(r=>setTimeout(r,500));
  const back=Math.round(bar.getBoundingClientRect().top);
  return {home,track,back,vh:innerHeight,pe}});
ok('Нүүрэн дээр таб харагдана',slide.home<slide.vh-20,'дээд='+slide.home+' vh='+slide.vh);
ok('Замд орвол таб доош бүрэн гулсана',slide.track>=slide.vh,'дээд='+slide.track);
ok('Гулссан таб дарагдахгүй',slide.pe==='none',slide.pe);
ok('Буцахад таб эргэж ирнэ',slide.back<slide.vh-20,'дээд='+slide.back);

// "Үе нэмэх" товч үнэхээр ажиллана
const works=await page.evaluate(async()=>{
  goHome();openFolder('fz');openTrack('tz');
  await new Promise(r=>setTimeout(r,450));
  const b=[...document.querySelectorAll('.add-sec-btn')].find(x=>/Үе нэмэх/.test(x.textContent));
  if(!b)return 'товч алга';
  const r=b.getBoundingClientRect();
  const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  if(hit!==b&&!b.contains(hit))return 'дарагдсан: '+hit.tagName+'.'+hit.className;
  b.click();await new Promise(r=>setTimeout(r,450));
  return document.getElementById('addSecModal').classList.contains('open')?'ok':'цонх нээгдсэнгүй'});
ok('"Үе нэмэх" дарахад цонх нээгдэнэ',works==='ok',works);

const bad=errs.filter(e=>!/ERR_REQUEST_RANGE|favicon/.test(e));
ok('Консолд алдаа алга',bad.length===0,JSON.stringify(bad.slice(0,3)));
console.log('SUMMARY '+R.filter(Boolean).length+'/'+R.length);
await br.close();process.exit(R.every(Boolean)?0:1);
})();
