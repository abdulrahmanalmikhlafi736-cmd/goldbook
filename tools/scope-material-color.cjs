// FPRO integration patch. Keep the pinned upstream source byte-identical.
const assert=require('node:assert/strict');
module.exports=function scopeMaterialColor(source){
 assert(source.includes('function processMaterialYouStyles() {'));
 source=source.replace('const processedStyles = new WeakSet();','const processedStyles = new WeakSet();\n  const processedStyleText = new WeakMap();');
 source=source.replace('function processMaterialYouStyles() {',`function processMaterialYouStyles(root = document, deep = true) {
    if(root.nodeType===1 && root.closest('.fpro-video-tools,[id^="fpro"]'))return;
    const query = selector => {
      const result=root.nodeType===1 && root.matches(selector)?[root]:[];
      if(deep)result.push(...root.querySelectorAll(selector));
      return result.filter(el=>!el.closest('.fpro-video-tools,[id^="fpro"]'));
    };`);
 const begin=source.indexOf("    document.querySelectorAll('style')"),end=source.indexOf("    document.querySelectorAll('[style*=\"color\"]')",begin);
 assert(begin>0&&end>begin);
 let css=source.slice(begin,end).replace('if (processedStyles.has(style)) return;\n      processedStyles.add(style);',"let css=style.innerHTML;\n      if(processedStyleText.get(style)===css)return;\n      const before=css;")
  .replaceAll('style.innerHTML = style.innerHTML?.replace','css = css.replace')
  .replace('      }\n    });','      }\n      if(css!==before)style.innerHTML=css;\n      processedStyleText.set(style,css);\n    });');
 source=source.slice(0,begin)+css+source.slice(end);
 const a=source.indexOf('function processMaterialYouStyles('),b=source.indexOf('\n  function materialYouCSS',a);
 assert(b>a,'Expected upstream materialYouCSS boundary');
 source=source.slice(0,a)+source.slice(a,b).replaceAll('document.querySelectorAll(', 'query(')+source.slice(b);
 const old=`new MutationObserver(() => {
    processMaterialYouStyles();
  }).observe(document.documentElement, {`;
 assert(source.includes(old));
 source=source.replace(old,`new MutationObserver(records => {
    const roots=new Map();
    const add=(el,deep)=>{
      if(!el || el.nodeType!==1 || !el.isConnected || el.closest('.fpro-video-tools,[id^="fpro"]'))return;
      roots.set(el,!!deep || roots.get(el)===true);
    };
    for(const r of records){
      const el=r.target.nodeType===1?r.target:r.target.parentElement;
      if(!el || el.closest('.fpro-video-tools,[id^="fpro"]'))continue;
      if(el.matches('style')){add(el,false);continue;}
      if(r.type==='attributes'){add(el,false);continue;}
      if(r.type==='childList')for(const node of r.addedNodes)add(node,true);
    }
    for(const [root,deep] of roots){
      let covered=false;
      for(const [other,subtree] of roots)if(other!==root && subtree && other.contains(root)){covered=true;break;}
      if(!covered)processMaterialYouStyles(root,deep);
    }
  }).observe(document.documentElement, {`)
 .replace("attributeFilter: ['style']", "characterData: true,\n    attributeFilter: ['style','src']");
 return source;
};
