(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.DojoScene=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const HERO_BASE_HEIGHT=300;
  const VIEWPORT_WIDTH=1600;
  const VIEWPORT_HEIGHT=900;

  function createDojoScene(Phaser,deps){
    if(!Phaser||!deps)throw new Error('DojoScene requires Phaser and dependencies');
    const {WorldModel,WorldPlane,PlayerController,CollisionMap,InteractionSystem,PlayerAnimator,PlayerView,DepthSystem,CameraRig,RaikaAnimationData,DojoLayout}=deps;
    if(!WorldModel||!WorldPlane||!PlayerController||!CollisionMap||!InteractionSystem||!PlayerAnimator||!PlayerView||!DepthSystem||!CameraRig||!RaikaAnimationData||!DojoLayout)throw new Error('DojoScene dependencies are incomplete');
    const framesPerDirection=RaikaAnimationData.framesPerDirection;

    return class DojoScene extends Phaser.Scene{
      constructor(){super('DojoScene');}

      preload(){
        this.load.image('dojo-bg','./assets/gameplay/inazuma-main-hall-clean.png');
        this.load.image(RaikaAnimationData.textureKey,RaikaAnimationData.asset);
      }

      drawFloor(){
        const floor=this.add.graphics();
        floor.setDepth(DepthSystem.fixedBand('floor'));
        const polygon=this.worldModel.walkablePolygons[0].map((point)=>this.worldPlane.project(point));
        floor.fillStyle(0x8b693d,.96);
        floor.beginPath();
        floor.moveTo(polygon[0].x,polygon[0].y);
        for(let i=1;i<polygon.length;i++)floor.lineTo(polygon[i].x,polygon[i].y);
        floor.closePath();
        floor.fillPath();
        floor.lineStyle(3,0xd1b77a,.38);
        floor.strokePath();

        floor.lineStyle(2,0x5c4227,.28);
        for(let worldY=300;worldY<=1320;worldY+=170){
          const left=this.worldPlane.project({x:150,y:worldY});
          const right=this.worldPlane.project({x:2250,y:worldY});
          floor.beginPath();floor.moveTo(left.x,left.y);floor.lineTo(right.x,right.y);floor.strokePath();
        }
        for(let worldX=360;worldX<=2160;worldX+=300){
          const far=this.worldPlane.project({x:worldX,y:170});
          const near=this.worldPlane.project({x:worldX,y:1370});
          floor.beginPath();floor.moveTo(far.x,far.y);floor.lineTo(near.x,near.y);floor.strokePath();
        }
        this.environmentLayers.floor.push(floor);
      }

      createWorldProp(item){
        const projection=this.worldPlane.project({x:item.x,y:item.groundY||item.y});
        const scale=projection.scale;
        let visual;
        if(item.id==='training-bag'){
          visual=this.add.rectangle(projection.x,projection.y,84*scale,205*scale,0x5b1d18,.98).setOrigin(.5,1);
          visual.setStrokeStyle(Math.max(2,4*scale),0xd4a95d,.9);
        }else if(item.id==='left-column'||item.id==='right-column'){
          visual=this.add.rectangle(projection.x,projection.y,110*scale,350*scale,0x3c2618,.98).setOrigin(.5,1);
          visual.setStrokeStyle(Math.max(2,5*scale),0xb88b4e,.75);
        }else if(item.id==='courtyard-frame'){
          visual=this.add.rectangle(projection.x,projection.y,180*scale,310*scale,0x20140d,.72).setOrigin(.5,1);
          visual.setStrokeStyle(Math.max(3,8*scale),0x9a703e,.9);
        }else{
          visual=this.add.ellipse(projection.x,projection.y,90*scale,90*scale,0x5b4329,.9).setOrigin(.5,1);
        }
        if(item.layer==='foreground'){
          visual.setDepth(DepthSystem.fixedBand('foreground'));
          this.environmentLayers.foreground.push(visual);
        }else{
          visual.setDepth(DepthSystem.depthFor(projection,item.depthBias||0));
          this.environmentLayers.props.push(visual);
        }
        visual.setData('worldObjectId',item.id);
        visual.setData('groundProjection',projection);
        return visual;
      }

      createEnvironment(){
        this.environmentLayers={rear:[],floor:[],props:[],foreground:[]};
        const bounds=this.worldModel.renderBounds;
        const rearWash=this.add.graphics().setDepth(DepthSystem.fixedBand('background'));
        rearWash.fillStyle(0x17100b,1);rearWash.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);
        rearWash.fillStyle(0x382517,1);rearWash.fillRect(bounds.x,bounds.y,bounds.width,500);
        this.environmentLayers.rear.push(rearWash);

        const dojoArt=this.add.image(bounds.x+bounds.width/2,560,'dojo-bg')
          .setDisplaySize(3000,1125)
          .setAlpha(.58)
          .setDepth(DepthSystem.fixedBand('background')+2);
        this.environmentLayers.rear.push(dojoArt);

        const beam=this.add.rectangle(bounds.x+bounds.width/2,430,bounds.width,54,0x26170f,.96)
          .setDepth(DepthSystem.fixedBand('background')+3);
        this.environmentLayers.rear.push(beam);

        this.drawFloor();
        this.worldModel.renderObjects.forEach((item)=>{
          if(item.layer==='prop'||item.layer==='foreground')this.createWorldProp(item);
        });
      }

      create(){
        this.worldModel=WorldModel.create(DojoLayout);
        this.worldPlane=WorldPlane.create(DojoLayout);
        this.collision=CollisionMap.create(this.worldModel);
        this.interactions=InteractionSystem.create(this.worldModel,this.worldPlane);
        this.controller=PlayerController.createPlayerController({spawn:this.worldModel.spawn});
        this.animator=PlayerAnimator.create(RaikaAnimationData,{stride:24});
        this.cameraRig=CameraRig.create({
          viewportWidth:VIEWPORT_WIDTH,viewportHeight:VIEWPORT_HEIGHT,worldBounds:this.worldModel.renderBounds,zoom:1,
          deadZoneX:96,deadZoneY:54,smoothing:8,lookAheadX:120,lookAheadY:70
        });
        this.visualRotation=0;
        this.interactionPrompt=document.getElementById('interactionPrompt');
        this.createEnvironment();

        const texture=this.textures.get(RaikaAnimationData.textureKey);
        const source=texture.getSourceImage();
        this.frameWidth=Math.floor(source.width/framesPerDirection);
        this.frameHeight=Math.floor(source.height/4);
        for(let row=0;row<4;row+=1){
          for(let frame=0;frame<framesPerDirection;frame+=1){
            texture.add(`${row}-${frame}`,0,frame*this.frameWidth,row*this.frameHeight,this.frameWidth,this.frameHeight);
          }
        }

        const startProjection=this.worldPlane.project(this.worldModel.spawn);
        this.shadow=this.add.ellipse(startProjection.x,startProjection.y,96,30,0x160e09,.46).setDepth(DepthSystem.depthFor(startProjection,-1));
        this.raika=this.add.sprite(startProjection.x,startProjection.y,RaikaAnimationData.textureKey,'0-0').setOrigin(.5,.985).setDepth(DepthSystem.depthFor(startProjection,1));
        this.raika.setData('groundPoint',{...this.worldModel.spawn});
        const cameraStart=this.cameraRig.reset(startProjection);
        this.cameras.main.setBounds(this.worldModel.renderBounds.x,this.worldModel.renderBounds.y,this.worldModel.renderBounds.width,this.worldModel.renderBounds.height);
        this.cameras.main.setScroll(cameraStart.scrollX,cameraStart.scrollY);
        this.cameras.main.setZoom(cameraStart.zoom);
        this.cursors=this.input.keyboard.createCursorKeys();
        this.wasd=this.input.keyboard.addKeys('W,A,S,D');
        this.game.canvas.setAttribute('aria-label','Raika world-space movement engine v2');
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

      updateInteractionPrompt(state,camera){
        if(!this.interactionPrompt)return;
        const item=this.interactions.nearest({x:state.worldX,y:state.worldY},180);
        if(!item){
          this.interactionPrompt.hidden=true;
          this.interactionPrompt.removeAttribute('data-interaction-id');
          return;
        }
        const promptProjection=this.interactions.projectPrompt(item);
        const screenX=(promptProjection.x-camera.scrollX)*camera.zoom;
        const screenY=(promptProjection.y-camera.scrollY)*camera.zoom;
        this.interactionPrompt.textContent=`E · ${item.prompt}`;
        this.interactionPrompt.dataset.interactionId=item.id;
        this.interactionPrompt.style.position='absolute';
        this.interactionPrompt.style.left=`${Math.round(screenX)}px`;
        this.interactionPrompt.style.top=`${Math.round(screenY-36)}px`;
        this.interactionPrompt.style.transform='translate(-50%,-100%)';
        this.interactionPrompt.hidden=screenX<-80||screenX>VIEWPORT_WIDTH+80||screenY<-80||screenY>VIEWPORT_HEIGHT+80;
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
        const artScale=(HERO_BASE_HEIGHT/this.frameHeight)*view.scale;
        const rotationAlpha=1-Math.exp(-12*dt);
        this.visualRotation+=(view.rotation-this.visualRotation)*rotationAlpha;

        this.raika.setFrame(`${animation.row}-${animation.frameIndex}`);
        this.raika.setOrigin(view.originX,view.originY);
        this.raika.setPosition(view.x,view.y);
        this.raika.setScale(artScale);
        this.raika.setRotation(this.visualRotation);
        this.raika.setDepth(DepthSystem.depthFor(projection,1));
        this.raika.setData('groundPoint',{x:state.worldX,y:state.worldY});
        this.shadow.setPosition(view.shadowX,view.shadowY);
        this.shadow.setScale(view.scale*(1.02-.08*state.speedRatio));
        this.shadow.setDepth(DepthSystem.depthFor(projection,-1));

        const camera=this.cameraRig.update({groundProjection:projection,velocity:{x:state.vx,y:state.vy},dt});
        this.cameras.main.setScroll(camera.scrollX,camera.scrollY);
        this.cameras.main.setZoom(camera.zoom);
        this.updateInteractionPrompt(state,camera);
      }
    };
  }

  return Object.freeze({createDojoScene});
});
