(() => {
  'use strict';
  const root=document.querySelector('.game-app'),frame=document.querySelector('.game-frame'),canvas=document.getElementById('gameCanvas'),error=document.getElementById('loadError');
  const interactionPrompt=document.getElementById('interactionPrompt'),interactionPanel=document.getElementById('interactionPanel'),interactionClose=document.getElementById('interactionClose'),interactionTitle=document.getElementById('interactionTitle'),interactionBody=document.getElementById('interactionBody'),objectiveText=document.getElementById('objectiveText'),seikaOverlay=document.getElementById('seikaOverlay'),ambientLight=document.querySelector('.ambient-light-overlay');
  const movement=window.RaishinMovement,dojoWorld=window.RaishinDojoWorld,effects=window.RaishinDojoEffects;
  if(!root||!frame||!canvas||!error||!movement||!dojoWorld||!effects||!interactionPrompt||!interactionPanel||!objectiveText)return;
  const ctx=canvas.getContext('2d'),background=new Image(),sprite=new Image(),upSprite=new Image(),logicalWidth=1600,logicalHeight=900,worldScale=1.08;
  function configureCanvas(){const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(logicalWidth*dpr);canvas.height=Math.round(logicalHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);return dpr;} configureCanvas();

  let upSpriteReady=false,upSpriteProfessional=true,upFallbackTried=false;
  background.decoding='async';sprite.decoding='async';upSprite.decoding='async';
  upSprite.onload=()=>{upSpriteReady=!!upSprite.naturalWidth;};
  upSprite.onerror=()=>{
    upSpriteReady=false;
    if(upFallbackTried)return;
    upFallbackTried=true;
    upSpriteProfessional=false;
    upSprite.src='./assets/player/raika-walk-up-v2.png?v=grounding-v2-1';
  };
  background.src=canvas.dataset.background;
  sprite.src=canvas.dataset.sprite;
  upSprite.src='./assets/player/raika-walk-up-professional-v3.png?v=professional-walk-v3-2';

  const reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const keys=new Set(),state={x:800,y:690,vx:0,vy:0,direction:'down',moving:false,walkTime:0,upDistance:0,upIdleFrame:0,leftDistance:0,leftIdleFrame:0,lastTimestamp:0,currentInteraction:null,overlayOpen:false,seikaActive:false,camera:{x:0,y:0},renderOffset:{x:0,y:0},atmosphere:effects.createAtmosphereState(reducedMotion)};
  const rowByDirection={down:0,up:1,left:2,right:3},frameCount=8,walkFps=10,maxSpeed=245,acceleration=900,deceleration=1100,playerRadius=24;
  const upFootBaselineRatio=1,upWalkBob=0,upFootContactOffsets=[14,-9,5,-10,-10,-12,15,-6];
  const upFrameStride=24,leftFrameStride=24,leftFrameMetrics=[];
  // Normalized coordinates keep the planted paw locked to the floor regardless of PNG resolution.
  const upFootContacts=[
    {x:.517,y:.907},{x:.525,y:.907},{x:.467,y:.907},{x:.500,y:.907},
    {x:.675,y:.907},{x:.658,y:.907},{x:.667,y:.907},{x:.650,y:.907}
  ];
  const upLowerMirror={x0:.258,x1:.908,y0:.610};
  const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
  const interactionKeys=new Set(['KeyE','Enter']);

  function openPanel(title,body){interactionTitle.textContent=title;interactionBody.textContent=body;interactionPanel.hidden=false;state.overlayOpen=true;keys.clear();state.vx=0;state.vy=0;}
  function closePanel(){interactionPanel.hidden=true;state.overlayOpen=false;frame.focus({preventScroll:true});}
  function performInteraction(){const item=state.currentInteraction;if(!item)return;switch(item.id){case'training-bag':objectiveText.textContent='Objective: Practice 10 controlled strikes at the bag.';break;case'weapons-wall':openPanel('Training Weapons','Examine the wooden practice equipment. Weapon training unlocks after the movement lesson.');break;case'training-center':objectiveText.textContent='Objective: Begin the movement drill in the training center.';break;case'courtyard-exit':openPanel('Courtyard — locked preview','The courtyard is visible and usable as the next transition, but it is locked in this dojo build.');break;case'seika-point':state.seikaActive=!state.seikaActive;frame.classList.toggle('is-seika',state.seikaActive);seikaOverlay.setAttribute('aria-hidden',String(!state.seikaActive));objectiveText.textContent=state.seikaActive?'Seika: Breathe. Observe the room.':'Objective: Explore the Main Hall';break;}}
  function onKeyDown(event){if(state.overlayOpen){if(event.code==='Escape'){event.preventDefault();closePanel();return;}if(interactionKeys.has(event.code)||movementKeys.has(event.code))event.preventDefault();return;}if(interactionKeys.has(event.code)){event.preventDefault();if(!event.repeat)performInteraction();return;}if(!movementKeys.has(event.code))return;event.preventDefault();keys.add(event.code);}
  function onKeyUp(event){if(!movementKeys.has(event.code))return;event.preventDefault();keys.delete(event.code);}
  window.addEventListener('keydown',onKeyDown,{passive:false});window.addEventListener('keyup',onKeyUp,{passive:false});window.addEventListener('blur',()=>keys.clear());frame.addEventListener('pointerdown',()=>frame.focus());interactionClose.addEventListener('click',closePanel);

  function updateDirection(input){const ax=Math.abs(state.vx),ay=Math.abs(state.vy);if(Math.hypot(state.vx,state.vy)<22)return;if(ax>ay*1.12)state.direction=state.vx>0?'right':'left';else if(ay>ax*1.12)state.direction=state.vy>0?'down':'up';else if(Math.abs(input.x)>Math.abs(input.y))state.direction=input.x>0?'right':'left';else if(Math.abs(input.y)>Math.abs(input.x))state.direction=input.y>0?'down':'up';}
  function worldPoint(point){return effects.worldToScreen(point,state.renderOffset,worldScale,logicalWidth,logicalHeight);}
  function updateInteractionUI(){const active=dojoWorld.nearestInteraction(state,165);state.currentInteraction=active;if(!active||state.overlayOpen){interactionPrompt.hidden=true;return;}const screen=worldPoint(active);interactionPrompt.hidden=false;interactionPrompt.textContent=`[E] ${active.prompt}`;interactionPrompt.style.left=`${screen.x/logicalWidth*100}%`;interactionPrompt.style.top=`${Math.max(8,(screen.y-95*worldScale)/logicalHeight*100)}%`;interactionPrompt.style.bottom='auto';}
  function drawInteractionHighlight(item,timestamp){if(!item||state.overlayOpen)return;const alpha=reducedMotion?.34:.34+Math.sin(timestamp*.004)*.07,screen=worldPoint(item);ctx.save();ctx.lineWidth=2.2*worldScale;ctx.strokeStyle=`rgba(247,207,115,${alpha})`;ctx.fillStyle=`rgba(247,207,115,${alpha*.12})`;ctx.shadowColor=`rgba(247,207,115,${alpha*.55})`;ctx.shadowBlur=reducedMotion?0:12*worldScale;ctx.beginPath();ctx.ellipse(screen.x,screen.y,42*worldScale,14*worldScale,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}

  function buildLeftGroundingMetrics(){
    leftFrameMetrics.length=0;
    try{
      const sw=Math.floor(sprite.naturalWidth/frameCount),sh=Math.floor(sprite.naturalHeight/4),row=rowByDirection.left;
      if(!sw||!sh)return;
      const scan=document.createElement('canvas');scan.width=sw;scan.height=sh;
      const scanCtx=scan.getContext('2d',{willReadFrequently:true});if(!scanCtx)return;
      const lowerStart=Math.floor(sh*.52),bandDepth=Math.max(3,Math.round(sh*.02));
      for(let frameIndex=0;frameIndex<frameCount;frameIndex+=1){
        scanCtx.clearRect(0,0,sw,sh);
        scanCtx.drawImage(sprite,frameIndex*sw,row*sh,sw,sh,0,0,sw,sh);
        const pixels=scanCtx.getImageData(0,0,sw,sh).data;
        let maxY=-1;
        for(let y=lowerStart;y<sh;y+=1){
          for(let x=0;x<sw;x+=1){
            if(pixels[(y*sw+x)*4+3]>40)maxY=y;
          }
        }
        if(maxY<0){leftFrameMetrics.push({x:.5,y:1});continue;}
        const bandStart=Math.max(lowerStart,maxY-bandDepth),xs=[];
        for(let y=bandStart;y<=maxY;y+=1){
          for(let x=0;x<sw;x+=1){
            if(pixels[(y*sw+x)*4+3]>72)xs.push(x);
          }
        }
        xs.sort((a,b)=>a-b);
        const contactX=xs.length?xs[Math.floor(xs.length/2)]:sw/2;
        leftFrameMetrics.push({x:(contactX+.5)/sw,y:(maxY+.5)/sh});
      }
    }catch(_error){leftFrameMetrics.length=0;}
  }

  function upFrameGeometry(frameIndex,anchor,depthScale){
    const sw=upSprite.naturalWidth/8,sh=upSprite.naturalHeight,scale=depthScale*worldScale,dh=355*scale,dw=dh*(sw/sh),contact=upFootContacts[frameIndex]||upFootContacts[0],foot={x:contact.x*sw,y:contact.y*sh},sx=frameIndex*sw,dx=anchor.x-dw/2,dy=anchor.y-foot.y*(dh/sh);
    return{sw,sh,dh,dw,foot,sx,dx,dy,scaleX:dw/sw,scaleY:dh/sh};
  }
  function drawUpFrame(frameIndex,anchor,depthScale){
    const g=upFrameGeometry(frameIndex,anchor,depthScale);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(upSprite,g.sx,0,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);
    if(frameIndex>=4){
      const clipX=g.dx+upLowerMirror.x0*g.dw,clipY=g.dy+upLowerMirror.y0*g.dh,clipW=(upLowerMirror.x1-upLowerMirror.x0)*g.dw,clipH=(1-upLowerMirror.y0)*g.dh,centerX=g.dx+g.dw/2;
      ctx.save();ctx.beginPath();ctx.rect(clipX,clipY,clipW,clipH);ctx.clip();ctx.translate(centerX*2,0);ctx.scale(-1,1);ctx.drawImage(upSprite,g.sx,0,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);ctx.restore();
    }
    ctx.restore();
  }
  function professionalUpContactX(frameIndex,anchor,depthScale){const g=upFrameGeometry(frameIndex,anchor,depthScale);return g.dx+g.foot.x*g.scaleX;}

  function leftFrameGeometry(frameIndex,anchor,depthScale){
    const sw=sprite.naturalWidth/frameCount,sh=sprite.naturalHeight/4,row=rowByDirection.left,scale=depthScale*worldScale,dh=355*scale,dw=dh*(sw/sh),metric=leftFrameMetrics[frameIndex]||{x:.5,y:1},foot={x:metric.x*sw,y:metric.y*sh},sx=frameIndex*sw,sy=row*sh,dx=anchor.x-dw/2,dy=anchor.y-foot.y*(dh/sh);
    return{sw,sh,dh,dw,foot,sx,sy,dx,dy,scaleX:dw/sw,scaleY:dh/sh};
  }
  function drawLeftFrame(frameIndex,anchor,depthScale){
    const g=leftFrameGeometry(frameIndex,anchor,depthScale);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(sprite,g.sx,g.sy,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);
    ctx.restore();
  }
  function leftGroundContactX(frameIndex,anchor,depthScale){const g=leftFrameGeometry(frameIndex,anchor,depthScale);return g.dx+g.foot.x*g.scaleX;}

  function drawPlayer(frameIndex,anchor,depthScale,grounding){
    const scale=depthScale*worldScale;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(state.direction==='up'&&upSpriteReady&&upSpriteProfessional){ctx.restore();drawUpFrame(frameIndex,anchor,depthScale);return;}
    if(state.direction==='left'&&leftFrameMetrics.length===frameCount){ctx.restore();drawLeftFrame(frameIndex,anchor,depthScale);return;}
    if(state.direction==='up'&&upSpriteReady){const sw=upSprite.naturalWidth/8,sh=upSprite.naturalHeight,dh=355*scale,dw=dh*(sw/sh);ctx.drawImage(upSprite,frameIndex*sw,0,sw,sh,anchor.x-dw/2,anchor.y-dh*upFootBaselineRatio+upWalkBob,dw,dh);}
    else{const sw=sprite.naturalWidth/8,sh=sprite.naturalHeight/4,row=rowByDirection[state.direction],dh=355*scale,dw=dh*(sw/sh);ctx.drawImage(sprite,frameIndex*sw,row*sh,sw,sh,anchor.x-dw/2,anchor.y-dh+grounding.bobY,dw,dh);}
    ctx.restore();
  }
  function updateMinimap(){const m=dojoWorld.worldToMinimap(state);const dot=document.getElementById('minimapPlayer');if(dot){dot.style.left=`${18+m.x*64}%`;dot.style.top=`${18+m.y*64}%`;}}

  function render(timestamp){
    if(!state.lastTimestamp)state.lastTimestamp=timestamp;
    const dt=Math.min(.05,(timestamp-state.lastTimestamp)/1000);state.lastTimestamp=timestamp;
    const input=state.overlayOpen?{x:0,y:0}:movement.inputVector(keys),velocity=movement.smoothVelocity({x:state.vx,y:state.vy},input,dt,acceleration,deceleration,maxSpeed);
    state.vx=velocity.x;state.vy=velocity.y;state.moving=Math.hypot(state.vx,state.vy)>4;updateDirection(input);
    if(state.moving){
      const proposed={x:state.x+state.vx*dt,y:state.y+state.vy*dt},next=dojoWorld.resolvePlayerMotion(state,proposed,playerRadius),movedDistance=Math.hypot(next.x-state.x,next.y-state.y);
      if(state.direction==='up'&&movedDistance>0)state.upDistance+=movedDistance;
      if(state.direction==='left'&&movedDistance>0)state.leftDistance+=movedDistance;
      if(next.x===state.x)state.vx=0;if(next.y===state.y)state.vy=0;state.x=next.x;state.y=next.y;state.walkTime+=dt;
    }else{state.walkTime=0;}
    state.camera=effects.updateCamera(state.camera,state,dt,{centerX:800,centerY:650,deadZoneX:180,deadZoneY:90,maxX:48,maxY:28,followStrength:reducedMotion?9:6});
    const near=dojoWorld.nearestInteraction(state,165),focus=near?effects.interactionFramingOffset(state.camera,near,reducedMotion?.15:.35):{x:0,y:0};state.renderOffset={x:state.camera.x+focus.x,y:state.camera.y+focus.y};
    state.atmosphere.reducedMotion=reducedMotion||state.seikaActive;state.atmosphere=effects.updateAtmosphere(state.atmosphere,dt,{width:logicalWidth,height:logicalHeight});updateInteractionUI();updateMinimap();if(ambientLight)ambientLight.style.opacity=String(reducedMotion?.78:.82+effects.lightPulse(timestamp)*1.15);

    ctx.clearRect(0,0,logicalWidth,logicalHeight);const bg=effects.backgroundRect(state.renderOffset,worldScale,logicalWidth,logicalHeight);ctx.drawImage(background,bg.x,bg.y,bg.width,bg.height);drawInteractionHighlight(near,timestamp);
    const depthScale=movement.scaleForDepth(state.y,365,830),anchor=worldPoint(state),speed=Math.hypot(state.vx,state.vy),grounding=effects.groundingMotion(state.walkTime,state.moving,speed,depthScale*worldScale),legacyFrameIndex=movement.frameAt(state.walkTime,state.moving,frameCount,walkFps);
    let frameIndex=legacyFrameIndex;
    if(state.direction==='up'&&upSpriteReady&&upSpriteProfessional){const distanceFrame=movement.frameAtDistance(state.upDistance,upFrameStride,frameCount);if(state.moving){frameIndex=distanceFrame;if(frameIndex===0||frameIndex===4)state.upIdleFrame=frameIndex;}else frameIndex=state.upIdleFrame;}
    if(state.direction==='left'&&leftFrameMetrics.length===frameCount){const distanceFrame=movement.frameAtDistance(state.leftDistance,leftFrameStride,frameCount);if(state.moving){frameIndex=distanceFrame;if(frameIndex===0||frameIndex===4)state.leftIdleFrame=frameIndex;}else frameIndex=state.leftIdleFrame;}
    let contactX=anchor.x;
    if(state.direction==='up'&&upSpriteReady&&upSpriteProfessional)contactX=professionalUpContactX(frameIndex,anchor,depthScale);
    else if(state.direction==='left'&&leftFrameMetrics.length===frameCount)contactX=leftGroundContactX(frameIndex,anchor,depthScale);
    else if(state.direction==='up'&&upSpriteReady&&upSprite.naturalHeight){const dh=355*depthScale*worldScale;contactX+=upFootContactOffsets[frameIndex]*(dh/upSprite.naturalHeight);}
    effects.drawFloorContact(ctx,contactX,anchor.y,depthScale*worldScale,grounding);drawPlayer(frameIndex,anchor,depthScale,grounding);effects.renderAtmosphere(ctx,state.atmosphere,state.renderOffset);requestAnimationFrame(render);
  }

  function markReady(){root.dataset.state='ready';error.hidden=true;frame.focus({preventScroll:true});}
  function markError(){root.dataset.state='asset-error';error.hidden=false;}
  Promise.all([background.decode?background.decode():Promise.resolve(),sprite.decode?sprite.decode():Promise.resolve()]).then(()=>{if(!background.naturalWidth||!sprite.naturalWidth)throw new Error('missing required game asset');buildLeftGroundingMetrics();markReady();requestAnimationFrame(render);}).catch(markError);
})();
