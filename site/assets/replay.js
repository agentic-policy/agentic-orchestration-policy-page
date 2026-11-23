'use strict';
(() => {
  const players=new WeakMap();
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clock=s=>s<0?'Initializing':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  function interval(rows,t){let lo=0,hi=rows.length-1,found=-1;while(lo<=hi){const m=(lo+hi)>>1;if(rows[m][0]<=t+1e-7){found=m;lo=m+1;}else hi=m-1;}return found>=0&&t<rows[found][1]+1e-7?rows[found]:null;}
  function frameAt(data,mediaTime){
    const frame=Math.max(0,Math.min(data.frames-1,Math.floor((mediaTime+1e-6)*data.fps))),time=frame/data.fps;
    const clip=interval(data.timeline,time);if(!clip)return null;
    const elapsed=clip[2]+(time-clip[0])*data.speed,ownershipRow=interval(data.ownership,elapsed),ownership=ownershipRow?.[2]||{};
    return {frame,time,elapsed,actors:data.actors.map(a=>{const state=interval(data.states[a.id]||[],elapsed)?.[2]||'Trace unavailable';let note=interval(data.notes[a.id]||[],time);if(note&&note[4]>elapsed+1e-6)note=null;return {...a,state,controlKnown:!!ownershipRow?.[3],controls:Object.entries(ownership).filter(([,owner])=>owner===a.id).map(([group])=>group),note};})};
  }
  function unmount(video){players.get(video)?.destroy();}
  function mount(video,featured=false){
    unmount(video);
    const slug=new URL(video.getAttribute('src'),document.baseURI).pathname.split('/').pop().replace(/\.mp4$/,'');
    const data=window.AOP_REPLAYS?.[slug];if(!data)return null;
    // Each rebuilt export gets a content key, including when opened from a file URL.
    if(data.mediaHash){
      const source=new URL(video.getAttribute('src'),document.baseURI);source.searchParams.set('v',data.mediaHash);
      if(video.src!==source.href)video.src=source.href;
      if(video.getAttribute('poster')){const poster=new URL(video.getAttribute('poster'),document.baseURI);poster.searchParams.set('v',data.mediaHash);video.poster=poster.href;}
    }
    const root=document.createElement('div');root.className=`rollout-player${featured?' featured-replay':''}`;root.dataset.replay=slug;root.style.setProperty('--replay-aspect',`${data.width} / ${data.height}`);root.style.setProperty('--side-start',data.sideStart+'%');
    root.innerHTML=`<div class="camera-stage"><div class="camera-label main-camera">${escape(data.cameras[0])}</div><div class="camera-label left-camera">${escape(data.cameras[1])}</div><div class="camera-label right-camera">${escape(data.cameras[2])}</div><span class="playback-status" role="status" hidden></span></div><div class="replay-controls"><button class="replay-toggle" aria-label="Play rollout"><svg class="play-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 3 11 7-11 7z"/></svg><svg class="pause-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3h3v14H5zm7 0h3v14h-3z"/></svg></button><input class="replay-seek" type="range" min="0" max="${data.frames-1}" step="1" value="0" aria-label="Seek rollout"><span class="replay-elapsed"><span class="clock-label">Task</span> <time></time></span><span class="replay-speed">8×</span></div><details class="agent-activity" ${featured?'open':''}><summary><span>Agent activity</span><span class="activity-mark" aria-hidden="true">+</span></summary><div class="actor-tabs" role="tablist" aria-label="Choose agent">${data.actors.map((a,i)=>`<button role="tab" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-actor="${a.id}">${escape(a.name.replace(' member',''))}</button>`).join('')}</div><div class="agent-cards">${data.actors.map((a,i)=>`<article class="agent-card${i===0?' selected':''}" data-actor="${a.id}"><div class="agent-heading"><strong>${escape(a.id==='lead'?(slug.endsWith('-aop')?'Lead & hyper-agent':slug.endsWith('-fixed')?'Lead':'Agent'):a.name)}</strong><span class="agent-state"></span></div><p class="agent-control"></p><p class="note-source"><span></span><time></time></p><p class="agent-copy"></p><button class="read-note" hidden>Read more</button></article>`).join('')}</div></details>`;
    video.replaceWith(root);root.querySelector('.camera-stage').prepend(video);video.controls=false;video.preload='metadata';
    // One media stream contains all cameras. No independently clocked overlays or videos.
    const seek=root.querySelector('.replay-seek'),toggle=root.querySelector('.replay-toggle'),status=root.querySelector('.playback-status'),elapsed=root.querySelector('.replay-elapsed time');
    const cards=new Map([...root.querySelectorAll('.agent-card')].map(c=>[c.dataset.actor,c]));
    // Use the existing frame-synchronized cards in an always-visible grid.
    if(slug==='mobile-aop'){
      const panel=document.createElement('section'),disclosure=root.querySelector('.agent-activity');
      panel.className='coordination-agents';panel.setAttribute('aria-label','Coordinating agents');
      for(const card of cards.values())panel.append(card);
      disclosure.replaceWith(panel);
    }
    let disposed=false,frameHandle=null,lastFrame=-1;const listeners=[];
    const on=(name,fn)=>{video.addEventListener(name,fn);listeners.push([name,fn]);};
    function paint(mediaTime){const snapshot=frameAt(data,window.AOPPlayback?.sourceTime(video,mediaTime)??mediaTime);if(!snapshot||disposed)return;if(snapshot.frame===lastFrame)return;lastFrame=snapshot.frame;root.dataset.frame=String(snapshot.frame);root.dataset.elapsed=snapshot.elapsed.toFixed(6);seek.value=snapshot.frame;seek.setAttribute('aria-valuetext',`${clock(snapshot.time)} of ${clock(data.duration)} of excerpts; task ${clock(snapshot.elapsed)}`);elapsed.textContent=clock(snapshot.elapsed);root.querySelector('.clock-label').hidden=snapshot.elapsed<0;
      for(const actor of snapshot.actors){const card=cards.get(actor.id);card.querySelector('.agent-state').textContent=actor.state;card.querySelector('.agent-control').textContent=actor.controls.length?`Controls ${actor.controls.map(group=>slug==='mobile-aop'&&group==='body'?'torso + chassis':group).join(' + ')}`:actor.controlKnown?'No control assigned':'Control not recorded';
        const note=actor.note,key=note?String(note[0]):'none';if(card.dataset.note!==key){card.dataset.note=key;card.classList.remove('expanded');const copy=card.querySelector('.agent-copy');copy.textContent=note?note[3]:(actor.state==='Not started'?'This agent has not started.':'No summary recorded at this point.');card.querySelector('.note-source span').textContent=note?note[2]:'';card.querySelector('.note-source time').textContent=note&&note[4]>=0?clock(note[4]):'';const read=card.querySelector('.read-note');read.hidden=!note||note[3].length<160;read.textContent='Read more';}
      }
      if(slug==='flowers-aop'||slug==='mobile-aop')root.dispatchEvent(new CustomEvent('aop:replayframe',{bubbles:true,detail:{slug,frame:snapshot.frame,elapsed:snapshot.elapsed}}));
    }
    function clearStatus(){status.hidden=true;root.classList.remove('is-seeking');}
    function requestFrame(){if(disposed||!video.requestVideoFrameCallback)return;frameHandle=video.requestVideoFrameCallback((_,meta)=>{frameHandle=null;if(!video.seeking&&(!video.paused||Math.abs(meta.mediaTime-video.currentTime)<1/data.fps)){paint(meta.mediaTime);clearStatus();}requestFrame();});}
    function playState(){const playing=!video.paused&&!video.ended;root.classList.toggle('is-playing',playing);toggle.setAttribute('aria-label',playing?'Pause rollout':'Play rollout');}
    toggle.addEventListener('click',()=>{if(video.paused||video.ended){if(video.ended)video.currentTime=0;video.play().catch(()=>{status.textContent='Unable to play this video.';status.hidden=false;});}else video.pause();});
    seek.addEventListener('input',()=>{window.AOPPlayback.seekFull(video,Number(seek.value)/data.fps);});
    root.querySelectorAll('.read-note').forEach(button=>button.addEventListener('click',()=>{video.pause();const card=button.closest('.agent-card'),expanded=card.classList.toggle('expanded');button.textContent=expanded?'Show less':'Read more';}));
    const tabs=[...root.querySelectorAll('.actor-tabs button')];
    function selectActor(button){tabs.forEach(b=>{const selected=b===button;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;cards.get(b.dataset.actor).classList.toggle('selected',selected);});}
    tabs.forEach((b,i)=>{b.addEventListener('click',()=>selectActor(b));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectActor(tabs[n]);tabs[n].focus();});});
    on('play',playState);on('pause',playState);on('ended',()=>{paint(video.currentTime);playState();});
    on('loadeddata',()=>{if(!video.seeking){lastFrame=-1;paint(video.currentTime);clearStatus();}});
    on('seeking',()=>{root.classList.add('is-seeking');status.textContent='Seeking…';status.hidden=false;});
    on('seeked',()=>{lastFrame=-1;paint(video.currentTime);clearStatus();});
    on('waiting',()=>{status.textContent='Loading video…';status.hidden=false;});on('playing',clearStatus);
    on('error',()=>{status.textContent='Video unavailable. Try reloading the page.';status.hidden=false;});
    // Fallback still uses media time, never time since play was pressed.
    if(!video.requestVideoFrameCallback)on('timeupdate',()=>paint(video.currentTime));
    paint(0);playState();requestFrame();
    const api={root,data,paint,destroy(){disposed=true;if(frameHandle!==null&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frameHandle);listeners.forEach(([n,f])=>video.removeEventListener(n,f));root.replaceWith(video);players.delete(video);}};players.set(video,api);return api;
  }
  window.AOPReplay={frameAt,mount,unmount};
})();
