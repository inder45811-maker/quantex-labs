(()=>{'use strict';
const preference=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
const small=matchMedia('(max-width:700px)');
const active=new Set();
const ease='cubic-bezier(.16,1,.3,1)';
function run(element,frames,options={}){
 if(preference.matches||!element.animate)return null;
 const animation=element.animate(frames,{duration:750,easing:ease,fill:'backwards',...options});
 active.add(animation);animation.finished.then(()=>active.delete(animation),()=>active.delete(animation));return animation;
}
function settleAnimations(element){for(const animation of active)if(animation.effect?.target===element){animation.finish();}}

// Whitespace and the original emphasis are retained for selection and reading.
function revealWords(heading,delay=0){
 if(preference.matches||heading.dataset.wordReveal)return;
 heading.dataset.wordReveal='true';
 const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 let index=0;
 for(const node of nodes){const fragment=document.createDocumentFragment();for(const token of node.textContent.split(/(\s+)/)){if(!token)continue;if(/^\s+$/.test(token)){fragment.appendChild(document.createTextNode(token));continue;}const mask=document.createElement('span');mask.className='motion-word';const inner=document.createElement('span');inner.className='word-inner';inner.textContent=token;mask.appendChild(inner);fragment.appendChild(mask);run(inner,[{transform:'translateY(110%) rotateZ(2deg)'},{transform:'translateY(0) rotateZ(0)'}],{duration:small.matches?700:900,delay:delay+Math.min(index++,6)*45});}node.replaceWith(fragment);}
}
const hero=document.querySelector('.hero-copy,.page-hero .shell,.not-found');
if(hero){const heading=hero.querySelector('h1');if(heading)revealWords(heading,80);const eyebrow=hero.querySelector('.eyebrow');if(eyebrow)run(eyebrow,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:550,delay:50});hero.querySelectorAll('.hero-lead,.page-lead,.hero-actions,.research-notice').forEach((el,i)=>run(el,[{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'none'}],{duration:700,delay:250+i*85}));}

const targets=[...document.querySelectorAll('.section-heading,.catalog-notice,.product-card,.documentation-grid>div,.info-card,.split-section>div,.statement-panel,.channel-card,.ordering-steps li,.faq-item,.compound-panel,.detail-content,.detail-support>div,.related-section,.callout-inner,.footer-main>div,.discovery-grid>div')];
function reveal(element){
 const siblings=[...element.parentElement.children],index=Math.max(0,siblings.indexOf(element));
 const card=element.matches('.product-card,.info-card,.channel-card,.compound-panel,.statement-panel');
 const frames=card?[{opacity:0,transform:`perspective(1000px) translateY(${small.matches?32:60}px) rotateX(${small.matches?3:8}deg) scale(.96)`},{opacity:1,transform:'perspective(1000px) translateY(0) rotateX(0) scale(1)'}]:[{opacity:0,transform:`translateY(${small.matches?24:40}px)`},{opacity:1,transform:'translateY(0)'}];
 run(element,frames,{duration:small.matches?650:850,delay:Math.min(index,3)*65});
 if(element.matches('.section-heading,.callout-inner')){const heading=element.querySelector('h2');if(heading)revealWords(heading,60);}
}
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);reveal(entry.target);}},{threshold:.12,rootMargin:'0px 0px -12px 0px'});targets.forEach(el=>observer.observe(el));}

// Each specimen has its own transition identity across catalog and detail pages.
document.querySelectorAll('[data-product]').forEach(card=>{const face=card.querySelector('.compound-face');if(face)face.style.viewTransitionName='compound-'+card.dataset.product;});
const detail=document.querySelector('.compound-panel');if(detail){const slug=location.pathname.split('/').filter(Boolean).pop();if(/^[a-z0-9-]+$/.test(slug))detail.style.viewTransitionName='compound-'+slug;}

// Pointer-driven surfaces use event updates, with no persistent animation loop.
if(finePointer.matches){
 document.querySelectorAll('.product-card').forEach(card=>{card.addEventListener('pointermove',event=>{if(preference.matches)return;settleAnimations(card);const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;card.style.setProperty('--tilt-x',((.5-y)*12).toFixed(2)+'deg');card.style.setProperty('--tilt-y',((x-.5)*12).toFixed(2)+'deg');card.style.setProperty('--glow-x',(x*100).toFixed(1)+'%');card.style.setProperty('--glow-y',(y*100).toFixed(1)+'%');});card.addEventListener('pointerleave',()=>{for(const name of ['--tilt-x','--tilt-y','--glow-x','--glow-y'])card.style.removeProperty(name);});});
 document.querySelectorAll('a.button').forEach(button=>{button.addEventListener('pointermove',event=>{if(preference.matches)return;const r=button.getBoundingClientRect();button.style.setProperty('--mag-x',((event.clientX-r.left-r.width/2)*.06).toFixed(2)+'px');button.style.setProperty('--mag-y',((event.clientY-r.top-r.height/2)*.12).toFixed(2)+'px');});button.addEventListener('pointerleave',()=>{button.style.removeProperty('--mag-x');button.style.removeProperty('--mag-y');});});
}

