const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(__dirname+'/local-image-save.js','utf8');
async function run({bytes=Buffer.from([1,2,3]),type='image/jpeg',max=100,reject=false,cached=false,blocked=false}={}){
 const messages=[];let requested;
 const bridge={postMessage(raw){const m=JSON.parse(raw);messages.push(m);if(m.kind!=='abort')queueMicrotask(()=>bridge.onmessage?.({data:reject?'error':'ok'}));}};
 const ctx=vm.createContext({window:{FproLocalImage:bridge,__fproLocalImageSource:cached?{take:url=>({size:bytes.length,type,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)})}:null},fetch:async url=>{requested=url;if(blocked)throw Error("blocked");return {ok:true,blob:async()=>({size:bytes.length,type,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)})};},Uint8Array,btoa:s=>Buffer.from(s,'binary').toString('base64'),setTimeout,clearTimeout,Error});
 await vm.runInContext(code,ctx)({url:'blob:https://m.facebook.com/exact-token',id:'one-attempt',mime:'image/jpeg',max});return {messages,requested};
}
test('blob reader uses the exact callback URL, sequences bounded chunks and waits for acknowledgements',async()=>{const bytes=Buffer.alloc(70000,7),r=await run({bytes,max:80000});assert.equal(r.requested,'blob:https://m.facebook.com/exact-token');assert.deepEqual(r.messages.map(m=>m.kind),['chunk','chunk','chunk','end']);assert.deepEqual(r.messages.slice(0,3).map(m=>m.seq),[0,1,2]);assert.ok(r.messages.every(m=>m.id==='one-attempt'));assert.deepEqual(Buffer.concat(r.messages.slice(0,3).map(m=>Buffer.from(m.data,'base64'))),bytes);});
test('oversized blob never sends bytes',async()=>{const r=await run({bytes:Buffer.alloc(101),max:100});assert.deepEqual(r.messages.map(m=>m.kind),['abort']);});
test('wrong blob MIME never sends bytes',async()=>{const r=await run({type:'text/html'});assert.deepEqual(r.messages.map(m=>m.kind),['abort']);});
test('native rejection stops further chunks',async()=>{const r=await run({bytes:Buffer.alloc(70000),max:80000,reject:true});assert.deepEqual(r.messages.map(m=>m.kind),['chunk','abort']);});

test('retained exact blob is read without fetch, including revoked/CSP-blocked cases',async()=>{const r=await run({cached:true,blocked:true});assert.equal(r.requested,undefined);assert.deepEqual(r.messages.map(m=>m.kind),['chunk','end']);});
test('unavailable source reports only fixed fetch stage instead of raw exception details',async()=>{const r=await run({blocked:true});assert.equal(r.messages[0].kind,'abort');assert.equal(r.messages[0].stage,'fetch');assert.equal(r.messages[0].cached,false);assert.ok(!JSON.stringify(r.messages).includes('blocked'));});
