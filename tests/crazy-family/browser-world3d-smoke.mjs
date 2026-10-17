import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));await page.route('**/*.mp3',route=>route.abort());

const near=(a,b,epsilon=1e-6)=>Math.abs(a-b)<=epsilon;
const poseNear=(a,b,epsilon=1e-6)=>near(a.position.x,b.position.x,epsilon)&&near(a.position.y,b.position.y,epsilon)&&near(a.position.z,b.position.z,epsilon)&&near(a.target.x,b.target.x,epsilon)&&near(a.target.y,b.target.y,epsilon)&&near(a.target.z,b.target.z,epsilon)&&near(a.fov,b.fov,epsilon);

async function moveKey(key,start,minimum=.16){
  await page.keyboard.down(key);
  try{await page.waitForFunction(({x,z,minimum})=>{const p=window.__crazyFamilyMovieSetGame?.player?.position;return p&&Math.hypot(p.x-x,p.z-z)>minimum;},{x:start.x,z:start.z,minimum},{timeout:5000});}
  finally{await page.keyboard.up(key);}
  return page.evaluate(()=>({...window.__crazyFamilyMovieSetGame.player.position}));
}

async function driveKey(key,start,minimum=.12){
  await page.keyboard.down(key);
  try{await page.waitForFunction(({x,z,minimum})=>{const p=window.__crazyFamilyMovieSetGame?.player?.position;return p&&Math.hypot(p.x-x,p.z-z)>=minimum;},{x:start.x,z:start.z,minimum},{timeout:5000});}
  finally{await page.keyboard.up(key);}
  return page.evaluate(()=>({...window.__crazyFamilyMovieSetGame.player.position}));
}

async function walkTo(target,{tolerance=.45,maxSteps=90}={}){
  let lastNav=null;
  for(let step=0;step<maxSteps;step++){
    const nav=await page.evaluate(({target,tolerance})=>{
      const game=window.__crazyFamilyMovieSetGame,p=game.player.position,pose=game.cameraPose;
      game.player.velocity.x=0;game.player.velocity.z=0;
      game.dadController.position.x=5.35;game.dadController.position.z=-4;game.dadController.velocity.x=0;game.dadController.velocity.z=0;game.dadController.path=[];game.dadController.pathIndex=0;
      const dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz);
      const inside=game.world.colliders.some(c=>Math.abs(p.x-c.x)<c.width/2+game.player.capsule.radius-.01&&Math.abs(p.z-c.z)<c.depth/2+game.player.capsule.radius-.01);
      if(dist<=tolerance)return{done:true,inside,dist,position:{x:p.x,z:p.z}};
      const fl=Math.hypot(pose.target.x-pose.position.x,pose.target.z-pose.position.z)||1;
      const forward={x:(pose.target.x-pose.position.x)/fl,z:(pose.target.z-pose.position.z)/fl};
      const right={x:-forward.z,z:forward.x};const dl=dist||1,desired={x:dx/dl,z:dz/dl};
      const choices=[['ArrowUp',forward],['ArrowDown',{x:-forward.x,z:-forward.z}],['ArrowRight',right],['ArrowLeft',{x:-right.x,z:-right.z}]];
      choices.sort((a,b)=>(b[1].x*desired.x+b[1].z*desired.z)-(a[1].x*desired.x+a[1].z*desired.z));
      return{done:false,inside,dist,key:choices[0][0],position:{x:p.x,z:p.z}};
    },{target,tolerance});
    lastNav=nav;assert.equal(nav.inside,false,`player entered furniture while routing to ${JSON.stringify(target)} at ${JSON.stringify(nav.position)}`);
    if(nav.done)return nav.position;await driveKey(nav.key,nav.position);
  }
  assert.fail(`could not reach ${JSON.stringify(target)}; diagnostics=${JSON.stringify(lastNav)}`);
}

