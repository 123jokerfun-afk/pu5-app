// Firebase-ийн хуурамч хувилбар — хуудасны скриптүүдээс өмнө суулгана.
// Дэд бүлэг (sections/<код>/parts/*) болон batch-ийг дэмжинэ — апп
// паспорт бүрийг тусдаа баримтад хадгалдаг болсон тул шаардлагатай.
(function(){
  const store = {};           // зам -> өгөгдөл
  const listeners = {};       // зам эсвэл бүлгийн зам -> дуудагчид
  function tsNow(){const d=Date.now();return {toMillis:()=>d,toDate:()=>new Date(d)}}
  function clone(v){return JSON.parse(JSON.stringify(v))}

  function colSnap(path){
    const pre=path+'/';
    const ids=Object.keys(store).filter(k=>k.indexOf(pre)===0
      && k.slice(pre.length).indexOf('/')<0);
    const docs=ids.map(k=>({id:k.slice(pre.length),data:()=>store[k]}));
    return {empty:docs.length===0,size:docs.length,docs:docs,
      metadata:{hasPendingWrites:false},
      forEach(f){docs.forEach(f)}};
  }
  function fireCol(path){
    (listeners['col:'+path]||[]).forEach(f=>{try{f(colSnap(path))}catch(e){}});
  }
  function docRef(path){
    return {
      get(){return Promise.resolve({exists:!!store[path],id:path.split('/').pop(),
        data:()=>store[path],metadata:{hasPendingWrites:false}})},
      set(v,opt){
        const cur=(opt&&opt.merge&&store[path])?store[path]:{};
        store[path]=Object.assign({},cur,clone(v));
        store[path].updatedAt=tsNow();
        if(v&&v.u!==undefined)store[path].u=tsNow();
        (listeners[path]||[]).forEach(f=>{try{f({exists:true,data:()=>store[path],
          metadata:{hasPendingWrites:false}})}catch(e){}});
        fireCol(path.split('/').slice(0,-1).join('/'));
        return Promise.resolve()},
      delete(){delete store[path];
        fireCol(path.split('/').slice(0,-1).join('/'));return Promise.resolve()},
      onSnapshot(a,b){listeners[path]=listeners[path]||[];
        listeners[path].push(typeof a==='function'?a:b);return function(){}},
      collection(c){return colRef(path+'/'+c)}
    }
  }
  function colRef(path){
    return {
      doc(id){return docRef(path+'/'+id)},
      get(){return Promise.resolve(colSnap(path))},
      onSnapshot(a,b){const k='col:'+path;listeners[k]=listeners[k]||[];
        listeners[k].push(typeof a==='function'?a:b);return function(){}}
    }
  }
  const fs=function(){return {
    settings(){},
    enablePersistence(){return Promise.resolve()},
    collection(c){return colRef(c)},
    batch(){
      const ops=[];
      return {set(ref,v){ops.push(()=>ref.set(v));return this},
              delete(ref){ops.push(()=>ref.delete());return this},
              commit(){return Promise.all(ops.map(f=>f()))}}
    }
  }};
  fs.FieldValue={serverTimestamp:tsNow};
  let authCbs=[];
  const auth=function(){return {
    currentUser:null,
    signInWithEmailAndPassword(e,p){
      const u={uid:'test-uid',email:e};
      this.currentUser=u;window.__fakeUser=u;
      return Promise.resolve({user:u})
    },
    signOut(){this.currentUser=null;return Promise.resolve()},
    onAuthStateChanged(cb){authCbs.push(cb);setTimeout(()=>cb(null),0);return function(){}}
  }};
  window.firebase={
    initializeApp(){return {name:'[DEFAULT]'}},
    app(){return {name:'[DEFAULT]'}},
    auth:auth,
    firestore:fs
  };
  window.__fbStore=store;
})();
