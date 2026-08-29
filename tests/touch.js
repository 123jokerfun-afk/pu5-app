// CDP-based touch helpers
async function cdp(page){ if(!page.__cdp) page.__cdp=await page.context().newCDPSession(page); return page.__cdp }
async function tap(page,x,y){
  const c=await cdp(page);
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await page.waitForTimeout(40);
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(80);
}
async function swipe(page,x,y,dx,dy,steps){
  steps=steps||8;
  const c=await cdp(page);
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let i=1;i<=steps;i++){
    await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/steps,y:y+dy*i/steps,id:1}]});
    await page.waitForTimeout(16);
  }
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(120);
}
async function longPress(page,x,y,ms){
  const c=await cdp(page);
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await page.waitForTimeout(ms||750);
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(150);
}
async function box(page,sel){
  const el=await page.$(sel); if(!el) return null;
  const b=await el.boundingBox(); return b;
}
async function center(page,sel){const b=await box(page,sel);return b?{x:b.x+b.width/2,y:b.y+b.height/2}:null}
module.exports={tap,swipe,longPress,box,center,cdp};
