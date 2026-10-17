(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.DojoScene=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function createDojoScene(Phaser,deps){
    if(!Phaser||!deps)throw new Error('DojoScene requires Phaser and dependencies');
    const {WorldPlane,PlayerController,CollisionMap,PlayerAnimator,PlayerView,DepthSystem,CameraFollow,RaikaAnimationData,DojoLayout}=deps;
    if(!WorldPlane||!PlayerController||!CollisionMap||!PlayerAnimator||!PlayerView||!DepthSystem||!CameraFollow||!RaikaAnimationData||!DojoLayout)throw new Error('DojoScene dependencies are incomplete');
    const framesPerDirection=RaikaAnimationData.framesPerDirection;

    return class DojoScene extends Phaser.Scene{
      constructor(){super('DojoScene');}

      preload(){
        this.load.image('dojo-bg','./assets/gameplay/inazuma-main-hall-clean.png');
        this.load.image(RaikaAnimationData.textureKey,RaikaAnimationData.asset);
      }

      create(){
        this.add.image(800,450,'dojo-bg').setDisplaySize(1640,924).setDepth(-10).setAlpha(.92);
        this.add.image(800,450,'dojo-bg').setDisplaySize(1600,900).setDepth(0);
        this.worldPlane=WorldPlane.create(DojoLayout);
        this.collision=CollisionMap.create(DojoLayout);
        this.controller=PlayerController.createPlayerController({spawn:{x:500,y:420}});
        this.animator=PlayerAnimator.create(RaikaAnimationData,{stride:24});
        this.cameraFollow=CameraFollow.create({centerX:800,centerY:790,maxX:18,maxY:8,deadZoneX:170,deadZoneY:22,smoothing:7.5});
        this.visualRotation=0;

        const texture=this.textures.get(RaikaAnimationData.textureKey);
        const source=texture.getSourceImage();
        this.frameWidth=Math.floor(source.width/framesPerDirection);
        this.frameHeight=Math.floor(source.height/4);
        for(let row=0;row<4;row+=1){
          for(let frame=0;frame<framesPerDirection;frame+=1){
            texture.add(`${row}-${frame}`,0,frame*this.frameWidth,row*this.frameHeight,this.frameWidth,this.frameHeight);
          }
        }

        const startProjection=this.worldPlane.project({x:500,y:420});
        this.shadow=this.add.ellipse(startProjection.x,startProjection.y,72,24,0x24170d,.38).setDepth(DepthSystem.depthFor(startProjection,-1));
        this.raika=this.add.sprite(startProjection.x,startProjection.y,RaikaAnimationData.textureKey,'0-0').setOrigin(.5,.985).setDepth(DepthSystem.depthFor(startProjection,1));
        this.cursors=this.input.keyboard.createCursorKeys();
        this.wasd=this.input.keyboard.addKeys('W,A,S,D');
        this.game.canvas.setAttribute('aria-label','Raika movement engine v2');
      }

      collectInput(){
        const keys=new Set();
        if(this.cursors.left.isDown)keys.add('ArrowLeft');
        if(this.cursors.right.isDown)keys.add('ArrowRight');
        if(this.cursors.up.isDown)keys.add('ArrowUp');
        if(this.cursors.down.isDown)keys.add('ArrowDown');
        if(this.wasd.A.isDown)keys.add('KeyA');
        if(this.wasd.D.isDown)keys.add('KeyD');
        if(this.wasd.W.isDown)keys.add('KeyW');
        if(this.wasd.S.isDown)keys.add('KeyS');
        return PlayerController.inputFromKeys(keys);
      }

      update(_time,delta){
        const dt=Math.max(0,Math.min(.05,delta/1000));
        const input=this.collectInput();
        const state=this.controller.step({
          input,
          dt,
          resolveMotion:(current,proposed,radius)=>this.collision.resolveMotion(current,proposed,radius)
        });
        const projection=this.worldPlane.project({x:state.worldX,y:state.worldY});
        const animation=this.animator.update({facing:state.facing,moving:state.moving,movedDistance:state.movedDistance});
        const view=PlayerView.compute({projection,pivot:animation.pivot,motion:state});
        const artScale=(355/this.frameHeight)*view.scale;
        const rotationAlpha=1-Math.exp(-12*dt);
        this.visualRotation+=(view.rotation-this.visualRotation)*rotationAlpha;

        this.raika.setFrame(`${animation.row}-${animation.frameIndex}`);
        this.raika.setOrigin(view.originX,view.originY);
        this.raika.setPosition(view.x,view.y);
        this.raika.setScale(artScale);
        this.raika.setRotation(this.visualRotation);
        this.raika.setDepth(DepthSystem.depthFor(projection,1));
        this.shadow.setPosition(view.shadowX,view.shadowY);
        this.shadow.setScale(view.scale*(.92+.08*(1-state.speedRatio)));
        this.shadow.setDepth(DepthSystem.depthFor(projection,-1));

        const camera=this.cameraFollow.update(projection,dt);
        this.cameras.main.setScroll(camera.x,camera.y);
      }
    };
  }

  return Object.freeze({createDojoScene});
});
