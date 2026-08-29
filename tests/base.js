/* ══════════════════════════════════════════════════════════════
   ШАЛГАЛТЫН СУУРЬ

   Зөөврийн байхаар бичсэн: Playwright болон Chromium-ыг хэд хэдэн
   байрлалаас хайна, статик серверийг ӨӨРӨӨ асаана (сул портоор,
   тиймээс хэдэн шалгалт зэрэг ажиллаж болно), exceljs байхгүй ч
   унахгүй.
   ══════════════════════════════════════════════════════════════ */
const fs=require('fs'),path=require('path'),http=require('http');

/* ── Playwright ─────────────────────────────────────────────── */
function loadPW(){
  const tries=['playwright','playwright-core',
    '/opt/node22/lib/node_modules/playwright',
    '/usr/lib/node_modules/playwright',
    path.join(__dirname,'node_modules','playwright')];
  for(const t of tries){try{return require(t)}catch(e){}}
  throw new Error('Playwright олдсонгүй. Суулгах: npm i -D playwright');
}
const {chromium}=loadPW();

/* ── Chromium-ын байршил ────────────────────────────────────── */
function findExe(){
  if(process.env.PU5_CHROME&&fs.existsSync(process.env.PU5_CHROME))return process.env.PU5_CHROME;
  const roots=[process.env.PLAYWRIGHT_BROWSERS_PATH,'/opt/pw-browsers'].filter(Boolean);
  for(const r of roots){
    let ents=[];try{ents=fs.readdirSync(r)}catch(e){continue}
    for(const d of ents.filter(x=>x.startsWith('chromium')).sort().reverse()){
      for(const rel of ['chrome-linux/chrome','chrome-linux/headless_shell']){
        const p=path.join(r,d,rel);
        if(fs.existsSync(p))return p;
      }
    }
  }
  return undefined;              // Playwright өөрөө олог
}
const EXE=findExe();
/* Шалгалтууд үүнийг дуудна — өөр өөрийнхөөрөө зам бичихгүй */
function launch(opts){
  return chromium.launch(Object.assign(
    {args:['--no-sandbox']}, EXE?{executablePath:EXE}:{}, opts||{}));
}

/* ── Аппыг өгөх статик сервер ───────────────────────────────── */
const ROOT=path.join(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript',
  '.css':'text/css','.png':'image/png','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8'};
let _srv=null,_base=null;
function ensureServer(){
  if(_base)return Promise.resolve(_base);
  return new Promise((res,rej)=>{
    _srv=http.createServer((q,s)=>{
      const rel=decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'');
      const f=path.join(ROOT,rel||'index.html');
      if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){
        s.writeHead(404);return s.end('not found')}
      s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
      fs.createReadStream(f).pipe(s);
    });
    _srv.on('error',rej);
    _srv.listen(0,'127.0.0.1',()=>{                 // 0 = сул портыг өөрөө сонгоно
      _base='http://127.0.0.1:'+_srv.address().port;
      _srv.unref();                                  // процесс дуусахад саад болохгүй
      res(_base);
    });
  });
}

const STUB=fs.readFileSync(path.join(__dirname,'stub.js'),'utf8');
/* exceljs байхгүй бол хоосон оронд нь тавина — Excel-ийн шалгалт л
   унана, бусад нь хэвийн ажиллана */
let EXCELJS='';
try{EXCELJS=fs.readFileSync(
  path.join(__dirname,'node_modules','exceljs','dist','exceljs.min.js'),'utf8')}catch(e){}

