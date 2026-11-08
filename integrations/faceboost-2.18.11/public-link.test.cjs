const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
function fixture(body='<article><video src="blob:https://m.facebook.com/current"></video></article>',url='https://m.facebook.com/reel/111/'){
 const d=new JSDOM(body,{url,runScripts:'outside-only'}),w=d.window,v=w.document.querySelector('video');
 w.eval(fs.readFileSync(__dirname+'/public-video-link.js','utf8'));return {d,w,v,api:w.FproPublicVideoLink,close:()=>d.window.close()};
}
function run(body,fn,url){const f=fixture(body,url);try{fn(f);}finally{f.close();}}
test('deep article permalink works beyond old four ancestor limit and removes trackers',()=>run('<article><a href="/owner/posts/pfbid123/?tracking=private">time</a><section><div><div><div><div><video></video></div></div></div></div></section></article>',({api,v})=>{api.remember(v);assert.equal(api.resolve(v).url,'https://www.facebook.com/owner/posts/pfbid123/');}));
test('scoped data-store video id is preferred over a random nearby anchor',()=>run('<article data-store=\'{"videoData":[{"videoID":"987654"}]}\'><a href="/watch/?v=123">unrelated</a><video></video></article>',({api,v})=>{api.remember(v);assert.equal(api.resolve(v).url,'https://www.facebook.com/watch/?v=987654');}));
test('metadata permalink and post owner/id are supported',()=>run('<article data-ft=\'{"top_level_post_id":"pfbid987","content_owner_id_new":"42"}\'><video></video></article>',({api,v})=>{api.remember(v);assert.equal(api.resolve(v).url,'https://www.facebook.com/permalink.php?story_fbid=pfbid987&id=42');}));
test('share and short links canonicalize; unsafe/general/private routes do not',()=>run(undefined,({api})=>{
 for(const value of ['https://www.facebook.com/','https://www.facebook.com/groups/12/','http://facebook.com/watch/?v=123','https://facebook.com.evil.test/reel/123/','https://x@facebook.com/reel/123/','blob:https://facebook.com/123','https://facebook.com/watch/?v=abc'])assert.equal(api.parse(value),null,value);
 assert.equal(api.parse('https://fb.watch/abc_123/?tracking=x').url,'https://fb.watch/abc_123/');
 assert.equal(api.parse('https://m.facebook.com/share/r/abc123/?x=y').url,'https://www.facebook.com/share/r/abc123/');
}));
test('URL alone is never proof, including newly attached player on stale first Reel route',()=>run(undefined,({api,v})=>{api.remember(v);assert.equal(api.resolve(v).url,'');}));
test('recycled player cannot export stale ID, anchor or old address; new scoped ID works',()=>run('<article data-video-id="111"><a href="/reel/111/">old</a><video src="blob:old"></video></article>',({api,v})=>{api.remember(v);v.src='blob:new';assert.equal(api.resolve(v).url,'');v.parentElement.dataset.videoId='222';assert.equal(api.resolve(v).url,'https://www.facebook.com/watch/?v=222');}));
test('ambiguous anchors fail closed rather than use first',()=>run('<article><a href="/reel/111/">a</a><a href="/reel/222/">b</a><video></video></article>',({api,v})=>{api.remember(v);assert.equal(api.resolve(v).reason,'ambiguous-links');}));
test('two scoped video ids fail closed',()=>run('<article data-store=\'{"videoData":[{"videoID":"111"},{"videoID":"222"}]}\'><video></video></article>',({api,v})=>{api.remember(v);assert.equal(api.resolve(v).reason,'ambiguous-ids');}));
test('adjacent post and outer multi-player container do not leak first link',()=>run('<main><article><a href="/reel/111/">first</a><video id="other"></video></article><article><video id="current"></video></article></main>',({api,w})=>{const v=w.document.querySelector('#current');api.remember(v);assert.equal(api.resolve(v).url,'');}));
test('hidden dialog/comment anchors are not evidence',()=>run('<article><div role="comment"><a href="/reel/999/">comment</a></div><div aria-hidden="true"><a href="/reel/998/">hidden</a></div><video></video></article>',({api,v})=>{api.remember(v);assert.equal(api.resolve(v).url,'');}));
test('detached players and divergent old currentSrc never export old media',()=>run(undefined,({api,v})=>{api.remember(v);Object.defineProperty(v,'currentSrc',{value:'https://video.fbcdn.net/old.mp4'});v.src='https://video.fbcdn.net/new.mp4';assert.equal(api.safeMedia(v,'https://video.fbcdn.net/old.mp4'),'');v.remove();assert.equal(api.resolve(v).reason,'detached');}));
test('duplicate representations of same video are unambiguous',()=>run('<article><a href="/reel/987/">a</a><a href="/watch/?v=987&tracking=x">b</a><video></video></article>',({api,v})=>{api.remember(v);assert.equal(api.resolve(v).url,'https://www.facebook.com/watch/?v=987');}));
