// Fake Firebase, injected before page scripts
(function(){
  const store = {};           // path -> data
  const listeners = {};
  function tsNow(){const d=Date.now();return {toMillis:()=>d,toDate:()=>new Date(d)}}
  function docRef(col,id){
    const key=col+'/'+id;
    return {
      get(){return Promise.resolve({exists:!!store[key],id:id,data:()=>store[key]})},
      set(v){store[key]=JSON.parse(JSON.stringify(v));store[key].updatedAt=tsNow();
             (listeners[key]||[]).forEach(f=>{try{f({exists:true,data:()=>store[key],metadata:{hasPendingWrites:false}})}catch(e){}});
             return Promise.resolve()},
      onSnapshot(a,b){listeners[key]=listeners[key]||[];listeners[key].push(typeof a==='function'?a:b);
             return function(){}}
    }
  }
  const fs=function(){return {
    settings(){},
    enablePersistence(){return Promise.resolve()},
    collection(c){return {
      doc(id){return docRef(c,id)},
      get(){return Promise.resolve({docs:Object.keys(store).filter(k=>k.indexOf(c+'/')===0).map(k=>({id:k.split('/')[1],data:()=>store[k]}))})}
    }}
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