const DEVICES=[
  {name:'iPhone SE (375x667)',       vp:{width:375,height:667}, dsf:2, touch:true, ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'},
  {name:'iPhone 12 (390x844)',       vp:{width:390,height:844}, dsf:3, touch:true, ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'},
  {name:'iPhone 14 Pro Max (430x932)',vp:{width:430,height:932},dsf:3, touch:true, ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'},
  {name:'Android small (360x640)',   vp:{width:360,height:640}, dsf:2, touch:true, ua:'Mozilla/5.0 (Linux; Android 10; SM-A105F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'},
  {name:'Galaxy Fold (280x653)',     vp:{width:280,height:653}, dsf:3, touch:true, ua:'Mozilla/5.0 (Linux; Android 12; SM-F900U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'},
  {name:'Pixel 7 (412x915)',         vp:{width:412,height:915}, dsf:2.6,touch:true,ua:'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'},
  {name:'Tablet (768x1024)',         vp:{width:768,height:1024},dsf:2, touch:true, ua:'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'},
];

async function newPage(browser,dev){
  const base=await ensureServer();
  const ctx=await browser.newContext({storageState:undefined,
    viewport:dev.vp,deviceScaleFactor:dev.dsf,isMobile:true,hasTouch:dev.touch,userAgent:dev.ua
  });
  await ctx.addInitScript(STUB);
  const page=await ctx.newPage();
  await page.route('**/exceljs*.js',r=>r.fulfill({status:200,
    contentType:'application/javascript',body:EXCELJS}));
  await page.route('**/*.gstatic.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/*stub*/'}));
  await page.route('**/intro.mp4',r=>r.fulfill({status:200,contentType:'video/mp4',body:''}));
  const errs=[];
  page.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text())});
  page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')));
  page.__errs=errs;
  await page.goto(base+'/index.html',{waitUntil:'load'});
  return {ctx,page,errs};
}

async function login(page,code){
  code=code||'ПЧ-1';
  await page.waitForSelector('#loginCode',{timeout:10000});
  await page.fill('#loginCode',code);
  await page.fill('#loginPass','test1234');
  await page.click('#loginBtn');
  await page.waitForFunction(()=>document.getElementById('homeView')&&document.getElementById('homeView').classList.contains('active'),{timeout:15000});
  await page.waitForTimeout(1900);
  // импортын асуулт гарвал үгүй гэж хаана
  await page.evaluate(()=>{const m=document.getElementById('appConfirmModal');
    if(m&&m.classList.contains('open')){const b=document.getElementById('appConfirmCancelBtn');if(b)b.click()}});
  await page.waitForTimeout(250);
}

// Дэлгэцээс хальсан элемент
async function overflow(page){
  return await page.evaluate(()=>{
    const bad=[];
    const vw=document.documentElement.clientWidth;
    document.querySelectorAll('*').forEach(el=>{
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return;
      const r=el.getBoundingClientRect();
      if(r.width===0||r.height===0)return;
      if(r.right>vw+1.5||r.left<-1.5){
        let p=el.parentElement,scrollable=false;
        while(p&&p!==document.body){const pc=getComputedStyle(p);
          if(pc.overflowX==='auto'||pc.overflowX==='scroll'){scrollable=true;break}
          p=p.parentElement}
        if(scrollable)return;
        bad.push({tag:el.tagName,cls:(el.className&&el.className.toString().slice(0,60))||'',id:el.id||'',
                  left:Math.round(r.left),right:Math.round(r.right),vw,txt:(el.textContent||'').trim().slice(0,40)})
      }
    });
    const seen=new Set(),out=[];
    bad.forEach(b=>{const k=b.tag+b.cls+b.id;if(seen.has(k))return;seen.add(k);out.push(b)});
    return out.slice(0,15)
  })
}

// Хуруунд жижиг товч
async function tapTargets(page){
  return await page.evaluate(()=>{
    const bad=[];
    document.querySelectorAll('button,[onclick],a,input[type=button]').forEach(el=>{
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden')return;
      const r=el.getBoundingClientRect();
      if(r.width===0||r.height===0)return;
      if(r.height<28||r.width<28)
        bad.push({tag:el.tagName,cls:(el.className||'').toString().slice(0,40),w:Math.round(r.width),h:Math.round(r.height),txt:(el.textContent||'').trim().slice(0,25)})
    });
    const seen=new Set(),out=[];
    bad.forEach(b=>{const k=b.tag+b.cls+b.txt;if(seen.has(k))return;seen.add(k);out.push(b)});
    return out.slice(0,20)
  })
}

module.exports={chromium,launch,EXE,DEVICES,newPage,login,overflow,tapTargets,ensureServer,STUB};
