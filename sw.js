/* ══════════════════════════════════════════════════════════════
   ПУ-5 — SERVICE WORKER

   Талбар дээр 4G-ээр ажилладаг тул нээх бүрд 548 КиБ index.html
   болон гадны сангуудыг сүлжээнээс хүлээх нь хамгийн том саад
   байв. Энд кэшлэснээр нээлт бараг агшин зуур болж, сүлжээгүй ч
   бүрэн ажиллана.

   ХАМГИЙН ЧУХАЛ ДҮРЭМ: хэрэглэгчийг ХУУЧИН хувилбарт хорихгүй.
   · version.txt-г ХЭЗЭЭ Ч кэшлэхгүй — аппын шинэчлэлт шалгагч
     үргэлж үнэнийг хардаг.
   · index.html нь stale-while-revalidate — кэшнээс шууд өгөөд,
     ард нь шинийг татна. Дараагийн нээлтэд шинэ нь ирнэ.
   · Идэвхжихдээ өөр хувилбарын кэшийг устгана.
   ══════════════════════════════════════════════════════════════ */
const VER='2026.09.05-118';
const CACHE='pu5-'+VER;

/* Гадны сангууд. Хаяг нь хувилбар агуулсан тул өөрчлөгддөггүй —
   нэг татсаныхаа дараа кэшнээс өгч болно. */
const CDN=/^https:\/\/(www\.gstatic\.com\/firebasejs|cdnjs\.cloudflare\.com\/ajax\/libs\/exceljs)\//;

self.addEventListener('install',e=>{
  // index.html-г урьдчилан кэшлэнэ. Амжилтгүй болвол суулгалт УНАХГҮЙ —
  // эс тэгвэл сүлжээ муутай үед service worker огт суухгүй үлдэнэ.
  e.waitUntil(caches.open(CACHE)
    .then(c=>c.add(new Request('index.html',{cache:'reload'})))
    .catch(()=>{})
    .then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('pu5-')&&k!==CACHE)
      .map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Апп өөрөө "кэшээ хая" гэж хэлж чадна — хэрэв шинэчлэлт ирэхгүй
   гацвал аппын шалгагч үүнийг дуудаж, аврах гарц болно. */
self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='PU5_CLEAR'){
    e.waitUntil(caches.keys().then(ks=>Promise.all(
      ks.filter(k=>k.startsWith('pu5-')).map(k=>caches.delete(k)))))
  }
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  let url;try{url=new URL(req.url)}catch(_){return}

  // version.txt — ХЭЗЭЭ Ч кэшлэхгүй. Шинэчлэлт илрүүлэлт үүнээс хамаарна.
  if(/version\.txt$/.test(url.pathname))return;

  const sameOrigin=url.origin===self.location.origin;
  const isDoc=req.mode==='navigate'||
    (sameOrigin&&/(^\/|\/|index\.html)$/.test(url.pathname)&&/index\.html$|\/$/.test(url.pathname));

  // Аппын хуудас — кэшнээс шууд өгөөд, ард нь шинэчилнэ
  if(isDoc){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const hit=await c.match('index.html');
      const net=fetch(req).then(r=>{
        if(r&&r.ok)c.put('index.html',r.clone()).catch(()=>{});
        return r
      }).catch(()=>null);
      if(hit){e.waitUntil(net);return hit}
      const r=await net;
      return r||new Response('<h1>Сүлжээгүй байна</h1>',
        {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
    })());
    return
  }

  // Гадны сан — кэшнээс, байхгүй бол татаад кэшилнэ
  if(CDN.test(req.url)){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const hit=await c.match(req);
      if(hit)return hit;
      const r=await fetch(req).catch(()=>null);
      if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone()).catch(()=>{});
      return r||Response.error();
    })());
    return
  }

  // Бусад нэг гарлын файл — сүлжээ эхэлж, унавал кэшнээс
  if(sameOrigin){
    e.respondWith(fetch(req).then(r=>{
      if(r&&r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(req,cl)).catch(()=>{})}
      return r
    }).catch(()=>caches.match(req).then(m=>m||Response.error())));
  }
});
