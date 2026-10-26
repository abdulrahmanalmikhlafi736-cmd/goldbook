const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/pull-refresh.js','utf8');
function fixture(html){const d=new JSDOM('<!doctype html><body>'+html+'</body>',{url:'https://m.facebook.com/',pretendToBeVisual:true,runScripts:'outside-only'});const w=d.window;let hit=w.document.querySelector('#hit');w.document.elementFromPoint=(x,y)=>{assert.equal(x,30);assert.equal(y,60);return hit;};return {w,doc:w.document,query:()=>w.eval(source.replace('__X__','60').replace('__Y__','120').replace('__WIDTH__',String(w.innerWidth*2)))};}
{
 const f=fixture('<article role="button"><p id="hit">Like minded prose can still be pulled or selected.</p></article>');assert(f.query(),'Reading article at top permits deliberate pull');const range=f.doc.createRange();range.selectNodeContents(f.doc.querySelector('#hit'));f.w.getSelection().addRange(range);assert.equal(f.query(),false,'Existing text selection protects Copy/handles');f.w.getSelection().removeAllRanges();Object.defineProperty(f.w,'scrollY',{value:25});assert.equal(f.query(),false,'Document not at top');f.w.close();
}
for(const html of ['<button id="hit">Like</button>','<div role="button"><span id="hit">إعجاب · 12</span></div>','<video id="hit"></video>','<input id="hit">','<div contenteditable="true" id="hit">Draft</div>','<div role="dialog"><p id="hit">Popup</p></div>','<a id="hit" href="/profile.php">Profile</a>']){const f=fixture(html);assert.equal(f.query(),false,'Never refresh from an action/editor/media/dialog: '+html);f.w.close();}
{
 const f=fixture('<section id="nested" style="overflow-y:auto"><p id="hit">Nested feed</p></section>');const n=f.doc.querySelector('#nested');Object.defineProperty(n,'scrollHeight',{value:900});Object.defineProperty(n,'clientHeight',{value:200});n.scrollTop=100;assert.equal(f.query(),false,'Nested feed mid-scroll must not reload whole page');n.scrollTop=0;assert(f.query(),'Nested feed at its top can pull');f.w.close();
}
{
 const f=fixture('<input id="draft"><p id="hit">Other text</p>');f.doc.querySelector('#draft').focus();assert.equal(f.query(),false,'Focused draft remains protected even when touching outside');f.w.close();
}
console.log('Pull42 eligibility passed: viewport coordinate scale, semantic reading, native selection, nested feed boundaries, actions, media, editors and dialogs.');
