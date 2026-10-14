import { keyboardIntent, cameraRelativeIntent } from './input.js';
import { createCharacterState, stepCharacter, jumpCharacter, LIBI_MOVEMENT_DEFAULTS } from './movement.js';
import { createLivingRoomWorld } from './world.js';
import { createScenario, applyScenarioToWorld } from './scenario.js';
import { createLivingRoomScene } from './scene.js';
import { createCharacterVisual, APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET } from './characters.js';
import { createCameraController, stepCamera } from './camera.js';
import { resolveCinematicOcclusion, applyCinematicOcclusion } from './cinematic-occlusion.js';
import { resolveInteraction, executeInteraction } from './interaction.js';
import { createDadController, stepDad } from './dad.js';
import { WORLD_ATTACK_DEFINITIONS, createWorldAttack, stepWorldAttack, attackHitsPlayer, dadForward } from './attacks.js';
import { createAttackVisualSystem } from './attack-visuals.js';
import { createSpatialAudioAdapter } from './audio.js';
import { createReactivePropController, triggerRoomReaction, stepRoomReactions } from './reactive-props.js';

function horizontalBasis(pose){
  const dx=pose.target.x-pose.position.x,dz=pose.target.z-pose.position.z;
  const length=Math.hypot(dx,dz)||1;
  const forward={x:dx/length,z:dz/length};
  return {forward,right:{x:-forward.z,z:forward.x}};
}

function scenarioRng(){
  const params=new URLSearchParams(globalThis.location?.search||'');
  return params.get('cinematic-seed')==='1' ? ()=>0.42 : Math.random;
}

function unionSets(...sets){
  const result=new Set();
  for(const set of sets)for(const value of set||[])result.add(value);
  return result;
}

function applyProjectedCharacter(visual,projected,facing,state,frame){
  visual.setPose({position:projected,facing,state});
  const scale=projected.scale||1;
  visual.mesh.scale.set((facing<0?-1:1)*scale,scale,scale);
  visual.setFrame(frame);
}

