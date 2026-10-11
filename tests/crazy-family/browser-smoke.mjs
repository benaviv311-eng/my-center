import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));await page.route('**/*.mp3',route=>route.abort());
const close=(a,b,epsilon=1e-6)=>Math.abs(a-b)<=epsilon;

async function moveKey(key,start,minimum=.18){
  await page.keyboard.down(key);
  try{await page.waitForFunction(({x,z,minimum})=>{const p=window.__crazyFamilyMovieSetGame?.player?.position;return p&&Math.hypot(p.x-x,p.z-z)>minimum;},{x:start.x,z:start.z,minimum},{timeout:5000});}
  finally{await page.keyboard.up(key);}
  return page.evaluate(()=>({...window.__crazyFamilyMovieSetGame.player.position}));
}

try{
  await page.goto('http://127.0.0.1:8000/crazy-family.html?movie-set-smoke=1&cinematic-seed=1',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.__crazyFamilyMovieSetGame?.scene?.renderer),null,{timeout:30000});
  await page.waitForSelector('#movieSetRoot .movie-set-canvas',{state:'visible',timeout:10000});
  await page.waitForFunction(()=>window.__crazyFamilyMovieSetGame?.scene?.cinematicSet?.layersById?.size>=7,null,{timeout:15000});

  const initial=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame,item=game.world.interactables.find(entry=>entry.id===game.scenario.item.id),itemVisual=game.scene.objectsById.get(game.scenario.item.id);
    const expectedVisual=game.scene.projectWorld(game.scenario.item.position);
    return {
      bodyClass:document.body.className,legacyHidden:document.getElementById('game')?.hidden,unsupported:Boolean(document.querySelector('.movie-set-unsupported')),
      player:{...game.player.position},dad:{...game.dadFrame.position},worldId:game.world.id,objectIds:game.world.objects.map(o=>o.id),
      shadowEnabled:game.scene.renderer.shadowMap.enabled,contextLost:game.scene.renderer.getContext().isContextLost(),visualMode:game.scene.visualMode,
      screenStage:game.scene.screenStage,orthographic:Boolean(game.scene.camera.isOrthographicCamera),proceduralVisible:game.scene.proceduralGroup.visible,
      layerIds:[...game.scene.cinematicSet.layersById.keys()],warnings:[...game.scene.cinematicSet.warnings],scenarioItem:{...game.scenario.item.position},expectedVisual,
      interactableItem:item?{x:item.x,y:item.y,z:item.z,enabled:item.enabled}:null,
      visualItem:itemVisual?{x:itemVisual.position.x,y:itemVisual.position.y,z:itemVisual.position.z,visible:itemVisual.visible}:null,
    };
  });

  assert.match(initial.bodyClass,/movie-set-mode/);assert.equal(initial.legacyHidden,true);assert.equal(initial.unsupported,false);assert.equal(initial.worldId,'living-room');
  assert.equal(initial.visualMode,'cinematic');assert.equal(initial.screenStage,true);assert.equal(initial.orthographic,true);assert.equal(initial.proceduralVisible,false,'procedural furniture must stay hidden in cinematic mode');
  for(const id of ['floor','sofa','coffee-table','rug','toy-ball','doorway'])assert.ok(initial.objectIds.includes(id),`missing gameplay object ${id}`);
  for(const id of ['cinematic-background','cinematic-floor-rug','cinematic-sofa','cinematic-coffee-table','cinematic-dining-kitchen','cinematic-foreground-left','cinematic-foreground-right'])assert.ok(initial.layerIds.includes(id),`missing cinematic layer ${id}`);
  assert.deepEqual(initial.warnings,[],'required cinematic set should load without warnings');assert.equal(initial.shadowEnabled,true);assert.equal(initial.contextLost,false);
  assert.deepEqual(initial.interactableItem,{...initial.scenarioItem,enabled:true},'scenario interaction must match logical scenario coordinates');
  assert.ok(close(initial.visualItem.x,initial.expectedVisual.x)&&close(initial.visualItem.y,initial.expectedVisual.y)&&close(initial.visualItem.z,initial.expectedVisual.z),'special-item visual must be the cinematic projection of its scenario coordinate');

  await fs.mkdir('artifacts',{recursive:true});
  await page.locator('.stage').screenshot({path:'artifacts/crazy-family-v042-cinematic-set.png'});
  await page.evaluate(()=>{const game=window.__crazyFamilyMovieSetGame;game.playerVisual.setVisible(false);game.dadVisual.setVisible(false);game.scene.objectsById.get(game.scenario.item.id).visible=false;});
  await page.locator('#movieSetRoot').screenshot({path:'artifacts/crazy-family-v042-environment-only.png'});
  await page.evaluate(()=>{const game=window.__crazyFamilyMovieSetGame;game.playerVisual.setVisible(true);game.dadVisual.setVisible(true);const item=game.world.interactables.find(entry=>entry.id===game.scenario.item.id);game.scene.objectsById.get(game.scenario.item.id).visible=Boolean(item?.enabled);});

  const movedRight=await moveKey('ArrowRight',initial.player),movedUp=await moveKey('ArrowUp',movedRight);
  assert.ok(Math.hypot(movedRight.x-initial.player.x,movedRight.z-initial.player.z)>.18,'first free-movement direction failed');
  assert.ok(Math.hypot(movedUp.x-movedRight.x,movedUp.z-movedRight.z)>.18,'second free-movement direction failed');

  await page.keyboard.press('Space');await page.waitForFunction(()=>window.__crazyFamilyMovieSetGame?.player?.position?.y>.08,null,{timeout:3000});
  const airborneY=await page.evaluate(()=>window.__crazyFamilyMovieSetGame.player.position.y);assert.ok(airborneY>.08,`jump did not raise world Y: ${airborneY}`);
  await page.waitForFunction(()=>Math.abs(window.__crazyFamilyMovieSetGame.player.position.y)<.02,null,{timeout:15000});

  await page.evaluate(()=>{const p=window.__crazyFamilyMovieSetGame.player.position;p.x=-3.35;p.y=0;p.z=-.72;});
  await page.waitForFunction(()=>window.__crazyFamilyMovieSetGame?.scene?.cinematicSet?.layersById?.get('cinematic-sofa')?.userData?.actorOccluderActive===true,null,{timeout:8000});
  assert.equal(await page.evaluate(()=>window.__crazyFamilyMovieSetGame.scene.cinematicSet.layersById.get('cinematic-sofa').userData.actorOccluderActive),true,'authored sofa must occlude an actor moving behind it');

  // The deterministic v0.42 item sits on the coffee table. Its reachable side is the
  // near/lower-Z edge; approaching from +Z leaves the capsule inside the table blocker.
  await page.evaluate(()=>{const game=window.__crazyFamilyMovieSetGame,p=game.player.position,item=game.scenario.item.position;p.x=item.x;p.y=0;p.z=item.z-.72;});
  await page.waitForFunction(()=>Boolean(document.querySelector('.movie-set-action-prompt:not([hidden])')),null,{timeout:5000});await page.keyboard.press('Enter');
  await page.waitForFunction(()=>{const game=window.__crazyFamilyMovieSetGame;return game.world.interactables.find(entry=>entry.id===game.scenario.item.id)?.enabled===false;},null,{timeout:5000});
  const collected=await page.evaluate(()=>{const game=window.__crazyFamilyMovieSetGame;return {enabled:game.world.interactables.find(entry=>entry.id===game.scenario.item.id)?.enabled,visible:game.scene.objectsById.get(game.scenario.item.id)?.visible};});
  assert.deepEqual(collected,{enabled:false,visible:false},'special item should collect and disappear');

  const finalRuntime=await page.evaluate(()=>{const game=window.__crazyFamilyMovieSetGame;return {dadPosition:{...game.dadFrame.position},dadVisible:game.dadVisual.mesh.visible,libiVisible:game.playerVisual.mesh.visible,contextLost:game.scene.renderer.getContext().isContextLost()};});
  assert.ok(Number.isFinite(finalRuntime.dadPosition.x)&&Number.isFinite(finalRuntime.dadPosition.z));assert.equal(finalRuntime.dadVisible,true);assert.equal(finalRuntime.libiVisible,true);assert.equal(finalRuntime.contextLost,false);
  const canvasBox=await page.locator('#movieSetRoot .movie-set-canvas').boundingBox();assert.ok(canvasBox&&canvasBox.width>500&&canvasBox.height>300,'cinematic canvas is not laid out at gameplay size');
  const fatalErrors=pageErrors.filter(message=>!/play\(\) request was interrupted|AbortError|media/i.test(message));assert.deepEqual(fatalErrors,[],`browser page errors: ${fatalErrors.join(' | ')}`);
  console.log('PASS: v0.42 screen-stage cinematic home rendered, moved freely, jumped, occluded behind furniture and collected the scenario item');
}finally{await browser.close();}
