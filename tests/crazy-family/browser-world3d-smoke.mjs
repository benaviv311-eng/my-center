import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));await page.route('**/*.mp3',route=>route.abort());

async function moveKey(key,start,minimum=.16){
  await page.keyboard.down(key);
  try{await page.waitForFunction(({x,z,minimum})=>{const p=window.__crazyFamilyMovieSetGame?.player?.position;return p&&Math.hypot(p.x-x,p.z-z)>minimum;},{x:start.x,z:start.z,minimum},{timeout:5000});}
  finally{await page.keyboard.up(key);}
  return page.evaluate(()=>({...window.__crazyFamilyMovieSetGame.player.position}));
}

try{
  await page.goto('http://127.0.0.1:8000/crazy-family.html?movie-set-smoke=1&cinematic-seed=1&renderer=3d',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.__crazyFamilyMovieSetGame?.scene?.renderer),null,{timeout:30000});
  await page.waitForSelector('#movieSetRoot .movie-set-canvas',{state:'visible',timeout:10000});

  const initial=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame;
    return {
      rendererMode:game.rendererMode,
      visualMode:game.scene.visualMode,
      screenStage:game.scene.screenStage,
      perspective:Boolean(game.scene.camera.isPerspectiveCamera),
      orthographic:Boolean(game.scene.camera.isOrthographicCamera),
      player:{...game.player.position},
      camera:{position:{...game.cameraPose.position},target:{...game.cameraPose.target},fov:game.cameraPose.fov},
      objectIds:[...game.scene.objectsById.keys()],
      libiScale:{x:game.playerVisual.mesh.scale.x,y:game.playerVisual.mesh.scale.y,z:game.playerVisual.mesh.scale.z},
      dadScale:{x:game.dadVisual.mesh.scale.x,y:game.dadVisual.mesh.scale.y,z:game.dadVisual.mesh.scale.z},
      contextLost:game.scene.renderer.getContext().isContextLost(),
    };
  });
  assert.equal(initial.rendererMode,'world3d');assert.equal(initial.visualMode,'world3d');assert.equal(initial.screenStage,false);assert.equal(initial.perspective,true);assert.equal(initial.orthographic,false);assert.equal(initial.contextLost,false);
  for(const id of ['floor','wall-north','wall-south','wall-east','wall-west','sofa','coffee-table','rug','side-table','doorway','headphones'])assert.ok(initial.objectIds.includes(id),`missing 3d object ${id}`);
  assert.equal(Math.abs(initial.libiScale.x),1);assert.equal(initial.libiScale.y,1);assert.equal(initial.libiScale.z,1);assert.equal(Math.abs(initial.dadScale.x),1);

  const movedRight=await moveKey('ArrowRight',initial.player),movedUp=await moveKey('ArrowUp',movedRight);
  assert.ok(Math.hypot(movedRight.x-initial.player.x,movedRight.z-initial.player.z)>.16,'3d right movement failed');
  assert.ok(Math.hypot(movedUp.x-movedRight.x,movedUp.z-movedRight.z)>.16,'3d forward movement failed');

  await page.keyboard.press('Space');await page.waitForFunction(()=>window.__crazyFamilyMovieSetGame?.player?.position?.y>.08,null,{timeout:3000});
  await page.waitForFunction(()=>Math.abs(window.__crazyFamilyMovieSetGame.player.position.y)<.02,null,{timeout:15000});

  const cameraBefore=await page.evaluate(()=>({...window.__crazyFamilyMovieSetGame.cameraPose.position}));
  const canvas=page.locator('#movieSetRoot .movie-set-canvas');const box=await canvas.boundingBox();assert.ok(box);
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.68,box.y+box.height*.42,{steps:8});await page.mouse.up();
  await page.waitForTimeout(220);
  const cameraAfter=await page.evaluate(()=>({...window.__crazyFamilyMovieSetGame.cameraPose.position}));
  assert.ok(Math.hypot(cameraAfter.x-cameraBefore.x,cameraAfter.z-cameraBefore.z)>.08,'pointer orbit did not move the camera');

  const collision=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame,w=game.world,sofa=w.colliders.find(o=>o.id==='sofa');
    const from={x:-1.6,y:0,z:2},to={x:-4,y:0,z:.55},r=w.resolveCharacterMove(from,to,{radius:.32});
    const inside=Math.abs(r.x-sofa.x)<sofa.width/2+.32&&Math.abs(r.z-sofa.z)<sofa.depth/2+.32;
    const wallHit=w.traceCameraSegment({x:0,y:1,z:0},{x:0,y:1,z:8},w.cameraBlockers,.22);
    return {inside,wallId:wallHit?.id,cameraFinite:[game.cameraPose.position.x,game.cameraPose.position.y,game.cameraPose.position.z].every(Number.isFinite)};
  });
  assert.equal(collision.inside,false,'player capsule penetrated sofa');assert.equal(collision.wallId,'wall-north');assert.equal(collision.cameraFinite,true);

  await page.setViewportSize({width:430,height:820});await page.waitForTimeout(150);
  const narrow=await page.evaluate(()=>({aspect:window.__crazyFamilyMovieSetGame.scene.camera.aspect,visible:window.__crazyFamilyMovieSetGame.playerVisual.mesh.visible}));
  assert.ok(Number.isFinite(narrow.aspect)&&narrow.aspect>0);assert.equal(narrow.visible,true);

  await fs.mkdir('artifacts',{recursive:true});await page.locator('.stage').screenshot({path:'artifacts/crazy-family-world3d-milestone-a.png'});
  const fatal=pageErrors.filter(message=>!/play\(\) request was interrupted|AbortError|media/i.test(message));assert.deepEqual(fatal,[],`browser page errors: ${fatal.join(' | ')}`);
  console.log('PASS: Milestone A world3d rendered in perspective, moved, jumped, orbited, respected collision, and survived mobile resize');
}finally{await browser.close();}
