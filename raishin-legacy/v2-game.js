(() => {
  'use strict';

  const mount=document.getElementById('phaserGame');
  const error=document.getElementById('loadError');
  const PhaserRef=window.Phaser;
  const deps=window.RaishinV2||{};

  function fail(){if(error)error.hidden=false;}
  const required=['DojoLayout','WorldPlane','CollisionMap','PlayerController','InteractionSystem','RaikaAnimationData','PlayerAnimator','PlayerView','DojoScene'];
  if(!mount||!error||!PhaserRef||required.some((name)=>!deps[name])){fail();return;}

  try{
    const SceneClass=deps.DojoScene.createDojoScene(PhaserRef,deps);
    new PhaserRef.Game({
      type:PhaserRef.AUTO,
      parent:'phaserGame',
      width:1600,
      height:900,
      backgroundColor:'#120c07',
      scene:[SceneClass],
      render:{antialias:true,pixelArt:false,roundPixels:false},
      scale:{mode:PhaserRef.Scale.FIT,autoCenter:PhaserRef.Scale.CENTER_BOTH,width:1600,height:900}
    });
    error.hidden=true;
  }catch(_error){
    fail();
  }
})();
