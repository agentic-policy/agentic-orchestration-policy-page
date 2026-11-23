/* Continuous media with a map back to the recorded task clock. */
(function(root){
 'use strict';
 const players=new WeakMap();
 // Pacing is encoded in the media. Do not change playbackRate inside frame callbacks:
 // WebKit can replay older frames on a rate change and create a feedback loop.
 function applyRate(video,sourceRate){return sourceRate===4?8:sourceRate;}
 function mappedTime(clip,time){
  const frame=Math.max(0,Math.min(clip.frames-1,Math.floor(time*clip.fps+1e-3)));
  return clip.sourceFrames[frame]/clip.sourceFps;
 }
 function clipTime(spec,time){return mappedTime(spec.clip,time);}
 function mediaTime(clip,sourceTime){
  if(!clip)return sourceTime;
  const target=Math.floor(sourceTime*clip.sourceFps+1e-3),frames=clip.sourceFrames;
  let lo=0,hi=frames.length-1;
  while(lo<hi){const mid=(lo+hi)>>1;if(frames[mid]<target)lo=mid+1;else hi=mid;}
  return (lo+.25)/clip.fps;
 }
 function sourceTime(video,time){return players.get(video)?.sourceTime(time)??time;}
 function seekFull(video,time){const player=players.get(video);if(player)player.seekFull(time);else video.currentTime=time;}
 function create(video,spec,{onChange=()=>{}}={}){
  let disposed=false,pendingSeek=null;
  const fullSource=video.getAttribute('src');
  function seek(time){pendingSeek=time;if(video.readyState>=1){video.currentTime=time;pendingSeek=null;}}
  function metadata(){if(pendingSeek!==null&&!disposed){video.currentTime=pendingSeek;pendingSeek=null;}}
  const api={tick(){return false;},get fullSource(){return fullSource;},get ended(){return video.ended;},sourceTime(time){return spec.fullClip?mappedTime(spec.fullClip,time):time;},seekFull(time){video.pause();seek(mediaTime(spec.fullClip,time));onChange();},destroy(){disposed=true;players.delete(video);video.removeEventListener('loadedmetadata',metadata);video.removeEventListener('ended',onChange);}};
  players.set(video,api);video.addEventListener('loadedmetadata',metadata);video.addEventListener('ended',onChange);
  video.src=spec.fullClip?spec.fullClip.file+'?v='+spec.fullClip.sha256.slice(0,12):fullSource;video.load();onChange();return api;
 }
 root.AOPPlayback={create,applyRate,sourceTime,seekFull,clipTime,mappedTime,mediaTime,fullSource(video){return players.get(video)?.fullSource??video.src;}};
})(typeof window==='undefined'?globalThis:window);
