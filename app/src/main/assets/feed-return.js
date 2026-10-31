/* GPL-3.0 — bounded, gesture-cancellable return to the opened feed post.
 * Stores post identifiers/geometry only, never post text, form values or cookies. */
(function () {
 'use strict';
 if (!window.FproFeedReturn) {
  var STORAGE='fpro.feed-return.v1', TTL=600000;
  var ROOTS={article:'article,[role="article"]',feedunit:'[data-pagelet^="FeedUnit"]',tracking:'[data-tracking-duration-id]',ft:'[data-ft]',bloks:'div[data-dcm-id="1"][data-mcomponent="MContainer"]'};
  var POSTS=Object.keys(ROOTS).map(function(k){return ROOTS[k];}).join(',');
  var enabled=false,pending=null,record=null,liveNode=null,job=null,press=null,serial=0;
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
  function aliases(el){
   var keys=[],ft;
   function add(kind,value){if(!value)return;var k={kind:kind,value:String(value)};if(k.value.length<512&&!keys.some(function(x){return same(x,k);}))keys.push(k);}
   try{ft=JSON.parse(el.getAttribute('data-ft')||'null');}catch(ignore){}
   if(ft)add('post',ft.top_level_post_id||ft.mf_story_key||ft.tl_objid);
   var links=el.querySelectorAll('a[href]');
   for(var i=0;i<links.length&&i<60;i++){
    var key=canonical(links[i].getAttribute('href'));if(!key)continue;
    add('url',key);
    var path=key.match(/\/(?:posts|permalink)\/([^/?#]+)/),id=key.match(/[?&]story_fbid=([^&]+)/);
    if(path)add('post',path[1]);else if(id)add('post',decodeURIComponent(id[1]));
    // The first permalink is the source post; do not collect quoted-post IDs.
    break;
   }
   // Do not weaken a stable post ID/URL with a possibly recycled tracking ID.
   if(!keys.length)add('tracking',el.getAttribute('data-tracking-duration-id'));
   return keys;
  }
  function matches(el,r){var keys=aliases(el),wanted=r.keys||[r.key];return keys.some(function(a){return wanted.some(function(b){return same(a,b);});});}
  function locate(node,r){
   // DOM proximity wins, not a fixed preference for article over Bloks/cards.
   for(var p=node;p&&p!==document.body;p=p.parentElement){
    if(!p.matches(POSTS)||!usable(p))continue;
    if(r){if(matches(p,r))return p;}
    else if(aliases(p).length)return p;
   }
   return null;
  }
  function same(a,b){return !!a&&!!b&&a.kind===b.kind&&a.value===b.value;}
  function usable(el){return el&&el.isConnected&&!el.closest('dialog,[role="dialog"],[aria-modal="true"],form,[id^="fpro"],.fpro-video-tools');}
  function valid(r){return r&&r.v===1&&typeof r.url==='string'&&r.url.length<8192&&r.key&&['post','url','tracking'].indexOf(r.key.kind)>=0&&typeof r.key.value==='string'&&r.key.value.length<512&&(!r.keys||(Array.isArray(r.keys)&&r.keys.length>0&&r.keys.length<=6&&r.keys.every(function(k){return k&&['post','url','tracking'].indexOf(k.kind)>=0&&typeof k.value==='string'&&k.value.length<512;})))&&(!r.root||Object.prototype.hasOwnProperty.call(ROOTS,r.root))&&Number.isFinite(r.top)&&Math.abs(r.top)<100000&&now()-r.at>=0&&now()-r.at<TTL;}
  function read(){try{var r=JSON.parse(sessionStorage.getItem(STORAGE));return valid(r)?r:null;}catch(ignore){return null;}}
  function persist(){try{if(record)sessionStorage.setItem(STORAGE,JSON.stringify(record));else sessionStorage.removeItem(STORAGE);}catch(ignore){}}
  function stop(clear){
   if(job){clearTimeout(job.timer);cancelAnimationFrame(job.frame);job=null;}
   if(clear){record=null;pending=null;liveNode=null;press=null;persist();}
  }
  function scroller(el){
   for(var p=el.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){
    if(p.scrollHeight>p.clientHeight+2&&/auto|scroll/.test(getComputedStyle(p).overflowY))return p;
   }
   return null;
  }
  function find(r){
   if(usable(liveNode)&&matches(liveNode,r))return liveNode;
   // Preserve all stable ID/URL aliases when Facebook rebuilds a card with a
   // different wrapper type. Search by identifier, never by saved pixel Y.
   var keys=r.keys||[r.key],nodes,i,root;
   for(var k=0;k<keys.length;k++){
    var key=keys[k],selector=key.kind==='url'?'a[href*='+JSON.stringify(key.value.split('?')[0])+']':key.kind==='tracking'?'[data-tracking-duration-id='+JSON.stringify(key.value)+']':'[data-ft*='+JSON.stringify(key.value)+']';
    nodes=document.querySelectorAll(selector);
    for(i=0;i<nodes.length;i++){
     if(key.kind==='url'&&canonical(nodes[i].getAttribute('href'))!==key.value)continue;
     root=locate(nodes[i],r);if(root){liveNode=root;return root;}
    }
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
  function sample(event){
   if(!enabled||!home()||event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return null;
   var target=event.target&&event.target.nodeType===1?event.target:event.target&&event.target.parentElement;
   if(!target||target.closest('dialog,[role="dialog"],[aria-modal="true"],form,input,textarea,select,[contenteditable="true"],[id^="fpro"],.fpro-video-tools'))return null;
   var link=target.closest('a[href]');if(link&&(link.target==='_blank'||link.hasAttribute('download')))return null;
   var post=locate(target);if(!post)return null;
   var keys=aliases(post),box=post.getBoundingClientRect(),rootKind=null;
   for(var kind in ROOTS)if(post.matches(ROOTS[kind])){rootKind=kind;break;}
   if(!keys.length||box.height<=0||box.width<=0||box.bottom<=0||box.top>=innerHeight)return null;
   return {node:post,snapshot:{v:1,url:location.href,key:keys[0],keys:keys,root:rootKind,top:box.top,at:now()}};
  }
  function remember(value){
   if(pending!==value.snapshot)stats.captures++;
   stop(false);liveNode=value.node;pending=value.snapshot;
  }
  function capturePress(event){
   press=null;var value=sample(event);if(!value)return;
   remember(value);press={node:value.node,snapshot:value.snapshot,x:event.clientX,y:event.clientY};
  }
  function discardPress(){
   if(press&&pending===press.snapshot&&record!==pending)pending=null;
   press=null;
  }
  function movePress(event){if(press&&(Math.abs(event.clientX-press.x)>12||Math.abs(event.clientY-press.y)>12))discardPress();}
  function capture(event){
   var value=sample(event);if(!value)return;
   // A pointer activation can reflow the page or navigate before click fires.
   // Reuse the early geometry only for the same post and a non-drag activation.
   if(press&&now()-press.snapshot.at<2000&&press.snapshot.url===location.href&&matches(value.node,press.snapshot))value={node:value.node,snapshot:press.snapshot};
   remember(value);press=null;
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
  // Registered after cancellation: a new press first stops old recovery, then
  // checkpoints this activation. No preventDefault/stopPropagation or replay.
  window.addEventListener('pointerdown',capturePress,{capture:true,passive:true});
  window.addEventListener('pointermove',movePress,{capture:true,passive:true});
  window.addEventListener('pointercancel',discardPress,{capture:true,passive:true});
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
