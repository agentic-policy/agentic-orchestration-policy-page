/* Visible entry points reuse the existing synchronized player controls. */
(() => {
  'use strict';
  function addLaunch(video,host,camera,toggle,kind,title){
    const button=document.createElement('button');
    button.type='button';button.className='demo-start';button.dataset.demo=kind;
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg><span></span>';
    host.classList.add('demo-launch-host');host.append(button);
    let started=!video.paused;
    function position(){
      const area=camera.getBoundingClientRect(),box=host.getBoundingClientRect();
      button.style.top=(area.top-box.top+area.height/2)+'px';
    }
    function update(){
      const verb=video.ended?'Replay':started?'Resume':'Play';
      button.querySelector('span').textContent=verb+(kind==='navigation'?' demo':' comparison');
      button.setAttribute('aria-label',verb+' '+title);
      button.hidden=!video.paused&&!video.ended;
    }
    const played=()=>{started=true;update();};
    button.addEventListener('click',()=>toggle.click());
    video.addEventListener('play',played);
    for(const event of ['pause','ended','loadedmetadata','seeked'])video.addEventListener(event,update);
    const resize=new ResizeObserver(position);resize.observe(camera);resize.observe(host);
    position();update();
    return ()=>{resize.disconnect();video.removeEventListener('play',played);for(const event of ['pause','ended','loadedmetadata','seeked'])video.removeEventListener(event,update);button.remove();};
  }
  for(const group of ['efficiency','coordination']){
    const grid=document.querySelector('#'+group+'-grid');let current=null,dispose=null;
    function refresh(){
      const video=grid.querySelector('video');if(video===current)return;
      dispose?.();current=video;
      if(video)dispose=addLaunch(video,grid,grid.querySelector('.shared-camera'),document.querySelector(`[data-play="${group}"]`),group,document.querySelector('#'+group+'-title').textContent+' comparison');
    }
    new MutationObserver(refresh).observe(grid,{childList:true});refresh();
  }
  const hero=document.querySelector('#hero-video');
  addLaunch(hero,document.querySelector('.hero-aop .hero-camera'),document.querySelector('.hero-aop .hero-camera'),document.querySelector('#hero-play'),'teaser','battery sorting comparison');
  const body=document.querySelector('#body-video'),player=body.closest('.rollout-player');
  addLaunch(body,player.querySelector('.camera-stage'),body,player.querySelector('.replay-toggle'),'navigation','navigation demo');
})();
