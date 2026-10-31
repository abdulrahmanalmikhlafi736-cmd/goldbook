/* GPL-3.0 — bounded, gesture-cancellable return to the opened feed post.
 * Stores post identifiers/geometry only, never post text, form values or cookies. */
(function () {
 'use strict';
 if (!window.FproFeedReturn) {
  var STORAGE='fpro.feed-return.v1', TTL=600000;
  var POSTS='article,[role="article"],[data-tracking-duration-id],[data-ft]';
  var enabled=false,pending=null,record=null,liveNode=null,job=null,serial=0;
  var stats={captures:0,returns:0,corrections:0,cancelled:0,attempts:0};
  function home(){return /(^|\.)facebook\.com$/.test(location.hostname)&&(/^\/$|^\/home\.php$/).test(location.pathname);}
  function now(){return Date.now();}
  function canonical(raw){
   try{
    var u=new URL(raw,location.href);
    if(!/(^|\.)facebook\.com$/.test(u.hostname))return null;
    if(/\/(?:posts|permalink)\/[^/]+/.test(u.pathname))return u.pathname.replace(/\/$/,'');
    if(/^\/(?:story|permalink)\.php$/.test(u.pathname)&&u.searchParams.has('story_fbid'))return '/story.php?story_fbid='+encodeURIComponent(u.searchParams.get('story_fbid'))+'&id='+encodeURIComponent(u.searchParams.get('id')||'');
   }catch(ignore){}
   return null;
  }
  function identity(el){
   var ft;try{ft=JSON.parse(el.getAttribute('data-ft')||'null');}catch(ignore){}
   if(ft){var id=ft.top_level_post_id||ft.mf_story_key||ft.tl_objid;if(id)return {kind:'post',value:String(id)};}
   var links=el.querySelectorAll('a[href]');
   for(var i=0;i<links.length&&i<60;i++){var key=canonical(links[i].getAttribute('href'));if(key)return {kind:'url',value:key};}
   var tracking=el.getAttribute('data-tracking-duration-id');
   return tracking?{kind:'tracking',value:tracking}:null;
  }
  function same(a,b){return !!a&&!!b&&a.kind===b.kind&&a.value===b.value;}
  function usable(el){return el&&el.isConnected&&!el.closest('dialog,[role="dialog"],[aria-modal="true"],form,[id^="fpro"],.fpro-video-tools');}
  function valid(r){return r&&r.v===1&&typeof r.url==='string'&&r.url.length<8192&&r.key&&['post','url','tracking'].indexOf(r.key.kind)>=0&&typeof r.key.value==='string'&&r.key.value.length<512&&Number.isFinite(r.top)&&Math.abs(r.top)<100000&&now()-r.at>=0&&now()-r.at<TTL;}
  function read(){try{var r=JSON.parse(sessionStorage.getItem(STORAGE));return valid(r)?r:null;}catch(ignore){return null;}}
  function persist(){try{if(record)sessionStorage.setItem(STORAGE,JSON.stringify(record));else sessionStorage.removeItem(STORAGE);}catch(ignore){}}
  function stop(clear){
   if(job){clearTimeout(job.timer);cancelAnimationFrame(job.frame);job=null;}
   if(clear){record=null;pending=null;liveNode=null;persist();}
  }
  function scroller(el){
   for(var p=el.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){
    if(p.scrollHeight>p.clientHeight+2&&/auto|scroll/.test(getComputedStyle(p).overflowY))return p;
   }
   return null;
  }
  function find(r){
   if(usable(liveNode)&&same(identity(liveNode),r.key))return liveNode;
   // Use the stored identifier to narrow discovery. No whole-feed loop on
   // each settling tick, and no observer while ordinary browsing is idle.
   var nodes,i,root;
   if(r.key.kind==='url'){
    nodes=document.querySelectorAll('a[href*='+JSON.stringify(r.key.value.split('?')[0])+']');
    for(i=0;i<nodes.length;i++)if(canonical(nodes[i].getAttribute('href'))===r.key.value){root=nodes[i].closest(POSTS);if(usable(root)){liveNode=root;return root;}}
   }else{
    var selector=r.key.kind==='tracking'?'[data-tracking-duration-id='+JSON.stringify(r.key.value)+']':'[data-ft*='+JSON.stringify(r.key.value)+']';
    nodes=document.querySelectorAll(selector);
    for(i=0;i<nodes.length;i++)if(usable(nodes[i])&&same(identity(nodes[i]),r.key)){liveNode=nodes[i];return nodes[i];}
   }
   return null;
  }
  function start(){
   if(!enabled)return;
   var r=record||read();if(!valid(r)||r.url!==location.href)return;
   stop(false);record=r;var id=++serial;
   job={id:id,timer:0,frame:0,count:0};stats.returns++;
   function tick(){
    if(!job||job.id!==id)return;
    if(!enabled||location.href!==r.url||!home()||!valid(r)){stop(true);return;}
    stats.attempts++;job.count++;
    var anchor=find(r);
    if(anchor){
     var box=anchor.getBoundingClientRect();
     if(box.height>0&&box.width>0){
      var delta=box.top-r.top;
      if(Math.abs(delta)>2){
       var container=scroller(anchor);
       // Explicitly disable smooth CSS scrolling for this single correction.
       var target=container||document.scrollingElement||document.documentElement;
       var old=target.style.getPropertyValue('scroll-behavior'),priority=target.style.getPropertyPriority('scroll-behavior');
       target.style.setProperty('scroll-behavior','auto','important');
       if(container)container.scrollTop+=delta;else window.scrollTo(window.scrollX,window.scrollY+delta);
       if(old)target.style.setProperty('scroll-behavior',old,priority);else target.style.removeProperty('scroll-behavior');
       stats.corrections++;
      }
     }
    }
    // A short bounded settling window covers late image/filter layout. Never
    // poll during ordinary browsing and never fall back to a guessed scrollY.
    if(job.count>=16){stop(true);return;}
    job.timer=setTimeout(tick,150);
   }
   job.frame=requestAnimationFrame(tick);
  }
  function capture(event){
   if(!enabled||!home()||event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   var target=event.target&&event.target.nodeType===1?event.target:event.target&&event.target.parentElement;
   if(!target||target.closest('dialog,[role="dialog"],[aria-modal="true"],form,input,textarea,select,[contenteditable="true"],[id^="fpro"],.fpro-video-tools'))return;
   var link=target.closest('a[href]');if(link&&(link.target==='_blank'||link.hasAttribute('download')))return;
   var post=target.closest(POSTS);if(!usable(post))return;
   var key=identity(post),box=post.getBoundingClientRect();
   if(!key||key.value.length>=512||box.height<=0||box.width<=0||box.bottom<=0||box.top>=innerHeight)return;
   stop(false);liveNode=post;pending={v:1,url:location.href,key:key,top:box.top,at:now()};stats.captures++;
  }
  function commit(fresh){
   if(enabled&&valid(pending)&&pending.url===location.href&&(!fresh||now()-pending.at<2000)){record=pending;persist();return true;}return false;
  }
  function route(method,original){return function(){
   var before=location.href,departure=enabled&&valid(pending)&&pending.url===before&&now()-pending.at<2000;
   var result=original.apply(this,arguments);
   if(departure){record=pending;persist();}
   // A deliberate new visit to Home is NOT history-back restoration.
   else if(record&&location.href===record.url&&before!==location.href){stop(true);}
   if(job&&location.href!==before)stop(false);
   return result;
  };}
  ['pushState','replaceState'].forEach(function(name){try{history[name]=route(name,history[name]);}catch(ignore){}});
  document.addEventListener('click',capture,true);
  window.addEventListener('popstate',function(){if(enabled){stop(false);record=record||read();start();}});
  window.addEventListener('pagehide',function(){commit(true);stop(false);});
  window.addEventListener('pageshow',function(e){if(e.persisted&&enabled){record=record||read();start();}});
  function gesture(){if(job){stats.cancelled++;stop(true);}}
  ['touchstart','pointerdown','wheel','keydown'].forEach(function(name){window.addEventListener(name,gesture,{capture:true,passive:true});});
  window.FproFeedReturn={
   setEnabled:function(value){var next=!!value;if(next===enabled)return;enabled=next;if(!next)stop(true);else{
    record=read();var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
    if((nav&&nav.type==='back_forward')||(!nav&&performance.navigation&&performance.navigation.type===2))start();
   }},
   canReturn:function(){return enabled&&valid(record)&&record.url!==location.href;},
   afterDialogBack:function(){if(enabled&&home()&&(record||commit(false)))start();},
   report:function(){return {enabled:enabled,active:!!job,pending:!!pending,retained:record?1:0,captures:stats.captures,returns:stats.returns,corrections:stats.corrections,cancelled:stats.cancelled,attempts:stats.attempts};}
  };
 }
 window.FproFeedReturn.setEnabled((__CONFIG__).rememberPosition!==false);
})();
