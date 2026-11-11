const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=process.env.FACEBOOST_SOURCE;
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
test('automatic comment sorting, persisted option and diagnostics are absent from the application',()=>{
 for(const p of files(path.join(root,'app/src/main'))){
  assert.doesNotMatch(p,/comment-sort|CommentSort|fpro_all_comments/);
  if(/\.(kt|js|xml)$/.test(p))assert.doesNotMatch(fs.readFileSync(p,'utf8'),/FproCommentSort|CommentSortPreference|CommentSortDiagnostic|fproAllComments|FPRO_ALL_COMMENTS|fpro_all_comments|fprocommentsort|fpro-comment-sort/i,p);
 }
});
test('all unrelated overlay production inputs are byte-identical to 2.18.44',()=>{
 const before=path.resolve(__dirname,'../faceboost-2.18.44');
 for(const name of fs.readdirSync(__dirname)){
  if(!/\.(kt|js|txt|py)$/.test(name)||name==='apply.py'||name==='MediaSurfaceRegressionTest.kt')continue;
  assert.deepEqual(fs.readFileSync(path.join(__dirname,name)),fs.readFileSync(path.join(before,name)),name);
 }
});
