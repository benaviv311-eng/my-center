import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
await page.route('**/*.mp3',route=>route.abort());

const expectedParts=[
  'torso','head','leftUpperArm','leftLowerArm','rightUpperArm','rightLowerArm',
  'leftUpperLeg','leftLowerLeg','rightUpperLeg','rightLowerLeg',
];

try {
  await page.goto('http://127.0.0.1:8000/crazy-family.html?movie-set-smoke=1&cinematic-seed=1&renderer=3d',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.__crazyFamilyMovieSetGame?.playerVisual?.mesh),null,{timeout:30000});

  const before=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame;
    window.__segmentedRigRootRefs={player:game.playerVisual.mesh,dad:game.dadVisual.mesh};
    return {playerMode:game.playerVisual.mesh.userData.renderMode,dadMode:game.dadVisual.mesh.userData.renderMode};
  });
  assert.equal(before.playerMode,'canonical-3d-stack');
  assert.equal(before.dadMode,'canonical-3d-stack');

  const ready=await page.evaluate(async()=>{
    const game=window.__crazyFamilyMovieSetGame;
    return Promise.all([game.playerVisual.ready,game.dadVisual.ready]);
  });
  assert.deepEqual(ready,[true,true],'both canonical segmented rigs must initialize');

  await page.waitForFunction(()=>{
    const game=window.__crazyFamilyMovieSetGame;
    return game.playerVisual.mesh.userData.renderMode==='canonical-segmented-rig'&&game.dadVisual.mesh.userData.renderMode==='canonical-segmented-rig';
  },null,{timeout:10000});

  const rigState=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame;
    const inspect=(visual,expectedAsset)=>{
      const root=visual.mesh;
      const rig=root.children.find(child=>child.userData?.renderMode==='canonical-segmented-rig');
      const parts=[];
      rig?.traverse?.(node=>{if(node.userData?.semanticPart&&node.userData.semanticPart!=='presentationRoot')parts.push(node.userData.semanticPart);});
      return {
        sameRoot: root===window.__segmentedRigRootRefs[visual===game.playerVisual?'player':'dad'],
        renderMode:root.userData.renderMode,
        asset:root.userData.canonicalAssetUrl,
        version:root.userData.characterCanonVersion,
        rigAsset:rig?.userData?.canonicalAssetUrl,
        rigVersion:rig?.userData?.characterCanonVersion,
        parts:[...new Set(parts)].sort(),
        visibleYawDelta:rig?.userData?.visibleYawDelta??0,
        expectedAsset,
      };
    };
    return {
      player:inspect(game.playerVisual,'assets/libi-sprites-v025.png'),
      dad:inspect(game.dadVisual,'assets/crazy-family/dad-sprites-v028.png'),
    };
  });

  for(const actor of [rigState.player,rigState.dad]){
    assert.equal(actor.sameRoot,true,'stable visual root must survive async rig activation');
    assert.equal(actor.renderMode,'canonical-segmented-rig');
    assert.equal(actor.asset,actor.expectedAsset);
    assert.equal(actor.rigAsset,actor.expectedAsset);
    assert.ok(actor.version);
    assert.equal(actor.rigVersion,actor.version);
    assert.deepEqual(actor.parts,[...expectedParts].sort());
  }

  const beforeWalk=await page.evaluate(()=>{
    const rig=window.__crazyFamilyMovieSetGame.playerVisual.mesh.children.find(child=>child.userData?.renderMode==='canonical-segmented-rig');
    const arm=rig.getObjectByName('libi-leftUpperArm');
    const leg=rig.getObjectByName('libi-leftUpperLeg');
    return {arm:arm.rotation.z,leg:leg.rotation.z};
  });
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(260);
  const duringWalk=await page.evaluate(()=>{
    const game=window.__crazyFamilyMovieSetGame;
    const rig=game.playerVisual.mesh.children.find(child=>child.userData?.renderMode==='canonical-segmented-rig');
    const arm=rig.getObjectByName('libi-leftUpperArm');
    const leg=rig.getObjectByName('libi-leftUpperLeg');
    return {
      arm:arm.rotation.z,
      leg:leg.rotation.z,
      state:rig.userData.poseState,
      delta:rig.userData.visibleYawDelta,
    };
  });
  await page.keyboard.up('ArrowUp');
  assert.ok(Math.abs(duringWalk.arm-beforeWalk.arm)>.015,'Libi arm must articulate while moving');
  assert.ok(Math.abs(duringWalk.leg-beforeWalk.leg)>.015,'Libi leg must articulate while moving');
  assert.ok(duringWalk.arm*duringWalk.leg<0,'same-side arm and leg must oppose each other');
  assert.ok(Math.abs(duringWalk.delta)<=25*Math.PI/180+1e-6,'visible yaw must remain within canonical readable range');

  await page.keyboard.down('c');
  await page.waitForTimeout(100);
  const crouch=await page.evaluate(()=>{
    const rig=window.__crazyFamilyMovieSetGame.playerVisual.mesh.children.find(child=>child.userData?.renderMode==='canonical-segmented-rig');
    return {state:rig.userData.poseState,diag:rig.userData.poseDiagnostics};
  });
  await page.keyboard.up('c');
  assert.equal(crouch.state,'crouch');
  assert.ok(crouch.diag.rootYOffset<0,'crouch must lower only the visual presentation');

  await page.setViewportSize({width:430,height:820});
  await page.waitForTimeout(120);
  const mobile=await page.evaluate(()=>({
    playerVisible:window.__crazyFamilyMovieSetGame.playerVisual.mesh.visible,
    playerMode:window.__crazyFamilyMovieSetGame.playerVisual.mesh.userData.renderMode,
    dadMode:window.__crazyFamilyMovieSetGame.dadVisual.mesh.userData.renderMode,
  }));
  assert.equal(mobile.playerVisible,true);
  assert.equal(mobile.playerMode,'canonical-segmented-rig');
  assert.equal(mobile.dadMode,'canonical-segmented-rig');

  await page.setViewportSize({width:1440,height:1000});
  await page.waitForTimeout(120);
  await fs.mkdir('artifacts',{recursive:true});
  await page.locator('.stage').screenshot({path:'artifacts/crazy-family-canonical-segmented-rig.png'});

  const fatal=pageErrors.filter(message=>!/play\(\) request was interrupted|AbortError|media/i.test(message));
  assert.deepEqual(fatal,[],`browser page errors: ${fatal.join(' | ')}`);
  console.log('PASS: canonical segmented rigs loaded for Libi and Dad, preserved stable roots/canon, articulated in motion, respected yaw limit, and survived mobile resize');
} finally {
  await browser.close();
}
