import { keyboardIntent, cameraRelativeIntent } from './input.js';
import { createCharacterState, stepCharacter, jumpCharacter, LIBI_MOVEMENT_DEFAULTS } from './movement.js';
import { createLivingRoomWorld } from './world.js';
import { createLivingRoomScene } from './scene.js';
import { createCharacterVisual, APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET } from './characters.js';
import { createCameraController, stepCamera, chooseOccluders } from './camera.js';
import { resolveInteraction, executeInteraction } from './interaction.js';
import { createDadController, stepDad } from './dad.js';

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
  const cameraController = createCameraController();

  const keys = Object.create(null);
  let player = createCharacterState({ position: { x: 0, y: 0, z: 3.55 }, ...LIBI_MOVEMENT_DEFAULTS });
  const dadController=createDadController({position:{x:2.7,y:0,z:-0.35}});
  let dadFrame={position:{...dadController.position},velocity:{...dadController.velocity},facing:-1,state:'idle',cameraModeHint:'explore'};
  let cameraPose = stepCamera(cameraController,{player,dad:dadFrame,world,mode:'explore',dt:1});
  let currentInteraction=null;
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

    const basis=horizontalBasis(cameraPose);
    const raw = keyboardIntent(keys);
    const intent = cameraRelativeIntent(raw, basis.forward, basis.right);
    player = stepCharacter(player, intent, dt, world);
    if (Math.abs(player.velocity.x) > 0.05) facing = player.velocity.x < 0 ? -1 : 1;

    const retained=legacyAdapter?.getSnapshot?.() || {};
    dadFrame=stepDad(dadController,{player,world,retainedState:retained,dt,now});

    playerVisual.setPose({ position: player.position, facing, state: player.grounded ? 'ground' : 'jump' });
    dadVisual.setPose({ position: dadFrame.position, facing: dadFrame.facing, state: dadFrame.state });
    const dadMoving=Math.hypot(dadFrame.velocity.x,dadFrame.velocity.z)>.18;
    if(dadFrame.state==='chase'&&dadMoving)dadVisual.setFrame((Math.floor(now/170)%2)?1:2);
    else if(['pant','yawn','sneeze'].includes(dadFrame.state))dadVisual.setFrame(dadFrame.state==='sneeze'?6:0);
    else dadVisual.setFrame(0);

    currentInteraction=resolveInteraction({player,interactables:world.interactables,maxDistance:1.15});
    if(currentInteraction){prompt.textContent=`✋ ${currentInteraction.label}`;prompt.hidden=false;}else{prompt.hidden=true;}

    const dadDistance=Math.hypot(player.position.x-dadFrame.position.x,player.position.z-dadFrame.position.z);
    const cameraMode=(retained.dad?.singing || dadFrame.cameraModeHint==='chase' || dadDistance<2.9)?'chase':'explore';
    cameraPose=stepCamera(cameraController,{player,dad:dadFrame,world,mode:cameraMode,dt});
    const camera=sceneHandle.applyCameraPose(cameraPose);
    const occluders=chooseOccluders({camera:cameraPose.position,target:cameraPose.target,occluders:world.occluders});
    sceneHandle.setOccluders(occluders);
    playerVisual.faceCamera(camera.position);
    dadVisual.faceCamera(camera.position);

    legacyAdapter?.setWorldPose?.({ player: player.position, dad: dadFrame.position, dadState:dadFrame.state });
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
      playerVisual.dispose();
      dadVisual.dispose();
      sceneHandle.dispose();
      canvas.remove();
      prompt.remove();
    },
  };
}
