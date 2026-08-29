// СТУБГҮЙ ачаалалт — "апп огт ажиллахгүй байна" гэсэн тохиолдлыг барина.
// Бусад тестүүд page.evaluate-ээр DOM-ыг шууд удирддаг тул скрипт
// задлан шинжлэгдээгүй байсан ч анзаарахгүй өнгөрдөг байв.
const B=require('./base');
const R=[];function ok(n,c,d){R.push({n,c:!!c});console.log((c?'  ✓ ':'  ✗ ')+n+(d?'  — '+d:''))}
(async()=>{
const BASE=await B.ensureServer();
const b=await B.launch();
for(const [nm,vp] of [['iPhone 12',{width:390,height:844}],['Galaxy Fold',{width:280,height:653}]]){
  const ctx=await b.newContext({viewport:vp,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  const fatal=[];
  p.on('pageerror',e=>fatal.push(e.message));
  await p.goto(BASE+'/index.html',{waitUntil:'load'});
  await p.waitForTimeout(1800);
  const s=await p.evaluate(()=>({
    err:!!document.querySelector('body')&&typeof doLogin==='function',
    intro:!!document.getElementById('introOverlay'),
    login:(()=>{const e=document.getElementById('loginCode');return !!e&&e.offsetParent!==null})(),
    build:typeof APP_BUILD!=='undefined'?APP_BUILD:'—',
    fns:['doLogin','renderHome','renderSwHome','countTo','exportSwForms','_appBack']
      .filter(f=>typeof window[f]!=='function')
  }));
  ok(nm+' · скрипт задлан шинжлэгдэв',s.err&&!s.fns.length,'дутуу: '+JSON.stringify(s.fns));
  ok(nm+' · JS-ийн үхлийн алдаа алга',fatal.length===0,JSON.stringify(fatal.slice(0,2)));
  ok(nm+' · интро өөрөө арилав',!s.intro);
  ok(nm+' · нэвтрэх талбар харагдав',s.login);
  ok(nm+' · хувилбар уншигдав',/^\d{4}\.\d{2}\.\d{2}·\d+$/.test(s.build),s.build);
  await ctx.close();
}
console.log('SUMMARY '+R.filter(r=>r.c).length+'/'+R.length);
await b.close();
if(R.some(r=>!r.c))process.exit(1);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
