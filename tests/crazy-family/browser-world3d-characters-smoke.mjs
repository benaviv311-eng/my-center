import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
await page.route('**/*.mp3',route=>route.abort());

try{
  await page.goto('http://127.0.0.1:8000/crazy-family.html?movie-set-smoke=1&cinematic-seed=1&renderer=3d',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.__crazyFamilyMovieSetGame?.playerVisual?.mesh),null,{timeout:30000});

  const initial=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame;
    const inspect=visual=>{
      const geometryTypes=[];
      visual.root?.traverse?.(node=>{if(node.isMesh&&node.geometry?.type)geometryTypes.push(node.geometry.type);});
      return {
        volumetric:Boolean(visual.isVolumetric3D),
        identity:visual.root?.userData?.identity,
        height:visual.root?.userData?.height,
        geometryTypes,
        rotationY:visual.root?.rotation?.y,
        scale:{x:visual.root?.scale?.x,y:visual.root?.scale?.y,z:visual.root?.scale?.z},
      };
    };
    return {rendererMode:game.rendererMode,player:inspect(game.playerVisual),dad:inspect(game.dadVisual)};
  });

  assert.equal(initial.rendererMode,'world3d');
  assert.equal(initial.player.volumetric,true,'Libi must use the volumetric world3d adapter');
  assert.equal(initial.dad.volumetric,true,'Dad must use the volumetric world3d adapter');
  assert.equal(initial.player.identity,'libi');
  assert.equal(initial.dad.identity,'dad');
  assert.ok(initial.dad.height>initial.player.height,'Dad must remain physically taller than Libi');
  assert.ok(initial.player.geometryTypes.length>=10,'Libi needs a multi-mesh volumetric body');
  assert.ok(initial.dad.geometryTypes.length>=10,'Dad needs a multi-mesh volumetric body');
  assert.equal(initial.player.geometryTypes.includes('PlaneGeometry'),false,'Libi may not contain sprite planes');
  assert.equal(initial.dad.geometryTypes.includes('PlaneGeometry'),false,'Dad may not contain sprite planes');
  assert.ok(initial.player.scale.x>0&&initial.dad.scale.x>0,'legacy sprite flipping may not mirror native actors');

  const before=initial.player.rotationY;
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(()=>Math.hypot(window.__crazyFamilyMovieSetGame.player.velocity.x,window.__crazyFamilyMovieSetGame.player.velocity.z)>.2,null,{timeout:5000});
  await page.waitForTimeout(240);
  await page.keyboard.up('ArrowUp');
  const moved=await page.evaluate(()=>({rotationY:window.__crazyFamilyMovieSetGame.playerVisual.root.rotation.y,scaleX:window.__crazyFamilyMovieSetGame.playerVisual.root.scale.x}));
  assert.ok(Number.isFinite(moved.rotationY));
  assert.ok(Math.abs(moved.rotationY-before)>.01,'Libi should rotate in world space when her travel direction changes');
  assert.ok(moved.scaleX>0,'native facing must use Y rotation, never negative X scale');

  await page.keyboard.down('c');
  await page.waitForFunction(()=>window.__crazyFamilyMovieSetGame.playerVisual.root.scale.y<.95,null,{timeout:3000});
  const crouched=await page.evaluate(()=>window.__crazyFamilyMovieSetGame.playerVisual.root.scale.y);
  await page.keyboard.up('c');
  assert.ok(crouched<.95,'crouch must compress the volumetric body');

  await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.__crazyFamilyMovieSetGame.player.position.y>.08,null,{timeout:3000});
  const jumping=await page.evaluate(()=>({worldY:window.__crazyFamilyMovieSetGame.player.position.y,visualY:window.__crazyFamilyMovieSetGame.playerVisual.root.position.y}));
  assert.ok(jumping.visualY>.08,'3D Libi must rise in actual world Y during jump');
  assert.ok(Math.abs(jumping.visualY-jumping.worldY)<.08,'visual jump must track gameplay world Y directly');

  await fs.mkdir('artifacts',{recursive:true});
  await page.locator('.stage').screenshot({path:'artifacts/crazy-family-world3d-volumetric-characters.png'});
  const fatal=pageErrors.filter(message=>!/play\(\) request was interrupted|AbortError|media/i.test(message));
  assert.deepEqual(fatal,[],`browser page errors: ${fatal.join(' | ')}`);
  console.log('PASS: world3d renders true volumetric Libi and Dad with world rotation, crouch and jump');
}finally{
  await browser.close();
}