// The existing native FAQ remains the fallback and keyboard interaction.
document.querySelectorAll('.faq-item').forEach(item=>{const summary=item.querySelector('summary');let animation=null,targetOpen=item.open,revision=0;summary.addEventListener('click',event=>{if(preference.matches||!item.animate){targetOpen=!item.open;return;}event.preventDefault();const start=item.offsetHeight,token=++revision;targetOpen=!targetOpen;animation?.cancel();item.style.height='';item.open=true;const end=targetOpen?item.offsetHeight:summary.offsetHeight;item.style.height=start+'px';animation=run(item,[{height:start+'px'},{height:end+'px'}],{duration:440});if(targetOpen)run(item.querySelector('p'),[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:450,delay:60});const finish=()=>{if(token!==revision)return;item.open=targetOpen;item.style.height='';animation=null;};if(animation){animation.onfinish=finish;animation.oncancel=finish;}else finish();});});

document.querySelectorAll('.filter-tabs').forEach(tabs=>{
 const indicator=document.createElement('span');indicator.className='filter-active-indicator';indicator.setAttribute('aria-hidden','true');tabs.appendChild(indicator);
 function position(){const selected=tabs.querySelector('[data-filter][aria-pressed=true]');if(!selected)return;indicator.style.width=selected.offsetWidth+'px';indicator.style.height=selected.offsetHeight+'px';indicator.style.transform=`translate(${selected.offsetLeft}px,${selected.offsetTop}px)`;}
 tabs.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{position();document.querySelectorAll('[data-product]:not([hidden])').forEach((card,i)=>{settleAnimations(card);run(card,[{opacity:.2,transform:'perspective(1000px) translateY(30px) rotateX(6deg) scale(.97)'},{opacity:1,transform:'perspective(1000px) translateY(0) rotateX(0) scale(1)'}],{duration:650,delay:Math.min(i,5)*55});});}));
 new ResizeObserver(position).observe(tabs);position();
});

const toggle=document.querySelector('#menu-toggle'),nav=document.querySelector('#nav');
toggle?.addEventListener('click',()=>{if(toggle.getAttribute('aria-expanded')==='true')nav.querySelectorAll('a').forEach((a,i)=>run(a,[{opacity:0,transform:'translateY(-14px)'},{opacity:1,transform:'none'}],{duration:450,delay:i*35}));});

const stage=document.querySelector('#helix-stage'),scene=document.querySelector('.hero'),pageHero=document.querySelector('.page-hero');
const progressBar=document.createElement('div');progressBar.className='reading-progress';progressBar.setAttribute('aria-hidden','true');document.body.appendChild(progressBar);
let pointerX=0,pointerY=0,scrollFrame=0;
function updateScene(){
 scrollFrame=0;if(preference.matches||document.hidden)return;
 const range=document.documentElement.scrollHeight-innerHeight,read=range>0?Math.max(0,Math.min(1,scrollY/range)):0;progressBar.style.transform=`scaleX(${read})`;
 if(pageHero){const r=pageHero.getBoundingClientRect(),p=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height)));pageHero.style.setProperty('--scene-progress',p.toFixed(4));}
 if(!stage||!scene)return;const r=scene.getBoundingClientRect(),progress=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height*.85)));
 scene.style.setProperty('--scene-progress',progress.toFixed(4));scene.style.setProperty('--scene-glow-x',(65+pointerX*10)+'%');scene.style.setProperty('--scene-glow-y',(35+pointerY*12)+'%');
 if(document.querySelector('#motion-toggle')?.getAttribute('aria-pressed')!=='true')stage.dispatchEvent(new CustomEvent('quantex:scene',{detail:{progress,pointerX,pointerY}}));
}
function requestScene(){if(!preference.matches&&!document.hidden&&!scrollFrame)scrollFrame=requestAnimationFrame(updateScene);}
addEventListener('scroll',requestScene,{passive:true});addEventListener('resize',requestScene,{passive:true});
if(scene&&finePointer.matches)scene.addEventListener('pointermove',event=>{if(preference.matches||event.buttons||event.target.closest('button,a'))return;const r=scene.getBoundingClientRect();pointerX=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));pointerY=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));requestScene();});
scene?.addEventListener('pointerleave',()=>{pointerX=pointerY=0;requestScene();});
stage?.addEventListener('quantex:ready',requestScene);
if(stage){const readyObserver=new MutationObserver(()=>{if(stage.classList.contains('is-ready')){readyObserver.disconnect();requestScene();}});readyObserver.observe(stage,{attributes:true,attributeFilter:['class']});}
document.querySelector('#motion-toggle')?.addEventListener('click',()=>{pointerX=pointerY=0;requestScene();});
document.querySelector('#helix-reset')?.addEventListener('click',()=>{pointerX=pointerY=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;}else requestScene();});
preference.addEventListener('change',event=>{if(event.matches){for(const animation of active)animation.cancel();active.clear();if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;pointerX=pointerY=0;progressBar.style.transform='scaleX(0)';scene?.style.setProperty('--scene-progress','0');pageHero?.style.setProperty('--scene-progress','0');}else requestScene();});
requestScene();
})();
