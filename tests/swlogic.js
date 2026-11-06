/* sw.js-ийн fetch логикийг Node дээр шууд шалгана.
   Playwright-ийн setOffline нь service worker-ийн ӨӨРИЙН fetch-ийг тасалдаггүй
   тул хөтөч дээрх "офлайн" шалгалт сүлжээгүй замыг бодитоор дайрдаггүй.
   Энд кэш, сүлжээг хуурамчаар орлуулж, сүлжээг жинхэнээр "тасална". */
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=[];const ok=(n,c,d)=>{R.push(!!c);console.log((c?'  ✓ ':'  ✗ ')+n+(d!==undefined?'  — '+d:''))};
const SRC=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
const ORIGIN='https://app.test';

function makeSW({online,cached,addFails}){
  const store=new Map();        // кэшийн түлхүүр → Response
  if(cached)store.set('index.html',new Response('КЭШ',{headers:{'Content-Type':'text/html'}}));
  const key=r=>{const u=typeof r==='string'?r:r.url;return u.replace(ORIGIN+'/','')};
  const cache={
    match:async r=>{const v=store.get(key(r));return v?v.clone():undefined},
    put:async(r,res)=>{store.set(key(r),res)},
    add:async r=>{if(addFails&&addFails.n-->0)throw new TypeError('add failed');
      store.set(key(r),new Response('УРЬДЧИЛСАН',{headers:{'Content-Type':'text/html'}}))}
  };
  const handlers={};
  const self={location:{origin:ORIGIN},addEventListener:(t,f)=>{handlers[t]=f},
    skipWaiting:()=>{},clients:{claim:async()=>{}}};
  // Хөтөч дээр 'index.html' нь service worker-ийн байрлалаас тооцогддог; Node-ийн
  // Request харьцангуй хаягийг хүлээж авдаггүй тул адил байдлаар тооцоолно
  class Req extends Request{constructor(u,o){super(new URL(u,ORIGIN+'/').href,o)}}
  const ctx={self,URL,Request:Req,Response,Promise,console,
    caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true,match:cache.match},
    fetch:async()=>{if(!online)throw new TypeError('Failed to fetch');
      return new Response('СҮЛЖЭЭ',{status:200,headers:{'Content-Type':'text/html'}})}};
  vm.createContext(ctx);vm.runInContext(SRC,ctx);
  async function go(url,mode){
    let p=null;const waits=[];
    handlers.fetch({request:{method:'GET',url:ORIGIN+url,mode:mode||'navigate'},
      respondWith:x=>{p=x},waitUntil:x=>waits.push(x)});
    if(!p)return null;            // service worker огт хариулаагүй
    const r=await p;await Promise.all(waits).catch(()=>{});
    return {status:r.status,body:await r.text()}
  }
  async function life(t){const w=[];handlers[t]({waitUntil:x=>w.push(x)});await Promise.all(w)}
  return {go,store,life}
}

(async()=>{
  console.log('\nsw.js — сүлжээтэй');
  {
    const sw=makeSW({online:true,cached:true});
    const a=await sw.go('/index.html');
    ok('Энгийн нээлт кэшнээс шууд', a&&a.body==='КЭШ', a&&a.body);
    const b=await sw.go('/index.html?v=2099-1');
    ok('?v= хүсэлт сүлжээнээс шинэ файл', b&&b.body==='СҮЛЖЭЭ', b&&b.body);
    ok('version.txt-д service worker оролцохгүй', (await sw.go('/version.txt','cors'))===null);
  }
  console.log('\nsw.js — сүлжээгүй');
  {
    const sw=makeSW({online:false,cached:true});
    const a=await sw.go('/index.html');
    ok('Энгийн нээлт кэшнээс', a&&a.body==='КЭШ', a&&a.body);
    const b=await sw.go('/index.html?v=2099-1');
    ok('?v=-тэй хаяг ч кэшнээс нээгдэнэ', b&&b.body==='КЭШ'&&b.status===200, b&&(b.status+' '+b.body.slice(0,30)));
    const c=await sw.go('/?v=2099-1');
    ok('Үндсэн хаяг ?v=-тэй ч кэшнээс', c&&c.body==='КЭШ', c&&c.body.slice(0,30));
  }
  {
    const sw=makeSW({online:false,cached:false});
    const a=await sw.go('/index.html?v=2099-1');
    ok('Кэш ч сүлжээ ч байхгүй бол ойлгомжтой мэдэгдэл', a&&a.status===503&&/Сүлжээгүй/.test(a.body), a&&a.status);
  }
  console.log('\nsw.js — суулгах/идэвхжих');
  {
    const sw=makeSW({online:true,cached:false,addFails:{n:1}});
    await sw.life('install');
    ok('Суулгах үеийн кэшлэлт бүтэлгүйтсэн (дуурайлга)', !sw.store.has('index.html'));
    await sw.life('activate');
    ok('Идэвхжихдээ дахин оролдож кэшлэнэ', sw.store.has('index.html'));
  }
  const p=R.filter(Boolean).length;
  console.log(`\nSUMMARY ${p}/${R.length}`);
  process.exit(p===R.length?0:1);
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
