import { keyboardIntent, cameraRelativeIntent } from './input.js';
import { createCharacterState, stepCharacter, jumpCharacter, LIBI_MOVEMENT_DEFAULTS } from './movement.js';
import { createLivingRoomWorld } from './world.js';
import { createLivingRoomScene } from './scene.js';
import { createCharacterVisual, APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET } from './characters.js';
import { createCameraController, stepCamera, chooseOccluders } from './camera.js';
import { resolveInteraction, executeInteraction } from './interaction.js';
import { createDadController, stepDad } from './dad.js';
import { WORLD_ATTACK_DEFINITIONS, createWorldAttack, stepWorldAttack, attackHitsPlayer, dadForward } from './attacks.js';
import { createAttackVisualSystem } from './attack-visuals.js';
import { createSpatialAudioAdapter } from './audio.js';

function horizontalBasis(pose){
  const dx=pose.target.x-pose.position.x,dz=pose.target.z-pose.position.z;
  const length=Math.hypot(dx,dz)||1;
  const forward={x:dx/length,z:dz/length};
  return {forward,right:{x:-forward.z,z:forward.x}};
}

export async function createCrazyFamilyGame({ root, legacyAdapter }) {
  const doc = root.ownerDocument || document;
  const canvas = doc.createElement('canvas');
  canvas.className = 'movie-set-canvas';
  canvas.setAttribute('aria-label', 'המשפחה המשגעת — סלון תלת־ממדי');
  canvas.width = 960;
  canvas.height = 600;
  const prompt=doc.createElement('div');
  prompt.className='movie-set-action-prompt';
  prompt.hidden=true;
  Object.assign(prompt.style,{position:'absolute',left:'50%',bottom:'18px',transform:'translateX(-50%)',padding:'9px 14px',borderRadius:'999px',background:'rgba(35,29,37,.88)',color:'#fff',fontWeight:'900',pointerEvents:'none',whiteSpace:'nowrap',zIndex:'5'});
  root.replaceChildren(canvas,prompt);

  const world = createLivingRoomWorld();
  const sceneHandle = createLivingRoomScene({ canvas, world });
  const sceneInteraction={setObjectVisible(id,value){const object=sceneHandle.objectsById.get(id)||sceneHandle.scene.getObjectByName(id);if(!object)return false;object.visible=Boolean(value);return true;}};
  const playerVisual = createCharacterVisual({ scene: sceneHandle.scene, kind: 'libi', approvedAssetUrl: APPROVED_LIBI_ASSET });
  const dadVisual = createCharacterVisual({ scene: sceneHandle.scene, kind: 'dad', approvedAssetUrl: APPROVED_DAD_ASSET });
  const attackVisuals=createAttackVisualSystem(sceneHandle.scene);
  const cameraController = createCameraController();
  const spatialAudio=createSpatialAudioAdapter({retainedAudio:{setDadSpatial:(state)=>legacyAdapter?.setDadSpatial?.(state)}});

  const keys = Object.create(null);
  let player = createCharacterState({ position: { x: 0, y: 0, z: 3.55 }, ...LIBI_MOVEMENT_DEFAULTS });
  const dadController=createDadController({position:{x:2.7,y:0,z:-0.35}});
  let dadFrame={position:{...dadController.position},velocity:{...dadController.velocity},facing:-1,state:'idle',cameraModeHint:'explore'};
  let cameraPose = stepCamera(cameraController,{player,dad:dadFrame,world,mode:'explore',dt:1});
  let currentInteraction=null;
  let activeAttacks=[];
  let nextAttackAt=0,attackCursor=0,nearDadSince=0,nextPreAt=0,preIndex=0,wasSongPlaying=false;
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
      const ball=sceneHandle.objectsById.get('toy-ball');
      if(ball){const dx=ball.position.x-player.position.x,dz=ball.position.z-player.position.z,len=Math.hypot(dx,dz)||1;ball.position.x+=dx/len*.55;ball.position.z+=dz/len*.55;}
    }
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

  const onKeyDown = (event) => {
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
  const actionButton=doc.getElementById('action');
  actionButton?.addEventListener('click',performInteraction);

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
    const crouching=Boolean(keys.c||keys.C)&&player.grounded;
    const moveIntent=crouching?{x:intent.x*.58,z:intent.z*.58}:intent;
    player = stepCharacter(player, moveIntent, dt, world);
    if (Math.abs(player.velocity.x) > 0.05) facing = player.velocity.x < 0 ? -1 : 1;

    dadFrame=stepDad(dadController,{player,world,retainedState:retainedBefore,dt,now});
    const dadDistance=Math.hypot(player.position.x-dadFrame.position.x,player.position.z-dadFrame.position.z);

    let songPlaying=Boolean(legacyAdapter?.dadSongIsPlaying?.()||retainedBefore.dad?.singing);
    if(!songPlaying&&dadDistance<4.2&&now>=nextPreAt){legacyAdapter?.playDadPre?.(preIndex++%9);nextPreAt=now+5200+Math.random()*2600;}
    if(!songPlaying&&dadDistance<2.75){
      if(!nearDadSince)nearDadSince=now;
      if(now-nearDadSince>2500){legacyAdapter?.startDadSong?.();nearDadSince=now+9000;nextAttackAt=now+750;}
    }else if(dadDistance>3.15){nearDadSince=0;}
    songPlaying=Boolean(legacyAdapter?.dadSongIsPlaying?.()||retainedBefore.dad?.singing);
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
      if(!next.dead&&attackHitsPlayer(next,{position:player.position,radius:player.capsule.radius,height:crouching?.58:player.capsule.height,crouching})){
        legacyAdapter?.damagePlayer?.(next.damage,next.name);
        next={...next,dead:true};
      }
      if(!next.dead)stepped.push(next);
    }
    activeAttacks=stepped;
    attackVisuals.sync(activeAttacks);

    const exposure=legacyAdapter?.applyDadSongExposure?.(dadDistance,dt)||{};
    spatialAudio.update({listener:player.position,dad:dadFrame.position,roomRelation:'same'});

    playerVisual.setPose({ position: player.position, facing, state: player.grounded ? (crouching?'crouch':'ground') : 'jump' });
    playerVisual.setFrame(crouching?6:(player.grounded?(Math.hypot(player.velocity.x,player.velocity.z)>.25?((Math.floor(now/160)%2)?1:2):0):5));
    dadVisual.setPose({ position: dadFrame.position, facing: dadFrame.facing, state: songPlaying?'sing':dadFrame.state });
    const dadMoving=Math.hypot(dadFrame.velocity.x,dadFrame.velocity.z)>.18;
    if(songPlaying)dadVisual.setFrame((Math.floor(now/210)%2)?4:5);
    else if(dadFrame.state==='chase'&&dadMoving)dadVisual.setFrame((Math.floor(now/170)%2)?1:2);
    else if(['pant','yawn','sneeze'].includes(dadFrame.state))dadVisual.setFrame(dadFrame.state==='sneeze'?6:0);
    else dadVisual.setFrame(0);

    currentInteraction=resolveInteraction({player,interactables:world.interactables,maxDistance:1.15});
    if(currentInteraction){prompt.textContent=`✋ ${currentInteraction.label}`;prompt.hidden=false;}else{prompt.hidden=true;}

    const retainedAfter=legacyAdapter?.getSnapshot?.() || retainedBefore;
    const cameraMode=(songPlaying || dadFrame.cameraModeHint==='chase' || dadDistance<2.9)?'chase':'explore';
    cameraPose=stepCamera(cameraController,{player,dad:dadFrame,world,mode:cameraMode,dt});
    const camera=sceneHandle.applyCameraPose(cameraPose);
    const occluders=chooseOccluders({camera:cameraPose.position,target:cameraPose.target,occluders:world.occluders});
    sceneHandle.setOccluders(occluders);
    playerVisual.faceCamera(camera.position);
    dadVisual.faceCamera(camera.position);

    legacyAdapter?.setWorldPose?.({ player: player.position, dad: dadFrame.position, dadState:dadFrame.state, songPlaying, controlsReversed:Boolean(exposure.controlsReversed||retainedAfter.controlsReversed) });
    legacyAdapter?.setDadWorldDistance?.(dadDistance);
    legacyAdapter?.tickRetainedSystems?.(dt);
    sceneHandle.render(camera);
    raf = requestAnimationFrame(frame);
  };

  return {
    canvas,
    world,
    scene: sceneHandle,
    cameraController,
    dadController,
    get player() { return player; },
    get attacks(){return activeAttacks.map(a=>({...a,position:{...a.position}}));},
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    dispose() {
      this.stop();
      globalThis.removeEventListener?.('keydown', onKeyDown);
      globalThis.removeEventListener?.('keyup', onKeyUp);
      globalThis.removeEventListener?.('resize', syncSize);
      actionButton?.removeEventListener('click',performInteraction);
      attackVisuals.dispose();
      playerVisual.dispose();
      dadVisual.dispose();
      sceneHandle.dispose();
      canvas.remove();
      prompt.remove();
    },
  };
}
