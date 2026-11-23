'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const tasks=window.AOP_DATA.tasks, modes=['direct','fixed','aop'];
const labels={direct:'Direct Policy',fixed:'Fixed Delegation',aop:'ACAP'};
const insights={wipe:'',sort:'',flowers:'Prepare independently. Insert after the other arm clears the vase.',sandwich:'Parallel preparation feeds an ordered assembly.',towel:'Members establish their grasps. The lead coordinates the shared fold.',carton:'The lead can control both arms while members continue their analysis.'};
function setTabs(buttons,active){buttons.forEach(b=>{const on=b===active;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});}
function setupTabKeys(selector){const list=$$(selector);list.forEach(b=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=list.indexOf(b);i=e.key==='Home'?0:e.key==='End'?list.length-1:(i+(e.key==='ArrowRight'?1:-1)+list.length)%list.length;list[i].click();list[i].focus();}));setTabs(list,list.find(b=>b.getAttribute('aria-selected')==='true'));}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause();}),{threshold:.05});
function mediaCard(task,key,group){const m=task.modes[key],state=m.completed?`${m.elapsed.toFixed(2)} min · completed`:m.recorded_outcome==='completed'?'Completed after the 30-minute budget':'Not completed within 30 minutes';return `<article class="video-cell ${key}"><p class="policy-label">${labels[key]}<small>${key==='aop'?'Our method':key==='fixed'?'Permanent member control':'One agent'}</small></p><video id="${group}-${key}" src="${m.video}" poster="${m.poster}" controls muted playsinline preload="metadata" aria-label="${task.title}, ${labels[key]}, synchronized rollout"></video><div class="video-tools"><span>Shown run: ${state}</span><button class="text-button" data-expand="${group}-${key}">Expand ↗</button></div><div class="video-stats"><span><strong>${m.mean.toFixed(2)}</strong> min mean cost <small>± ${m.sd.toFixed(2)} SD</small></span><span><strong>${m.success}/5</strong> by 30 min</span></div></article>`;}
function flowerStory(show){
 const root=$('#flower-coordination');root.hidden=!show;
 if(!show){root.innerHTML='';return;}
 root.dataset.phase='';root.className='flower-story';root.innerHTML='<div class="flower-story-heading"><h4></h4><span>ACAP assignments · <time class="flower-clock">0:00</time></span></div><div class="flower-plan"><div class="flower-member flower-left"><span>Left member</span><strong></strong></div><div class="flower-vase"><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M10 4h12M11 5c1 8-5 16-5 25 0 5 3 7 10 7s10-2 10-7c0-9-6-17-5-25M10 9h12"/></svg><span></span></div><div class="flower-member flower-right"><span>Right member</span><strong></strong></div></div><p></p>';
 updateFlowerStory(-1);
}
function updateFlowerStory(elapsed){
 const root=$('#flower-coordination');if(root.hidden)return;
 const phase=window.AOP_FLOWER_STORY.filter(p=>p.time<=elapsed).at(-1)||window.AOP_FLOWER_STORY[0];
 root.querySelector('.flower-clock').textContent=elapsed<0?'Initializing':`${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;
 if(root.dataset.phase===phase.key)return;root.dataset.phase=phase.key;root.dataset.owner=phase.owner;
 root.querySelector('h4').textContent=phase.title;root.querySelector('.flower-left strong').textContent=phase.left;root.querySelector('.flower-right strong').textContent=phase.right;root.querySelector('.flower-vase>span').textContent=phase.vase;root.querySelector(':scope>p').textContent=phase.caption;
}
document.addEventListener('aop:replayframe',e=>{if(e.target.closest('#efficiency-grid')&&e.detail.slug==='flowers-aop')updateFlowerStory(e.detail.elapsed);});
const sharedComparisons={};
function selectComparison(group,id){
 sharedComparisons[group]?.destroy();if(group==='efficiency')flowerStory(id==='flowers');
 const task=tasks.find(t=>t.id===id);$(`#${group}-title`).textContent=task.title;$(`#${group}-meta`).textContent=`${task.category} · ${task.platform}`;$(`#${group}-insight`).textContent=insights[id];setTabs($$(`[data-${group}]`),$(`[data-${group}="${id}"]`));
 sharedComparisons[group]=AOPShared.mount(task,group,(src,poster,title,time)=>openVideo(src,poster,title,time),updateFlowerStory);
}
for(const group of ['efficiency','coordination'])$$(`[data-${group}]`).forEach(b=>b.addEventListener('click',()=>selectComparison(group,b.dataset[group])));
$$('[data-play]').forEach(b=>b.addEventListener('click',()=>sharedComparisons[b.dataset.play]?.toggle()));
const methodCopy={
 aop:{title:'Let the agent choose how to coordinate.',description:'ACAP’s hyper-agent chooses what to delegate and when to synchronize. It can also take direct control of coupled groups (dashed path), while members retain their context and can continue analysis.',points:['Independent reasoning and execution','Synchronization where the task needs it','Control can return to the lead']},
 fixed:{title:'Separate reasoning. Fixed control allocation.',description:'Persistent members can plan and recover while other groups act. With Fixed Delegation, only members command their groups. Coupled actions must be coordinated across separate agent contexts.',points:['Independent reasoning and execution','Assignments and timing can change','Only members command their groups']},
 direct:{title:'One agent plans for every group.',description:'A single coding agent observes, plans and commands all control groups. Robot motions can overlap, but local planning and recovery share one reasoning process.',points:['One context for all decisions','Concurrent robot commands are possible','Direct control of every group']}
};
function architecture(mode){
 const mobile=innerWidth<700,W=mobile?600:900,center=W/2,xs=mobile?[100,300,500]:[150,450,750],bw=mobile?172:225;
 let s='';
 const rect=(x,y,w,h,fill,stroke,cls='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" fill="${fill}" stroke="${stroke}" class="${cls}"/>`;
 const text=(x,y,t,size=20,c='#172a2d',weight=400,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}" style="fill:${c};font-size:${size}px;font-weight:${weight}">${t}</text>`;
 const wire=(d,cls='')=>`<path d="${d}" class="method-wire ${cls}" marker-end="url(#arrow)"/>`;
 const flow=(d,cls='',delay=0)=>`<path d="${d}" pathLength="100" class="method-flow ${cls}" style="--flow-delay:${delay}s"/>`;
 const thinking=(x,y,i=0)=>`<g class="thinking" style="--thinking-delay:${i*.4}s">${text(x-13,y,'Reasoning',17,'#62796c')}<circle cx="${x+43}" cy="${y-5}" r="3" class="thinking-pip pip-one"/><circle cx="${x+53}" cy="${y-5}" r="3" class="thinking-pip pip-two"/><circle cx="${x+63}" cy="${y-5}" r="3" class="thinking-pip pip-three"/></g>`;
 const group=(x,i)=>`<g class="control-group ${i<2?'paired-group':''}">${rect(x-bw/2,288,bw,57,'#f6f5f1','#bccbbf')}${text(x,323,'Group '+(i+1),23,'#435d52',500)}</g>`;
 if(mode==='direct'){
  s+=rect(center-160,47,320,107,'#edf3ee','#a8c5b7');s+=text(center,88,'One coding agent',27,'#176d66',600);s+=thinking(center-10,126);
  xs.forEach((x,i)=>{const d=`M${center} 154L${x} 284`;s+=wire(d)+flow(d,'direct-command',0)+group(x,i);});
  s+=text(center,385,'Robot commands can overlap',21,'#65716f');
 }else{
  s+=rect(center-150,12,300,80,mode==='aop'?'#176d66':'#e7ede5',mode==='aop'?'#176d66':'#b8c9bc');
  s+=text(center,47,mode==='aop'?'Lead & hyper-agent':'Lead agent',27,mode==='aop'?'#fff':'#425d4b',600);s+=text(center,76,mode==='aop'?'Assign · synchronize · reallocate':'Assign and coordinate',18,mode==='aop'?'#d9e9df':'#65716f');
  xs.forEach((x,i)=>{
   const d=`M${center+(i-1)*75} 92L${x} 166`;
   s+=wire(d,'coordination-wire')+flow(d,'assignment-flow',-i*.8);
   if(i<2)s+=flow(d,'report-flow',-i*.8-.8);
   s+=rect(x-bw/2,170,bw,90,'#f2f6ef','#a8c4b0','member-box');s+=text(x,206,'Member '+(i+1),24,'#176d66',600);s+=thinking(x-9,240,i);
   const command=`M${x} 260V284`;s+=`<g class="${i<2?'member-pair-command':'member-independent-command'}">${wire(command)+flow(command,'command-flow',-i*.65)}</g>`;s+=group(x,i);
  });
  const pairMid=(xs[0]+xs[1])/2;
  s+=`<g class="coupled-work">${wire(`M${xs[0]} 348V365H${xs[1]}V348`,'coupling-bracket')}${text(pairMid,394,mode==='aop'?'One coordinated action':'Action needs both groups',20,'#8a6b46',500)}</g>`;
  if(mode==='aop'){
   const edge=mobile?7:13,d=`M${center-150} 52H${edge}V274H${pairMid}V359`;
   s+=`<g class="lead-coupled-control">${wire(d,'lead-command')+flow(d,'lead-command-flow')}`;
   s+=`<path d="M${pairMid} 365H${xs[0]}V348M${pairMid} 365H${xs[1]}V348" class="lead-command" fill="none" marker-end="url(#arrow)"/>`;
   s+='</g>';
  }
 }
 $('#architecture').setAttribute('viewBox',`0 0 ${W} 400`);$('#arch-content').innerHTML=s;$('#arch-desc').textContent=methodCopy[mode].description;$('#arch-title').textContent=labels[mode]+': '+methodCopy[mode].title;
}
function setMethodBeat(coupled){
 const section=$('#method'),beat=coupled?'coupled':'independent';section.dataset.beat=beat;
 const caption=activeMethod==='direct'?'One shared reasoning process.':activeMethod==='fixed'?(coupled?'Coupled actions still pass through separate members.':'Local planning and recovery can run concurrently.'):(coupled?'The lead can control coupled groups while other members continue.':'Keep independent work with the members.');
 if($('#method-description').textContent!==caption)$('#method-description').textContent=caption;
 $('#arch-desc').textContent=activeMethod==='direct'?'One shared reasoning process commands all robot groups. Motions can overlap.':activeMethod==='fixed'?'Three members reason concurrently and control separate groups. Shared actions require coordination through those members.':'Members reason concurrently. The hyper-agent can directly command coupled groups 1 and 2 while member 3 continues independent work.';
}
let activeMethod='direct',methodStory=null;
function selectMethod(mode,animate=true){
 const changed=mode!==activeMethod;activeMethod=mode;setTabs($$('[data-method]'),$(`[data-method="${mode}"]`));
 $('#method-title').textContent=methodCopy[mode].title.replace('<br>',' ');$('#method-description').textContent=methodCopy[mode].description;architecture(mode);$('#method').dataset.mode=mode;setMethodBeat(mode!=='direct');
 if(changed&&animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  $('#arch-content').animate([{opacity:.12,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'cubic-bezier(.28,.11,.32,1)'});
  $('.method-caption').animate([{opacity:.2},{opacity:1}],{duration:350,easing:'ease-out'});
 }
}
$$('[data-method]').forEach(b=>b.addEventListener('click',()=>{if(methodStory?.enabled)methodStory.seek(b.dataset.method);else selectMethod(b.dataset.method);}));
function initMethodStory(){
 const section=$('#method'),shell=$('.method-scroll'),stage=$('.method-stage'),buttons=$$('[data-method]'),order=['direct','fixed','aop'],motion=matchMedia('(prefers-reduced-motion: reduce)');
 let enabled=false,travel=0,pinTop=16,pending=0,layoutWidth=0;
 const sequenceMs=18000,idleMs=1200;
 let visible=false,autoFrame=0,autoTimer=0,autoLast=0,autoExpectedY=0,autoStarted=false,autoBlocked=false,autoComplete=false,lastInputAt=performance.now();
 function autoState(state){section.dataset.autoState=state;}
 function stopAuto(){cancelAnimationFrame(autoFrame);clearTimeout(autoTimer);autoFrame=autoTimer=0;autoLast=0;}
 function takeControl(force=false){
  lastInputAt=performance.now();
  if(force||autoStarted)autoBlocked=true;
  stopAuto();autoState(autoBlocked?'manual':'waiting');
 }
 function advance(now){
  autoFrame=0;
  if(!enabled||!visible||document.hidden||autoBlocked||motion.matches){stopAuto();return;}
  const dt=autoLast?Math.min(64,now-autoLast):0;autoLast=now;
  const end=scrollY+shell.getBoundingClientRect().top-pinTop+travel;
  const target=Math.min(end,autoExpectedY+travel*dt/sequenceMs);
  // Drive the existing scroll position, so a reverse swipe starts from the
  // diagram actually on screen. Never scroll past this pinned chapter.
  autoExpectedY=target;scrollTo({top:target,behavior:'instant'});queue();
  if(end-scrollY<=1){autoComplete=true;stopAuto();autoState('complete');return;}
  autoFrame=requestAnimationFrame(advance);
 }
 function maybeAuto(){
  clearTimeout(autoTimer);autoTimer=0;
  if(autoFrame||autoBlocked||autoComplete||!enabled||!visible||document.hidden||motion.matches)return;
  const rect=stage.getBoundingClientRect();
  if(rect.top<0||rect.bottom>innerHeight+1)return;
  const delay=idleMs-(performance.now()-lastInputAt);
  if(delay>0){autoTimer=setTimeout(maybeAuto,delay);return;}
  const p=(pinTop-shell.getBoundingClientRect().top)/travel;
  if(p>=.999){autoComplete=true;autoState('complete');return;}
  autoStarted=true;autoExpectedY=scrollY;autoState('playing');autoFrame=requestAnimationFrame(advance);
 }
 function scrolled(){
  if(autoFrame){if(Math.abs(scrollY-autoExpectedY)>3)takeControl(true);}
  else{lastInputAt=performance.now();maybeAuto();}
  queue();
 }

 function update(){
  pending=0;if(!enabled)return;
  const p=Math.max(0,Math.min(1,(pinTop-shell.getBoundingClientRect().top)/travel)),i=Math.min(2,Math.floor(p*3));
  section.dataset.progress=p.toFixed(4);
  buttons.forEach((b,j)=>b.style.setProperty('--step-progress',Math.max(0,Math.min(1,p*3-j))));
  if(order[i]!==activeMethod)selectMethod(order[i]);
  setMethodBeat(p*3-i>=.42);
 }
 function queue(){if(!pending)pending=requestAnimationFrame(update);}
 function configure(force=false){
  const width=document.documentElement.clientWidth,mobile=width<760,widthChanged=width!==layoutWidth;
  // Mobile browser chrome changes height during a scroll. Keep this chapter's
  // geometry until the width changes, so reversing a swipe cannot collapse it.
  if(mobile&&!widthChanged&&!force){queue();return;}
  stopAuto();layoutWidth=width;
  if(widthChanged)selectMethod(activeMethod,false);
  const height=stage.getBoundingClientRect().height;enabled=width>=320&&!motion.matches&&height<=innerHeight-24;
  if(enabled){pinTop=mobile?12:Math.max(12,(innerHeight-height)/2);travel=innerHeight*1.7;section.style.setProperty('--pin-top',pinTop+'px');shell.style.height=(height+travel)+'px';}
  else{shell.style.height='';buttons.forEach((b,j)=>b.style.setProperty('--step-progress',j===order.indexOf(activeMethod)?1:0));}
  // Measure the stage without temporarily removing the scroll space. A forced
  // layout at that intermediate size can clamp the reader's scroll position.
  section.classList.toggle('is-pinned',enabled);
  if(!enabled)autoState('off');queue();maybeAuto();
 }
 const visibility=new IntersectionObserver(entries=>entries.forEach(e=>{
  visible=e.isIntersecting;section.classList.toggle('method-visible',visible);
  if(!visible){stopAuto();autoStarted=autoBlocked=autoComplete=false;autoState('waiting');}
  else maybeAuto();
 }),{threshold:0});visibility.observe(stage);
 addEventListener('scroll',scrolled,{passive:true});addEventListener('resize',()=>configure());motion.addEventListener('change',()=>configure(true));
 for(const event of ['wheel','touchstart','touchmove','pointerdown'])addEventListener(event,()=>takeControl(),{passive:true});
 addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Tab'].includes(e.key))takeControl();});
 document.addEventListener('visibilitychange',()=>{stopAuto();if(!document.hidden){lastInputAt=performance.now();maybeAuto();}});
 methodStory={get enabled(){return enabled;},seek(mode){takeControl(true);const i=order.indexOf(mode),target=scrollY+shell.getBoundingClientRect().top-pinTop+travel*(i+.5)/3;scrollTo({top:target,behavior:'smooth'});}};
 configure();
}
let expandedSource=null;
function openVideo(src,poster,title,time=0,source=null){Object.values(sharedComparisons).forEach(p=>p.pause());expandedSource=source;$$('main video').forEach(v=>v.pause());const v=$('#expanded-video');v.controls=true;v.muted=true;v.src=src;v.poster=poster;$('#dialog-title').textContent=title;$('#inspect-traces').textContent='Pause & read activity';v.onloadedmetadata=()=>{v.currentTime=Math.min(time,Number.isFinite(v.duration)?v.duration:time);};v.load();AOPReplay.mount(v,true);$('#video-dialog').showModal();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-expand],[data-rollout]');if(!b)return;if(b.dataset.expand){const v=$('#'+b.dataset.expand);openVideo(AOPPlayback.fullSource(v),v.poster,v.getAttribute('aria-label'),v.ended?0:AOPPlayback.sourceTime(v,v.currentTime),v);}else{const [id,k]=b.dataset.rollout.split(':'),t=tasks.find(t=>t.id===id),m=t.modes[k];openVideo(m.video,m.poster,`${t.title} · ${labels[k]}`);}});
$('#inspect-traces').addEventListener('click',()=>{const v=$('#expanded-video');v.pause();const activity=v.closest('.rollout-player')?.querySelector('.agent-activity');if(activity)activity.open=true;});
$('#close-dialog').addEventListener('click',()=>$('#video-dialog').close());$('#video-dialog').addEventListener('close',()=>{const v=$('#expanded-video');v.pause();if(expandedSource)AOPPlayback.seekFull(expandedSource,v.currentTime);v.onloadedmetadata=null;AOPReplay.unmount(v);v.removeAttribute('src');v.load();expandedSource=null;});$('#video-dialog').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();});
$('#copy-citation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#bibtex').textContent);$('#copy-status').textContent='Copied.';}catch{const r=document.createRange();r.selectNodeContents($('#bibtex'));getSelection().removeAllRanges();getSelection().addRange(r);$('#copy-status').textContent='Citation selected. Copy with your browser.';}});
selectComparison('efficiency','flowers');selectComparison('coordination','towel');selectMethod('direct',false);initMethodStory();
for(const sel of ['[data-method]','[data-efficiency]','[data-coordination]'])setupTabKeys(sel);
AOPReplay.mount($('#body-video'),false);
observer.observe($('#body-video'));
// Subtle entrances reveal each new part of the story without taking over scrolling.
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');reveal.unobserve(e.target);}}),{threshold:0,rootMargin:'0px 0px -35px 0px'});
 $$('.section>.prose,.study,.comparison,.collaboration-intro,.body-film').forEach(el=>{el.classList.add('story-reveal');reveal.observe(el);});
}

