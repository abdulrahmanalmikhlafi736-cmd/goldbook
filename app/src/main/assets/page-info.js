(() => {
 function info() {
  const path=location.pathname.replace(/\/+$/,'') || '/';
  const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
  const player=Array.from(document.querySelectorAll('[role="dialog"],[aria-modal="true"]')).some(el=>visible(el)&&!!el.querySelector('video'));
  const facebook=location.hostname==='facebook.com'||location.hostname.endsWith('.facebook.com');
  const entry=/^\/(?:login(?:\.php)?|login\/.*)$/.test(path)&&!!document.querySelector('input[type="password"]');
  const home=facebook&&(path==='/'||path==='/home.php'||path==='/index.php'||entry)&&!player&&!document.fullscreenElement&&!document.webkitFullscreenElement;
  let x=innerWidth*.71,y=28,anchored=false;
  if(home) {
   const logos=document.querySelectorAll('svg[aria-label="Facebook"],img[alt="Facebook"],a[aria-label="Facebook"],[role="banner"] svg title,header svg title');
   for(const item of logos) {
    if(item.tagName.toLowerCase()==='title'&&!/facebook/i.test(item.textContent))continue;
    const el=item.tagName.toLowerCase()==='title'?item.closest('svg'):item;
    if(!el||!visible(el))continue;const r=el.getBoundingClientRect();
    if(r.top<0||r.top>120||r.left<innerWidth*.4)continue;
    // On the RTL home header the circled F is at the left edge of the wordmark.
    x=r.left+Math.min(r.height/2,r.width/2);y=r.top+r.height/2;anchored=true;break;
   }
  }
  return {home,x,y,width:innerWidth,anchored};
 }
 window.__fproPageInfo=info;
 return JSON.stringify(info());
})();
