/* Two camera views, annotations and curves are rendered from one presented video frame. */
(function(root){
 'use strict';
 const frameAt=(data,time)=>Math.max(0,Math.min(data.frames-1,Math.floor(time*data.fps+1e-3)));
 const countAt=(points,elapsed)=>points.filter(p=>p.time<=elapsed).length;
 const stateAt=(data,time)=>{const frame=frameAt(data,time),elapsed=data.elapsed[frame];return {frame,elapsed,direct:countAt(data.milestones.direct,elapsed),aop:countAt(data.milestones.aop,elapsed),doneDirect:elapsed>=data.completion.direct,doneAop:elapsed>=data.completion.aop};};
 const x=t=>24+t/5,y=count=>164-count*18;
 function curve(points,elapsed){let path='M24 164',n=0;for(const p of points){if(p.time>elapsed)break;path+=`H${x(p.time)}V${y(++n)}`;}return path+`H${x(elapsed)}`;}
 root.AOPHero={frameAt,countAt,stateAt,curve};
 if(typeof document==='undefined')return;
 const $=s=>document.querySelector(s),data=root.AOP_HERO,v=$('#hero-video'),player=$('#hero-player'),seek=$('#hero-seek'),play=$('#hero-play'),status=$('#hero-status');
 const cameras=['direct','aop'].map(mode=>{const canvas=$('#hero-'+mode+'-camera');return {mode,canvas,ctx:canvas?.getContext('2d')};});
 const clock=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
 const events=[...document.querySelectorAll('[data-hero-time]')].map(button=>{
  const time=Math.min(Number(button.dataset.heroTime),data.end),index=data.elapsed.findIndex(n=>n>=time),frame=index<0?data.frames-1:index;
  button.style.left=`${time/data.end*100}%`;button.setAttribute('aria-label',`${button.textContent.trim()}, ${clock(time)} elapsed. Seek to this event.`);
  button.title=`${button.textContent.trim()} · ${clock(time)}`;
  return {button,time,frame};
 });
 let lastFrame=-1,hasStarted=false,userPaused=false,excerpt=null;
 excerpt=root.AOPPlayback.create(v,{},{onChange:controls});
 for(const mode of ['direct','aop']){
  $('#hero-'+mode+'-full').setAttribute('d',curve(data.milestones[mode],data.completion[mode]));
 }
 const jarGroups=Object.fromEntries(cameras.map(({mode})=>[mode,
  [...document.querySelectorAll(`#hero-${mode}-jars [data-jar]`)].map(group=>({
   group,side:group.dataset.jar,slots:[...group.querySelectorAll('i')]
  }))
 ]));
 function updateJars(mode,elapsed){
  for(const {group,side,slots} of jarGroups[mode]){
   const count=data.milestones[mode].filter(p=>p.side===side&&p.time<=elapsed).length;
   if(group.dataset.count===String(count))continue;
   group.dataset.count=count;
   group.setAttribute('role','img');
   group.setAttribute('aria-label',`${side} jar, ${count} of 4 batteries`);
   slots.forEach((slot,i)=>slot.classList.toggle('filled',i<count));
  }
 }
 function draw(time){
  if(v.readyState<2)return;
  const s=stateAt(data,root.AOPPlayback.sourceTime(v,time));if(s.frame===lastFrame)return;lastFrame=s.frame;
  cameras.forEach(({mode,canvas,ctx},i)=>{if(ctx){ctx.drawImage(v,i*data.panelWidth,0,data.mainWidth,data.mainHeight,0,0,canvas.width,canvas.height);canvas.classList.add('has-frame');}else v.classList.add('has-frame');$('#hero-'+mode+'-count').textContent=`${s[mode]} / 8 placed`;updateJars(mode,s.elapsed);$('#hero-'+mode+'-finished').hidden=!(mode==='direct'?s.doneDirect:s.doneAop);$('#hero-'+mode+'-path').setAttribute('d',curve(data.milestones[mode],Math.min(s.elapsed,data.completion[mode])));const dot=$('#hero-'+mode+'-dot');dot.setAttribute('cx',x(Math.min(s.elapsed,data.completion[mode])));dot.setAttribute('cy',y(s[mode]));});
  $('#hero-cursor').setAttribute('d',`M${x(s.elapsed)} 20V164`);$('#hero-time').textContent=clock(s.elapsed);$('#progress-description').textContent=`At ${clock(s.elapsed)} elapsed, Direct has ${s.direct} of 8 batteries and ACAP has ${s.aop} of 8.`;seek.value=s.elapsed;seek.setAttribute('aria-valuetext',`${clock(s.elapsed)} elapsed`);player.dataset.frame=s.frame;player.dataset.elapsed=s.elapsed;status.textContent='';$('.hero-rate span').textContent=data.rates[s.frame]===data.quietRate?'Fast-forward':'Actions';$('.hero-rate strong').textContent=root.AOPPlayback.applyRate(v,data.rates[s.frame])+'×';
  seek.style.setProperty('--played',`${s.elapsed/data.end*100}%`);
  const current=events.filter(event=>event.frame<=s.frame).at(-1);
  events.forEach(event=>{event.button.classList.toggle('passed',event.frame<=s.frame);event.button.classList.toggle('current',event===current);if(event===current)event.button.setAttribute('aria-current','step');else event.button.removeAttribute('aria-current');});
 }
 if(v.requestVideoFrameCallback){const presented=(_,meta)=>{if(!v.seeking&&(!v.paused||frameAt(data,meta.mediaTime)===frameAt(data,v.currentTime))){if(!excerpt.tick(meta.mediaTime))draw(meta.mediaTime);}v.requestVideoFrameCallback(presented);};v.requestVideoFrameCallback(presented);}else{let raf=0;const tick=()=>{if(!excerpt.tick(v.currentTime))draw(v.currentTime);if(!v.paused)raf=requestAnimationFrame(tick);};v.addEventListener('playing',()=>{cancelAnimationFrame(raf);tick();});v.addEventListener('seeked',()=>draw(v.currentTime));v.addEventListener('timeupdate',()=>draw(v.currentTime));}
 // A paused seek can decode without presenting the video element. seeked guarantees the new frame is available.
 v.addEventListener('seeked',()=>{if(v.paused){lastFrame=-1;draw(v.currentTime);}});
 v.addEventListener('loadeddata',()=>{if(lastFrame<0&&!v.seeking)draw(v.currentTime);});
 function controls(){player.classList.toggle('playing',!v.paused&&!v.ended);play.setAttribute('aria-label',(v.ended||excerpt?.ended)?'Replay the synchronized comparison':v.paused?'Play the synchronized comparison':'Pause the synchronized comparison');}
 for(const event of ['play','pause','ended'])v.addEventListener(event,controls);
 v.addEventListener('waiting',()=>{status.textContent='Buffering';});v.addEventListener('seeking',()=>{status.textContent='Seeking';});v.addEventListener('playing',()=>{hasStarted=true;status.textContent='';});v.addEventListener('error',()=>{status.textContent='Video unavailable';});
 play.addEventListener('click',()=>{if(v.paused||v.ended){userPaused=false;if(v.ended)v.currentTime=0;v.play().catch(()=>{status.textContent='Press play to retry';});}else{userPaused=true;v.pause();}});
 function seekFrame(frame){userPaused=true;excerpt.seekFull((Math.min(data.frames-1,Math.max(0,frame))+.25)/data.fps);}
 seek.addEventListener('input',()=>seekFrame(root.AOPShared.findFrame(data,Number(seek.value))));
 events.forEach(({button,frame})=>button.addEventListener('click',()=>seekFrame(frame)));
 const visible=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting){v.pause();}else if(!hasStarted&&!userPaused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){v.play().catch(()=>{});}}),{threshold:.35});visible.observe(player);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)v.pause();});
 controls();
})(typeof window==='undefined'?globalThis:window);