// Native anchors work without JavaScript; scrollspy only marks the current section.
const contents=$('.contents'),contentsToggle=$('.contents-toggle'),contentsLinks=$$('.contents-panel a');
const readingSections=contentsLinks.map(link=>({link,section:document.getElementById(link.hash.slice(1))}));
function closeContents(){contents.classList.remove('open');contentsToggle.setAttribute('aria-expanded','false');}
contentsToggle.addEventListener('click',()=>{const open=contents.classList.toggle('open');contentsToggle.setAttribute('aria-expanded',String(open));});
contentsLinks.forEach(link=>link.addEventListener('click',closeContents));
document.addEventListener('click',e=>{if(!contents.contains(e.target))closeContents();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&contents.classList.contains('open')){closeContents();contentsToggle.focus();}});
let readingFrame=0;
function updateReadingSection(){readingFrame=0;const marker=Math.min(180,innerHeight*.25);let current=readingSections[0];for(const item of readingSections){if(item.section.getBoundingClientRect().top<=marker)current=item;}if(scrollY>0&&Math.ceil(scrollY+innerHeight)>=document.documentElement.scrollHeight-3)current=readingSections[readingSections.length-1];for(const item of readingSections){if(item===current)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');}$('#current-section').textContent=current.link.textContent;contentsToggle.setAttribute('aria-label',`On this page: ${current.link.textContent}`);}
function queueReadingUpdate(){if(!readingFrame)readingFrame=requestAnimationFrame(updateReadingSection);}
addEventListener('scroll',queueReadingUpdate,{passive:true});addEventListener('resize',()=>{closeContents();queueReadingUpdate();});addEventListener('hashchange',queueReadingUpdate);new ResizeObserver(queueReadingUpdate).observe($('#main'));updateReadingSection();
