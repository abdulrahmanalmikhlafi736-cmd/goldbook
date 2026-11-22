(async function(input) {
 'use strict';
 const bridge=window.FproLocalImage;
 if(!bridge)return;
 const send=message=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{bridge.onmessage=null;reject(Error('timeout'));},3000);
  bridge.onmessage=event=>{clearTimeout(timer);bridge.onmessage=null;event.data==='ok'?resolve():reject(Error('rejected'));};
  bridge.postMessage(JSON.stringify({...message,id:input.id}));
 });
 try {
  const response=await fetch(input.url);
  if(!response.ok)throw Error('fetch');
  const blob=await response.blob();
  if(blob.size<=0||blob.size>input.max||(blob.type&&blob.type.toLowerCase()!==input.mime))throw Error('type/size');
  const bytes=new Uint8Array(await blob.arrayBuffer());
  for(let offset=0,seq=0;offset<bytes.length;offset+=32768,seq++){
   const part=bytes.subarray(offset,Math.min(offset+32768,bytes.length));
   let binary='';for(let i=0;i<part.length;i++)binary+=String.fromCharCode(part[i]);
   await send({kind:'chunk',seq,data:btoa(binary)});
  }
  await send({kind:'end'});
 }catch(_){try{bridge.postMessage(JSON.stringify({kind:'abort',id:input.id}));}catch(_){} }
})