export async function createCrazyFamilyGame({ root, legacyAdapter }) {
  const doc = root.ownerDocument || document;
  const canvas = doc.createElement('canvas');
  canvas.className = 'movie-set-canvas';
  canvas.setAttribute('aria-label', 'המשפחה המשגעת — סלון קולנועי');
  canvas.width = 960;
  canvas.height = 600;
  const prompt=doc.createElement('div');
  prompt.className='movie-set-action-prompt';
  prompt.hidden=true;
  Object.assign(prompt.style,{position:'absolute',left:'50%',bottom:'18px',transform:'translateX(-50%)',padding:'9px 14px',borderRadius:'999px',background:'rgba(35,29,37,.88)',color:'#fff',fontWeight:'900',pointerEvents:'none',whiteSpace:'nowrap',zIndex:'5'});
  root.replaceChildren(canvas,prompt);

  const world = createLivingRoomWorld();
  // SCENARIO_SPAWNS_V041 — the house stays fixed; special items and Dad vary each run.
  const scenario=createScenario({world,rng:scenarioRng()});
  applyScenarioToWorld(world,scenario);
  const sceneHandle = await createLivingRoomScene({ canvas, world, visualMode:'cinematic' });
  const specialItemVisual=sceneHandle.objectsById.get(scenario.item.id);
  if(specialItemVisual){
    sceneHandle.projectObject(specialItemVisual,scenario.item.position,{scaleMultiplier:.8});
    specialItemVisual.rotation.y=scenario.item.rotationY||0;
    specialItemVisual.userData.scenarioSpawnId=scenario.item.spawnId;
    specialItemVisual.userData.logicalPosition={...scenario.item.position};
  }
  const sceneInteraction={setObjectVisible(id,value){const object=sceneHandle.objectsById.get(id)||sceneHandle.scene.getObjectByName(id);if(!object)return false;object.visible=Boolean(value);return true;}};
  const playerVisual = createCharacterVisual({ scene: sceneHandle.visualStage, kind: 'libi', approvedAssetUrl: APPROVED_LIBI_ASSET });
  const dadVisual = createCharacterVisual({ scene: sceneHandle.visualStage, kind: 'dad', approvedAssetUrl: APPROVED_DAD_ASSET });
  const attackVisuals=createAttackVisualSystem(sceneHandle.visualStage,{projectPosition:sceneHandle.projectWorld,screenStage:true});
  const reactions=createReactivePropController(world);
  const cameraController = createCameraController();
  const spatialAudio=createSpatialAudioAdapter({retainedAudio:{setDadSpatial:(state)=>legacyAdapter?.setDadSpatial?.(state)}});

  const keys = Object.create(null);
  let touchRun=false,touchCrouch=false;
  let player = createCharacterState({ position: { x: 0, y: 0, z: 3.55 }, ...LIBI_MOVEMENT_DEFAULTS });
  const dadController=createDadController({position:{...scenario.dad.position}});
  let dadFrame={position:{...dadController.position},velocity:{...dadController.velocity},facing:-1,state:'idle',cameraModeHint:'explore'};
  let cameraPose = stepCamera(cameraController,{player,dad:dadFrame,world,mode:'explore',dt:1,visualEnvelope:sceneHandle.visualEnvelope});
  let currentInteraction=null;
  let activeAttacks=[];
  let nextAttackAt=0,attackCursor=0,nearDadSince=0,nextPreAt=0,preIndex=0,wasSongPlaying=false;
  let pendingDadSongStart=false;
  let dadRunHeat=0,nextYawnAt=performance.now()+11000,nextSneezeAt=performance.now()+13500,lastDadState='idle',sneezeCount=0,lastStepAt=0;
  sceneHandle.applyCameraPose(cameraPose);

  const syncSize = () => {
    const rect = root.getBoundingClientRect?.() || { width: 960, height: 600 };
    const width = rect.width || 960;
    const height = rect.height || width * 0.625;
    sceneHandle.resize(width, height);
  };
  syncSize();
  globalThis.addEventListener?.('resize', syncSize);

  const onContextAction=(action,id)=>{
    if(action==='push'&&id==='toy-ball'){
      const ballDef=world.objects.find(object=>object.id==='toy-ball');
      if(ballDef){const dx=ballDef.x-player.position.x,dz=ballDef.z-player.position.z;triggerRoomReaction(reactions,'toy-kick',{id:'toy-ball',direction:{x:dx,z:dz}});}
    }
    if(action==='climb'&&id==='sofa')triggerRoomReaction(reactions,'sofa-compress');
    if(action==='open'&&id==='doorway'){
      prompt.textContent='המעבר לפינת האוכל מוכן לשלב הבא';prompt.hidden=false;
    }
  };

  const performInteraction=()=>{
    if(!currentInteraction)return false;
    const result=executeInteraction(currentInteraction,{legacyAdapter,world,scene:sceneInteraction,onAction:onContextAction});
    if(result.ok){currentInteraction=null;prompt.hidden=true;}
    return result.ok;
  };

  function retryPendingDadSongOnGesture(){
    if(!pendingDadSongStart)return false;
    if(legacyAdapter?.dadSongIsPlaying?.()){pendingDadSongStart=false;return true;}
    const started=legacyAdapter?.startDadSong?.();
    pendingDadSongStart=false;
    if(started)nextAttackAt=performance.now()+700;
    return Boolean(started);
  }

  const onKeyDown = (event) => {
    retryPendingDadSongOnGesture();
    keys[event.key] = true;
    keys[event.key.toLowerCase?.() || event.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault?.();
    if (event.key === ' ' && !event.repeat) player = jumpCharacter(player, 7.2);
    const lower=event.key.toLowerCase?.()||event.key;
    if((lower==='e'||event.key==='Enter')&&!event.repeat)performInteraction();
  };
  const onKeyUp = (event) => {
    keys[event.key] = false;
    keys[event.key.toLowerCase?.() || event.key] = false;
  };
  globalThis.addEventListener?.('keydown', onKeyDown);
  globalThis.addEventListener?.('keyup', onKeyUp);

  const controlCleanups=[];
  const bindHold=(button,onStart,onEnd)=>{
    if(!button)return;
    const down=(event)=>{event.preventDefault?.();retryPendingDadSongOnGesture();button.classList.add('pressed');onStart();button.setPointerCapture?.(event.pointerId);};
    const up=(event)=>{event.preventDefault?.();button.classList.remove('pressed');onEnd();};
    button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);
    controlCleanups.push(()=>{button.removeEventListener('pointerdown',down);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',up);button.removeEventListener('lostpointercapture',up);});
  };
  for(const button of doc.querySelectorAll('[data-key]')){
    const key=button.dataset.key;
    bindHold(button,()=>{keys[key]=true;},()=>{keys[key]=false;});
  }
  const runButton=doc.getElementById('run');
  bindHold(runButton,()=>{touchRun=true;},()=>{touchRun=false;});
  const jumpButton=doc.getElementById('jump');
  const jumpClick=(event)=>{event.preventDefault?.();retryPendingDadSongOnGesture();player=jumpCharacter(player,7.2);};
  jumpButton?.addEventListener('click',jumpClick);controlCleanups.push(()=>jumpButton?.removeEventListener('click',jumpClick));
  const crouchButton=doc.getElementById('crouch');
  bindHold(crouchButton,()=>{touchCrouch=true;},()=>{touchCrouch=false;});
  const itemButton=doc.getElementById('itemUse');
  const itemClick=(event)=>{event.preventDefault?.();retryPendingDadSongOnGesture();const snap=legacyAdapter?.getSnapshot?.()||{},inventory=snap.player?.inventory||[],selected=Number.isInteger(snap.player?.selected)?snap.player.selected:0,item=inventory[selected]||inventory[0];if(item)legacyAdapter?.useItem?.(item.id);};
  itemButton?.addEventListener('click',itemClick);controlCleanups.push(()=>itemButton?.removeEventListener('click',itemClick));
  const actionButton=doc.getElementById('action');
  const actionClick=(event)=>{retryPendingDadSongOnGesture();return performInteraction(event);};
  actionButton?.addEventListener('click',actionClick);controlCleanups.push(()=>actionButton?.removeEventListener('click',actionClick));
  const hangButton=doc.getElementById('hang');
  const hangClick=(event)=>{event.preventDefault?.();retryPendingDadSongOnGesture();prompt.textContent='✋ היתלות זמינה כשיש נקודת אחיזה בסביבה';prompt.hidden=false;};
  hangButton?.addEventListener('click',hangClick);controlCleanups.push(()=>hangButton?.removeEventListener('click',hangClick));

  let running = false;
  let raf = 0;
  let last = 0;
  let facing = 1;
  const frame = (now) => {
    if (!running) return;
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
    last = now;

    const retainedBefore=legacyAdapter?.getSnapshot?.() || {};
    const basis=horizontalBasis(cameraPose);
    const raw = keyboardIntent(keys);
    if(retainedBefore.controlsReversed){raw.x*=-1;raw.z*=-1;}
    const intent = cameraRelativeIntent(raw, basis.forward, basis.right);
    const crouching=Boolean(keys.c||keys.C||touchCrouch)&&player.grounded;
    const wantsSprint=Boolean(keys.Shift||keys.shift||touchRun)&&!crouching;
    const sprinting=wantsSprint&&(retainedBefore.player?.stamina??100)>0&&Math.hypot(intent.x,intent.z)>.01;
    const multiplier=(crouching?.58:(sprinting?1.58:1));
    const moveIntent={x:intent.x*multiplier,z:intent.z*multiplier};
    player = stepCharacter(player, moveIntent, dt, world);
    legacyAdapter?.updateStamina?.(sprinting,dt);
    if (Math.abs(player.velocity.x) > 0.05) facing = player.velocity.x < 0 ? -1 : 1;

    const playerSpeed=Math.hypot(player.velocity.x,player.velocity.z);
    if(player.grounded&&playerSpeed>.55&&now-lastStepAt>(crouching?470:(sprinting?220:300))){
      const surface=world.surfaceAt(player.position.x,player.position.z);
      spatialAudio.playSurfaceCue(surface?.kind||'wood');
      lastStepAt=now;
    }

    dadFrame=stepDad(dadController,{player,world,retainedState:retainedBefore,dt,now});
    const dadDistance=Math.hypot(player.position.x-dadFrame.position.x,player.position.z-dadFrame.position.z);

    let songPlaying=Boolean(legacyAdapter?.dadSongIsPlaying?.()||retainedBefore.dad?.singing);
    const dadMoving=Math.hypot(dadFrame.velocity.x,dadFrame.velocity.z)>.22;
    if(!songPlaying&&retainedBefore.dad?.state==='idle'&&dadMoving&&dadDistance<4.5)dadRunHeat+=dt;else dadRunHeat=Math.max(0,dadRunHeat-dt*.55);
    if(dadRunHeat>6.6&&retainedBefore.dad?.state==='idle'&&!songPlaying){legacyAdapter?.triggerDadHouseState?.('pant');dadRunHeat=0;}
    if(now>=nextSneezeAt&&retainedBefore.dad?.state==='idle'&&!songPlaying){legacyAdapter?.triggerDadHouseState?.('sneeze');nextSneezeAt=now+14000+Math.random()*8000;}
    if(now>=nextYawnAt&&retainedBefore.dad?.state==='idle'&&!songPlaying&&dadDistance>4.25){legacyAdapter?.triggerDadHouseState?.('yawn');nextYawnAt=now+15000+Math.random()*7000;}

    const retainedState=retainedBefore.dad?.state||'idle';
    if(retainedState!==lastDadState){
      if(retainedState==='pant')triggerRoomReaction(reactions,'dad-pant-near-furniture',{nearId:Math.hypot(dadFrame.position.x+3.35,dadFrame.position.z-.55)<2.4?'sofa':null});
      if(retainedState==='sneeze'){sneezeCount++;triggerRoomReaction(reactions,sneezeCount%4===0?'sneeze-mega':'sneeze-small');}
      lastDadState=retainedState;
    }

    if(!songPlaying&&dadDistance<4.2&&now>=nextPreAt){legacyAdapter?.playDadPre?.(preIndex++%9);nextPreAt=now+5200+Math.random()*2600;}
    if(!songPlaying&&dadDistance<2.75){
      if(!nearDadSince)nearDadSince=now;
      if(now-nearDadSince>2500){legacyAdapter?.startDadSong?.();pendingDadSongStart=!Boolean(legacyAdapter?.dadSongIsPlaying?.());nearDadSince=now+9000;nextAttackAt=now+750;}
    }else if(dadDistance>3.15){nearDadSince=0;}
    songPlaying=Boolean(legacyAdapter?.dadSongIsPlaying?.()||retainedBefore.dad?.singing);
    if(songPlaying)pendingDadSongStart=false;
    if(songPlaying&&!wasSongPlaying)nextAttackAt=now+700;
    if(songPlaying&&now>=nextAttackAt){
      const definition=WORLD_ATTACK_DEFINITIONS[attackCursor++%WORLD_ATTACK_DEFINITIONS.length];
      activeAttacks.push(createWorldAttack(definition,{x:dadFrame.position.x,y:1.05,z:dadFrame.position.z},dadForward(dadFrame.position,player.position),now));
      nextAttackAt=now+1050+Math.random()*550;
    }
    if(!songPlaying&&wasSongPlaying){nextPreAt=Math.max(nextPreAt,now+2800);activeAttacks=activeAttacks.filter(a=>a.travelled>.2&&!a.dead);}
    wasSongPlaying=songPlaying;

    const stepped=[];
    for(const attack of activeAttacks){
      let next=stepWorldAttack(attack,dt,world);
      if(!next.dead&&attackHitsPlayer(next,{position:player.position,radius:player.capsule.radius,height:crouching ? .58 : player.capsule.height,crouching})){
        legacyAdapter?.damagePlayer?.(next.damage,next.name);
        next={...next,dead:true};
      }
      if(!next.dead)stepped.push(next);
    }
    activeAttacks=stepped;
    attackVisuals.sync(activeAttacks);

    const exposure=legacyAdapter?.applyDadSongExposure?.(dadDistance,dt)||{};
    spatialAudio.update({listener:player.position,dad:dadFrame.position,roomRelation:'same'});
    stepRoomReactions(reactions,dt);
    sceneHandle.applyReactiveTransforms(reactions);

    const playerProjected=sceneHandle.projectWorld(player.position);
    const dadProjected=sceneHandle.projectWorld(dadFrame.position);
    const playerFrame=crouching?6:(player.grounded?(playerSpeed>.25?((Math.floor(now/(sprinting?115:160))%2)?1:2):0):5);
    applyProjectedCharacter(playerVisual,playerProjected,facing,player.grounded ? (crouching?'crouch':'ground') : 'jump',playerFrame);
    let dadFrameIndex=0;
    if(songPlaying)dadFrameIndex=(Math.floor(now/210)%2)?4:5;
    else if(dadFrame.state==='chase'&&dadMoving)dadFrameIndex=(Math.floor(now/170)%2)?1:2;
    else if(['pant','yawn','sneeze'].includes(dadFrame.state))dadFrameIndex=dadFrame.state==='sneeze'?6:0;
    applyProjectedCharacter(dadVisual,dadProjected,dadFrame.facing,songPlaying?'sing':dadFrame.state,dadFrameIndex);

    const playerSurface=world.surfaceAt(player.position.x,player.position.z)?.kind||'wood';
    const dadSurface=world.surfaceAt(dadFrame.position.x,dadFrame.position.z)?.kind||'wood';
    sceneHandle.contactEffects.syncActor('libi',{position:playerProjected,logicalHeight:player.position.y,grounded:player.grounded,surfaceKind:playerSurface,scale:playerProjected.scale});
    sceneHandle.contactEffects.syncActor('dad',{position:dadProjected,logicalHeight:0,grounded:true,surfaceKind:dadSurface,scale:dadProjected.scale*1.18});
    const itemInteractable=world.interactables.find(item=>item.id===scenario.item.id);
    const itemProjected=sceneHandle.projectWorld(scenario.item.position);
    sceneHandle.contactEffects.syncItem(scenario.item.id,{position:itemProjected,logicalHeight:0,visible:Boolean(itemInteractable?.enabled),scale:itemProjected.scale*.55,surfaceKind:world.surfaceAt(scenario.item.position.x,scenario.item.position.z)?.kind||'wood'});

    currentInteraction=resolveInteraction({player,interactables:world.interactables,maxDistance:1.15});
    if(currentInteraction){prompt.textContent=`✋ ${currentInteraction.label}`;prompt.hidden=false;}else{prompt.hidden=true;}

    const retainedAfter=legacyAdapter?.getSnapshot?.() || retainedBefore;
    const referenceGoal=doc.getElementById('referenceHeadphoneCount');
    if(referenceGoal){const inventory=retainedAfter.player?.inventory||[];referenceGoal.textContent=`${inventory.some(item=>item?.id==='headphones')?1:0}/1`; }
    const cameraMode=(songPlaying || dadFrame.cameraModeHint==='chase' || dadDistance<2.9)?'chase':'explore';
    cameraPose=stepCamera(cameraController,{player,dad:dadFrame,world,mode:cameraMode,dt,visualEnvelope:sceneHandle.visualEnvelope});
    sceneHandle.applyCameraPose(cameraPose,reactions.cameraShake,now);
    const cinematicOccluders=sceneHandle.cinematicSet?.occluders||[];
    const playerOcclusion=resolveCinematicOcclusion({camera:cameraPose.position,actor:player.position,occluders:cinematicOccluders});
    const dadOcclusion=resolveCinematicOcclusion({camera:cameraPose.position,actor:dadFrame.position,occluders:cinematicOccluders});
    applyCinematicOcclusion(sceneHandle.cinematicSet,unionSets(playerOcclusion,dadOcclusion));

    legacyAdapter?.setWorldPose?.({ player: player.position, dad: dadFrame.position, dadState:dadFrame.state, songPlaying, controlsReversed:Boolean(exposure.controlsReversed||retainedAfter.controlsReversed) });
    legacyAdapter?.setDadWorldDistance?.(dadDistance);
    legacyAdapter?.tickRetainedSystems?.(dt);
    sceneHandle.render();
    raf = requestAnimationFrame(frame);
  };

  return {
    canvas,world,scenario,scene:sceneHandle,cameraController,dadController,reactions,playerVisual,dadVisual,
    get player() { return player; },
    get dadFrame(){return {...dadFrame,position:{...dadFrame.position},velocity:{...dadFrame.velocity}};},
    get cameraPose(){return {position:{...cameraPose.position},target:{...cameraPose.target},fov:cameraPose.fov};},
    get attacks(){return activeAttacks.map(a=>({...a,position:{...a.position}}));},
    start() {if (running) return;running = true;raf = requestAnimationFrame(frame);},
    stop() {running = false;if (raf) cancelAnimationFrame(raf);raf = 0;},
    dispose() {
      this.stop();globalThis.removeEventListener?.('keydown', onKeyDown);globalThis.removeEventListener?.('keyup', onKeyUp);globalThis.removeEventListener?.('resize', syncSize);
      for(const cleanup of controlCleanups)cleanup();attackVisuals.dispose();playerVisual.dispose();dadVisual.dispose();sceneHandle.dispose();canvas.remove();prompt.remove();
    },
  };
}