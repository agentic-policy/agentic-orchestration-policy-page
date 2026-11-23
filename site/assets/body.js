/* The illustration follows recorded assignments on the presented video clock. */
(() => {
  'use strict';
  const section=document.querySelector('#body'),video=document.querySelector('#body-video'),data=window.AOP_BODY_STORY,replay=window.AOP_REPLAYS['mobile-aop'];
  const buttons=[...section.querySelectorAll('[data-body-chapter]')];
  const overview={title:'Different physical roles. One shared task.',copy:'The body positions the robot. The arm members acquire and carry the flowers.',lead:'Coordinate the members',roles:{left:'Acquire and place',right:'Acquire and carry',body:'Position the robot'}};
  let current=null;
  const excerpt=window.AOPPlayback.create(video,window.AOP_HIGHLIGHTS.mobile);
  function show(elapsed){
    const phase=data.phases.filter(p=>p.start<=elapsed).at(-1)||overview;
    section.dataset.bodyElapsed=elapsed;
    if(phase===current)return;current=phase;
    section.dataset.bodyChapter=phase.chapter||'overview';
    document.querySelector('#body-story-title').textContent=phase.title;
    document.querySelector('#body-story-copy').textContent=phase.copy;
    document.querySelector('#body-lead-role').textContent=phase.lead;
    for(const [actor,role] of Object.entries(phase.roles)){
      document.querySelector('#body-'+actor+'-role').textContent=role;
      section.querySelector(`[data-body-group="${actor}"]`).classList.toggle('engaged',!/^Hold|^Wait/.test(role));
    }
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bodyChapter===phase.chapter)));
  }
  function frameFor(elapsed){
    for(let f=0;f<replay.frames;f++){
      const s=window.AOPReplay.frameAt(replay,f/replay.fps);
      if(s&&s.elapsed>=elapsed)return f;
    }
    return replay.frames-1;
  }
  function seekChapter(name){
    excerpt.seekFull((frameFor(data.bookmarks[name])+.25)/replay.fps);
  }
  buttons.forEach(b=>b.addEventListener('click',()=>seekChapter(b.dataset.bodyChapter)));
  section.addEventListener('aop:replayframe',e=>{if(e.detail.slug==='mobile-aop')show(e.detail.elapsed);});
  const playback=()=>section.classList.toggle('body-playing',!video.paused&&!video.ended);
  ['play','pause','ended','waiting'].forEach(event=>video.addEventListener(event,()=>{if(event==='waiting')section.classList.remove('body-playing');else playback();}));
  video.addEventListener('playing',playback);
  show(0);
})();
