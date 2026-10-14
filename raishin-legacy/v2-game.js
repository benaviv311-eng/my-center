(() => {
  'use strict';

  const mount=document.getElementById('phaserGame');
  const error=document.getElementById('loadError');
  const PhaserRef=window.Phaser;

  function fail(){
    if(error)error.hidden=false;
  }

  if(!mount||!error||!PhaserRef){
    fail();
    return;
  }

  class PreviewBootScene extends PhaserRef.Scene{
    constructor(){super('PreviewBootScene');}
    preload(){
      this.load.image('dojo-bg',mount.dataset.background);
      this.load.image('raika-sheet',mount.dataset.sprite);
    }
    create(){
      const bg=this.add.image(800,450,'dojo-bg');
      bg.setDisplaySize(1600,900);
      error.hidden=true;
    }
  }

  try{
    new PhaserRef.Game({
      type:PhaserRef.AUTO,
      parent:'phaserGame',
      width:1600,
      height:900,
      backgroundColor:'#120c07',
      scene:[PreviewBootScene],
      render:{antialias:true,pixelArt:false,roundPixels:false},
      scale:{mode:PhaserRef.Scale.FIT,autoCenter:PhaserRef.Scale.CENTER_BOTH,width:1600,height:900}
    });
  }catch(_error){
    fail();
  }
})();
