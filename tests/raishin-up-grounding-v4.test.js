const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const game=fs.readFileSync(path.join(root,'raishin-legacy','game.js'),'utf8');

assert.match(game,/upFrameMetrics/,'UP should store per-frame ground contact metadata');
assert.match(game,/buildUpGroundingMetrics/,'UP should derive grounding from the real Walk UP sprite alpha');
assert.match(game,/scanCtx\.drawImage\(upSprite/,'UP grounding should inspect the dedicated Walk UP sprite');
assert.match(game,/getImageData/,'UP grounding should inspect visible sprite pixels instead of assuming a fixed baseline');
assert.match(game,/upFrameMetrics\[frameIndex\]/,'UP geometry should use detected per-frame contacts');
assert.match(game,/upSprite\.onload[\s\S]*buildUpGroundingMetrics/,'UP metrics should be built when the professional Walk UP sprite loads');
assert.match(game,/state\.direction==='up'&&upSpriteReady&&upSpriteProfessional&&upFrameMetrics\.length===frameCount/,'professional UP renderer should only activate after all frame metrics are ready');
assert.match(game,/professionalUpContactX/,'UP shadow should follow the detected planted foot');
assert.doesNotMatch(game,/const upFootContacts=/,'UP must not use the old hard-coded foot contact table');

console.log('PASS: UP distance-driven alpha-grounded walk contract');
