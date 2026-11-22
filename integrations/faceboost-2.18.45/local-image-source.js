(function(w){
 'use strict';if(w!==w.top||w.__fproLocalImageSource)return;
 const entries=new Map(),MAX=8*1024*1024,TTL=5000;
 const create=w.URL.createObjectURL.bind(w.URL);
 const drop=url=>{const entry=entries.get(url);if(entry){w.clearTimeout(entry.timer);entries.delete(url);}};
 const clear=()=>{for(const url of entries.keys())drop(url);};
 w.__fproLocalImageSource={take(url){const entry=entries.get(url);if(!entry)return null;drop(url);return entry.until>=Date.now()?entry.blob:null;}};
 w.URL.createObjectURL=function(object){
  const url=create(object);
  if(object instanceof w.Blob&&object.size>0&&object.size<=MAX&&(!object.type||/^image\/(?:jpeg|png|webp|gif|avif)$/i.test(object.type))){
   let total=object.size;for(const entry of entries.values())total+=entry.blob.size;
   while(entries.size&&(entries.size>=2||total>MAX)){const key=entries.keys().next().value;total-=entries.get(key).blob.size;drop(key);}
   const entry={blob:object,until:Date.now()+TTL,timer:null};
   entry.timer=w.setTimeout(()=>drop(url),TTL);entries.set(url,entry);
  }
  return url;
 };
 // Do not replace revokeObjectURL: the website's revocation still happens immediately.
 w.addEventListener('pagehide',clear,true);
 w.addEventListener('popstate',clear,true);
})(window);
