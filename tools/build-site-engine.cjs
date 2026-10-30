const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'app/src/main/assets/upstream');
const factories=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort().map(file=>{
 let text=fs.readFileSync(path.join(dir,file),'utf8');
 // Lifecycle-only patches: journal CSSOM writes, scope the asynchronous banner callback.
 if(file==='amoled_black.js')text=text.replace(/rule\.style\.backgroundColor = ([^;]+);/g,'scope.cssRule(rule.style,"background-color", $1);');
 if(file==='sticky_navbar.js')text=text.replace('waitForBanner().then(banner => {','waitForBanner().then(scope.wrap(banner => {').replace('          });\n        })();\n        return;', '          }));\n        })();\n        return;');
 if(file==='bottom_banner.js')text=text.replace('const observer = new MutationObserver(() => {','const hideBottomBanner = () => {').replace('});\n\nobserver.observe','};\nhideBottomBanner();\nconst observer = new MutationObserver(hideBottomBanner);\n\nobserver.observe');
 // Upstream typo: a gray span outside its expected card must not abort the feature.
 if(file==='adblock.js')text=text.replace("            container.style.display = 'none'","            if (!container) continue;\n            container.style.display = 'none'").replace("'Ad Blocked'","'إعلان محجوب'").replace("'Sponsored content was removed'","'أُزيل المحتوى المموّل'");
 // Keep the imported classifiers, but preserve FPRO/account/search/form hosts.
 text=text.replace(/(\b[a-zA-Z]\w*)\.style\.display = 'none';?/g,'scope.hide($1);').replace(/(\b(?:el|node))\.remove\(\)/g,'scope.remove($1)');
 text=text.replace("el.closest('[data-tracking-duration-id]')?.style.setProperty('display', 'none')", "scope.hide(el.closest('[data-tracking-duration-id]'))");
 text=text.replace("                    container.innerHTML = '';", "                    if(scope.protectedUI(container)) return;\n                    container.innerHTML = '';");
 return JSON.stringify(file.slice(0,-3))+':function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;\n'+text+'\n}';
}).join(',\n');
const output=fs.readFileSync(path.join(__dirname,'site-engine-runtime.js.txt'),'utf8').replace('/*__FACTORIES__*/',factories);
const target=path.join(root,'app/src/main/assets/site-engine.js');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('Regenerate site-engine.js');}else fs.writeFileSync(target,output);
