// Dependency-free contract tests for the injected script.
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app/src/main/assets/facebook.js', 'utf8');
function harness(config, text) {
  const article = {style: {display: ''}, dataset: {}};
  const label = {childElementCount:0,textContent:text,getAttribute:()=>null,closest:s=>s==='[role="article"]'?article:null};
  let observers=0;
  const document = {
    head: {appendChild() {}}, body: {},
    createElement:()=>({textContent:''}),
    querySelectorAll(selector) {
      if(selector==='[data-fpro-hidden]')return article.dataset.fproHidden?[article]:[];
      if(selector.includes('[role="article"] a'))return [label];
      return [];
    }
  };
  const context = {document,window:{},MutationObserver:class{constructor(){observers++}observe(){}},setTimeout,clearTimeout};
  vm.createContext(context);
  const run=c=>vm.runInContext(source.replace('__CONFIG__',JSON.stringify(c)),context);
  run(config);return {article,run,observers:()=>observers};
}
const ads = harness({ads:true},'مُـمَوَّل');
assert.equal(ads.article.style.display,'none','Arabic diacritics and tatweel normalized');
ads.run({ads:false});
assert.equal(ads.article.style.display,'','disabling restores hidden posts');
assert.equal(ads.observers(),1,'reinjection must not duplicate observers');
assert.equal(harness({ads:true},'a normal post').article.style.display,'');
assert.equal(harness({ads:true},'Sponsored').article.style.display,'none');
assert.equal(harness({people:true},'أشخاص قد تعرفهم').article.style.display,'none');
console.log('Injection contract tests passed');
