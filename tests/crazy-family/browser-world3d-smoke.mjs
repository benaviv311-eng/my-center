import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
await page.route('**/*.mp3',route=>route.abort());

async function moveKey(key,start,minimum=.18){
  await page.keyboard.down(key);
  try{
    await page.waitForFunction(({x,z,minimum})=>{
      const p=window.__crazyFamilyMovieSetGame?.player?.position;
      return p&&Math.hypot(p.x-x,p.z-z)>minimum;
    },{x:start.x,z:start.z,minimum},{timeout:5000});
  }finally{await page.keyboard.up(key);}
  return page.evaluate(()=>({...window.__crazyFamilyMovieSetGame.player.position}));
}

try{
  await page.goto('http://127.0.0.1:8000/crazy-family.html?renderer=3d&cinematic-seed=1',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.__crazyFamilyMovieSetGame?.scene?.renderer),null,{timeout:30000});
  await page.waitForFunction(()=>window.__crazyFamilyMovieSetGame?.scene?.visualMode==='world3d',null,{timeout:15000});

  const initial=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame;
    return {
      rendererMode:game.rendererMode,
      visualMode:game.scene.visualMode,
      screenStage:game.scene.screenStage,
      perspective:Boolean(game.scene.camera.isPerspectiveCamera),
      contextLost:game.scene.renderer.getContext().isContextLost(),
      objectIds:[...game.scene.objectsById.keys()],
      player:{...game.player.position},
      playerMesh:{x:game.playerVisual.mesh.position.x,y:game.playerVisual.mesh.position.y,z:game.playerVisual.mesh.position.z,sx:game.playerVisual.mesh.scale.x,sy:game.playerVisual.mesh.scale.y,sz:game.playerVisual.mesh.scale.z},
      libiAsset:game.playerVisual.approvedAssetUrl,
      dadAsset:game.dadVisual.approvedAssetUrl,
      yaw:game.cameraController.yaw,
    };
  });
  assert.equal(initial.rendererMode,'world3d');
  assert.equal(initial.visualMode,'world3d');
  assert.equal(initial.screenStage,false);
  assert.equal(initial.perspective,true);
  assert.equal(initial.contextLost,false);
  for(const id of ['floor','wall-north','wall-south','wall-east','wall-west','sofa','coffee-table','rug','side-table','doorway'])assert.ok(initial.objectIds.includes(id),`missing 3d object ${id}`);
  assert.equal(initial.libiAsset,'assets/libi-sprites-v025.png');
  assert.equal(initial.dadAsset,'assets/crazy-family/dad-sprites-v028.png');
  assert.ok(Math.abs(initial.playerMesh.x-initial.player.x)<.02&&Math.abs(initial.playerMesh.z-initial.player.z)<.02,'Libi visual is not in logical world space');
  assert.ok(Math.abs(Math.abs(initial.playerMesh.sx)-1)<1e-6&&Math.abs(initial.playerMesh.sy-1)<1e-6&&Math.abs(initial.playerMesh.sz-1)<1e-6,'world3d character scale should be unit scale');

  const movedRight=await moveKey('ArrowRight',initial.player);
  const movedUp=await moveKey('ArrowUp',movedRight);
  assert.ok(Math.hypot(movedRight.x-initial.player.x,movedRight.z-initial.player.z)>.18,'world3d horizontal movement failed');
  assert.ok(Math.hypot(movedUp.x-movedRight.x,movedUp.z-movedRight.z)>.18,'world3d forward movement failed');

  const canvas=page.locator('#movieSetRoot .movie-set-canvas');
  const box=await canvas.boundingBox();
  assert.ok(box&&box.width>500&&box.height>300,'world3d canvas is not laid out at gameplay size');
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.65,box.y+box.height*.42,{steps:5});
  await page.mouse.up();
  await page.waitForFunction(yaw=>Math.abs(window.__crazyFamilyMovieSetGame.cameraController.yaw-yaw)>.01,initial.yaw,{timeout:4000});

  const circulation=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame,world=game.world,capsule=game.player.capsule;
    const blockers=world.colliders.filter(c=>['sofa','coffee-table','side-table'].includes(c.id));
    const inside=(p,c)=>p.x>c.x-c.width/2-capsule.radius&&p.x<c.x+c.width/2+capsule.radius&&p.z>c.z-c.depth/2-capsule.radius&&p.z<c.z+c.depth/2+capsule.radius;
    const targets=[{x:2.3,y:0,z:-1.5},{x:-5.65,y:0,z:-1.5},{x:-5.65,y:0,z:2},{x:2.3,y:0,z:2},{x:2.3,y:0,z:2.5}];
    let p={x:2.3,y:0,z:2.5},minimumClearance=Infinity;
    for(const target of targets){
      let reached=false;
      for(let i=0;i<5000;i++){
        const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
        if(d<.065){reached=true;break;}
        const step=Math.min(.08,d),desired={x:p.x+dx/d*step,y:0,z:p.z+dz/d*step};
        const next=world.resolveCharacterMove(p,desired,capsule);
        for(const collider of blockers){
          if(inside(next,collider))return {ok:false,reason:`entered ${collider.id}`,point:next};
          const clearX=Math.max(Math.abs(next.x-collider.x)-(collider.width/2+capsule.radius),0);
          const clearZ=Math.max(Math.abs(next.z-collider.z)-(collider.depth/2+capsule.radius),0);
          minimumClearance=Math.min(minimumClearance,Math.hypot(clearX,clearZ));
        }
        if(Math.hypot(next.x-p.x,next.z-p.z)<1e-6)return {ok:false,reason:`stuck before ${JSON.stringify(target)}`,point:next};
        p=next;
      }
      if(!reached)return {ok:false,reason:`missed ${JSON.stringify(target)}`,point:p};
    }
    return {ok:true,point:p,minimumClearance};
  });
  assert.equal(circulation.ok,true,circulation.reason||JSON.stringify(circulation));

  const wallCamera=await page.evaluate(async()=>{
    const game=window.__crazyFamilyMovieSetGame;
    const {createCameraController,stepCamera}=await import('./crazy-family/camera.js');
    const controller=createCameraController({yaw:0,pitch:0});
    const player={position:{x:0,y:0,z:4.1}};
    const pose=stepCamera(controller,{player,world:game.world,mode:'explore',dt:1,rig:'third-person'});
    const wall=game.world.roomShell.find(entry=>entry.id==='wall-south');
    const paddedInterior=wall.z-wall.depth/2-controller.config.collisionRadius;
    return {pose,paddedInterior};
  });
  assert.ok(Number.isFinite(wallCamera.pose.position.z));
  assert.ok(wallCamera.pose.position.z<=wallCamera.paddedInterior+.03,`camera crossed padded south wall: ${JSON.stringify(wallCamera)}`);

  await page.setViewportSize({width:720,height:900});
  await page.waitForTimeout(120);
  const resized=await page.evaluate(()=>({aspect:window.__crazyFamilyMovieSetGame.scene.camera.aspect,visible:window.__crazyFamilyMovieSetGame.playerVisual.mesh.visible,contextLost:window.__crazyFamilyMovieSetGame.scene.renderer.getContext().isContextLost()}));
  assert.ok(Number.isFinite(resized.aspect)&&resized.aspect>0);
  assert.equal(resized.visible,true);
  assert.equal(resized.contextLost,false);

  await fs.mkdir('artifacts',{recursive:true});
  await page.locator('.stage').screenshot({path:'artifacts/crazy-family-world3d-milestone-a.png'});
  const fatalErrors=pageErrors.filter(message=>!/play\(\) request was interrupted|AbortError|media/i.test(message));
  assert.deepEqual(fatalErrors,[],`browser page errors: ${fatalErrors.join(' | ')}`);
  console.log('PASS: Crazy Family world3d graybox rendered, moved, orbited, circulated around furniture, respected camera walls, and resized');
}finally{await browser.close();}
