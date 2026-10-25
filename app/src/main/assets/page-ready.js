(function(){
 'use strict';
 if(!document.body||!document.documentElement)return false;
 const body=getComputedStyle(document.body);if(body.display==='none'||body.visibility==='hidden'||body.opacity==='0')return false;
 const nodes=Array.from(document.querySelectorAll('h1,h2,p,a,button,input,textarea,img,video,[role="article"],[role="textbox"]')).slice(0,200);
 return nodes.some(el=>{const r=el.getBoundingClientRect();if(r.width<4||r.height<4||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)return false;for(let p=el;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||c.opacity==='0')return false;}if(el.tagName==='IMG')return el.complete&&el.naturalWidth>0;if(el.tagName==='VIDEO')return el.readyState>=2;return el.matches('input,textarea,[role="textbox"]')||el.textContent.trim().length>1;});
})()