try{
  await page.goto('http://127.0.0.1:8000/crazy-family.html?movie-set-smoke=1&cinematic-seed=1&renderer=3d',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.__crazyFamilyMovieSetGame?.scene?.renderer),null,{timeout:30000});
  await page.waitForSelector('#movieSetRoot .movie-set-canvas',{state:'visible',timeout:10000});

  const initial=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame,libiTypes=[],dadTypes=[];
    const meshCount=root=>{let count=0;root?.traverse(node=>{if(node.isMesh)count++;});return count;};
    game.playerVisual.root.traverse(node=>{if(node.isMesh)libiTypes.push(node.geometry?.type||'');});
    game.dadVisual.root.traverse(node=>{if(node.isMesh)dadTypes.push(node.geometry?.type||'');});
    const sofa=game.scene.objectsById.get('sofa'),coffee=game.scene.objectsById.get('coffee-table'),side=game.scene.objectsById.get('side-table'),lamp=game.scene.objectsById.get('lamp'),doorway=game.scene.objectsById.get('doorway');
    const artRoot=game.scene.scene.getObjectByName('living-room-final-art'),dressing=game.scene.scene.getObjectByName('living-room-dressing');
    const key=game.scene.scene.getObjectByName('living-room-key'),lampLight=game.scene.scene.getObjectByName('living-room-lamp-light');
    return {
      rendererMode:game.rendererMode,visualMode:game.scene.visualMode,screenStage:game.scene.screenStage,
      perspective:Boolean(game.scene.camera.isPerspectiveCamera),orthographic:Boolean(game.scene.camera.isOrthographicCamera),
      player:{...game.player.position},camera:game.cameraPose,
      libi:{mode:game.playerVisual.root.userData.renderMode,height:game.playerVisual.root.userData.height,types:libiTypes,rotationY:game.playerVisual.root.rotation.y,visible:game.playerVisual.root.visible},
      dad:{mode:game.dadVisual.root.userData.renderMode,height:game.dadVisual.root.userData.height,types:dadTypes,visible:game.dadVisual.root.visible},
      art:{mode:artRoot?.userData?.artMode,sofaMode:sofa?.userData?.artMode,sofaMeshes:meshCount(sofa),coffeeMeshes:meshCount(coffee),sideMeshes:meshCount(side),lampMeshes:meshCount(lamp),doorwayMeshes:meshCount(doorway),dressingCount:dressing?.children?.length||0},
      lighting:{key:Boolean(key?.isDirectionalLight),keyShadow:Boolean(key?.castShadow),lamp:Boolean(lampLight?.isPointLight),lampShadow:Boolean(lampLight?.castShadow)},
      scenarioItem:{...game.scenario.item.position,id:game.scenario.item.id,visible:game.scene.objectsById.get(game.scenario.item.id)?.visible},
      contextLost:game.scene.renderer.getContext().isContextLost(),
    };
  });
  assert.equal(initial.rendererMode,'world3d');assert.equal(initial.visualMode,'world3d');assert.equal(initial.screenStage,false);assert.equal(initial.perspective,true);assert.equal(initial.orthographic,false);assert.equal(initial.contextLost,false);
  assert.equal(initial.libi.mode,'volumetric-3d');assert.equal(initial.dad.mode,'volumetric-3d');assert.ok(initial.dad.height>initial.libi.height);assert.equal(initial.libi.visible,true);assert.equal(initial.dad.visible,true);
  assert.ok(initial.libi.types.length>8&&initial.dad.types.length>6);assert.equal(initial.libi.types.includes('PlaneGeometry'),false);assert.equal(initial.dad.types.includes('PlaneGeometry'),false);
  assert.equal(initial.art.mode,'stylized-final-v1');assert.equal(initial.art.sofaMode,'stylized-final-v1');assert.ok(initial.art.sofaMeshes>=10);assert.ok(initial.art.coffeeMeshes>=3);assert.ok(initial.art.sideMeshes>=3);assert.ok(initial.art.lampMeshes>=4);assert.ok(initial.art.doorwayMeshes>=3);assert.ok(initial.art.dressingCount>=3);
  assert.deepEqual(initial.lighting,{key:true,keyShadow:true,lamp:true,lampShadow:false});assert.equal(initial.scenarioItem.visible,true);
  assert.deepEqual(initial.camera.position,{x:7.2,y:11.5,z:8});assert.deepEqual(initial.camera.target,{x:0,y:.45,z:0});assert.equal(initial.camera.fov,48);

  const movedRight=await moveKey('ArrowRight',initial.player);await page.waitForTimeout(180);
  const afterRight=await page.evaluate(()=>window.__crazyFamilyMovieSetGame.playerVisual.root.rotation.y);
  assert.ok(Math.abs(afterRight-initial.libi.rotationY)>.03,'3d Libi did not rotate in world space');
  const movedUp=await moveKey('ArrowUp',movedRight);await page.waitForTimeout(180);
  assert.ok(Math.hypot(movedRight.x-initial.player.x,movedRight.z-initial.player.z)>.16);assert.ok(Math.hypot(movedUp.x-movedRight.x,movedUp.z-movedRight.z)>.16);
  const afterMove=await page.evaluate(()=>window.__crazyFamilyMovieSetGame.cameraPose);
  assert.equal(poseNear(initial.camera,afterMove),true,'camera moved while Libi moved');

  await page.keyboard.press('Space');await page.waitForFunction(()=>{const g=window.__crazyFamilyMovieSetGame;return g.player.position.y>.08&&g.playerVisual.root.position.y>.05;},null,{timeout:3000});
  await page.waitForFunction(()=>Math.abs(window.__crazyFamilyMovieSetGame.player.position.y)<.02,null,{timeout:15000});

  await walkTo({x:2,z:-1.25});await walkTo({x:-4.7,z:-1.25});await walkTo({x:1.8,z:2.4});
  const routed=await page.evaluate(()=>{const g=window.__crazyFamilyMovieSetGame,p=g.player.position;return{position:{x:p.x,z:p.z},inside:g.world.colliders.some(c=>Math.abs(p.x-c.x)<c.width/2+g.player.capsule.radius-.01&&Math.abs(p.z-c.z)<c.depth/2+g.player.capsule.radius-.01),camera:g.cameraPose};});
  assert.equal(routed.inside,false);assert.ok(Math.hypot(routed.position.x-1.8,routed.position.z-2.4)<.7);assert.equal(poseNear(initial.camera,routed.camera),true,'camera changed while routing around furniture');

  const canvas=page.locator('#movieSetRoot .movie-set-canvas'),box=await canvas.boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.72,box.y+box.height*.35,{steps:8});await page.mouse.up();await page.waitForTimeout(120);
  const afterPointer=await page.evaluate(()=>window.__crazyFamilyMovieSetGame.cameraPose);assert.equal(poseNear(initial.camera,afterPointer),true,'pointer drag changed fixed overhead camera');

  const collision=await page.evaluate(()=>{const g=window.__crazyFamilyMovieSetGame,w=g.world,sofa=w.colliders.find(o=>o.id==='sofa');const from={x:-1.6,y:0,z:2},to={x:-4,y:0,z:.55},r=w.resolveCharacterMove(from,to,{radius:.32});return{inside:Math.abs(r.x-sofa.x)<sofa.width/2+.32&&Math.abs(r.z-sofa.z)<sofa.depth/2+.32};});assert.equal(collision.inside,false);

  await fs.mkdir('artifacts',{recursive:true});await page.locator('.stage').screenshot({path:'artifacts/crazy-family-living-room-final-art-v1.png'});

  await page.evaluate(()=>{const game=window.__crazyFamilyMovieSetGame,p=game.player.position,item=game.scenario.item.position;p.x=item.x;p.y=0;p.z=item.z-.65;game.player.velocity.x=0;game.player.velocity.z=0;game.dadController.position.x=5.35;game.dadController.position.z=-4;});
  await page.waitForFunction(()=>Boolean(document.querySelector('.movie-set-action-prompt:not([hidden])')),null,{timeout:5000});
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>{const game=window.__crazyFamilyMovieSetGame;return game.world.interactables.find(entry=>entry.id===game.scenario.item.id)?.enabled===false;},null,{timeout:5000});
  const collected=await page.evaluate(()=>{const game=window.__crazyFamilyMovieSetGame;return{enabled:game.world.interactables.find(entry=>entry.id===game.scenario.item.id)?.enabled,visible:game.scene.objectsById.get(game.scenario.item.id)?.visible};});
  assert.deepEqual(collected,{enabled:false,visible:false},'scenario headphones must still collect and disappear with final art');

  await page.setViewportSize({width:430,height:820});await page.waitForTimeout(180);
  const narrow=await page.evaluate(()=>({pose:window.__crazyFamilyMovieSetGame.cameraPose,aspect:window.__crazyFamilyMovieSetGame.scene.camera.aspect,visible:window.__crazyFamilyMovieSetGame.playerVisual.root.visible,contextLost:window.__crazyFamilyMovieSetGame.scene.renderer.getContext().isContextLost()}));
  const baseDistance=Math.hypot(initial.camera.position.x,initial.camera.position.y-.45,initial.camera.position.z),narrowDistance=Math.hypot(narrow.pose.position.x,narrow.pose.position.y-.45,narrow.pose.position.z);
  assert.ok(Number.isFinite(narrow.aspect)&&narrow.aspect>0);assert.equal(narrow.visible,true);assert.equal(narrow.contextLost,false);assert.deepEqual(narrow.pose.target,initial.camera.target);assert.equal(narrow.pose.fov,48);
  assert.ok(narrowDistance>baseDistance&&narrowDistance<=baseDistance*1.45+1e-6);

  const fatal=pageErrors.filter(message=>!/play\(\) request was interrupted|AbortError|media/i.test(message));assert.deepEqual(fatal,[],`browser page errors: ${fatal.join(' | ')}`);
  console.log('PASS: Living Room Final Art v1 rendered stylized multi-part furniture and fixed lighting while preserving volumetric actors, interaction, movement, jump, collision, fixed camera and portrait resize');
}finally{await browser.close();}
