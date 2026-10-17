(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleToyMusicModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const BPM=108;
  const instrumentSet=['marimba','sparkle','soft-bass','handclap','light-percussion'];
  const profiles={
    lobby:{rate:.96,volume:.42,layers:1},
    play:{rate:1.02,volume:.55,layers:2},
    tension:{rate:1.08,volume:.64,layers:3},
    victory:{rate:1,volume:.58,layers:2}
  };
  function sceneProfile(scene){return {...(profiles[scene]||profiles.play)}}
  return {BPM,instrumentSet,sceneProfile};
});
