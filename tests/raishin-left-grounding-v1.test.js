const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const game=fs.readFileSync(path.join(root,'raishin-legacy','game.js'),'utf8');

assert.match(game,/leftDistance/,'LEFT animation should track real distance travelled');
assert.match(game,/leftIdleFrame/,'LEFT should preserve a stable planted idle frame');
assert.match(game,/buildLeftGroundingMetrics/,'LEFT should derive grounding from the real sprite alpha');
assert.match(game,/getImageData/,'LEFT grounding should inspect visible sprite pixels rather than assuming frame bottom is the floor');
assert.match(game,/leftFrameMetrics/,'LEFT should store per-frame ground contact metadata');
assert.match(game,/drawLeftFrame/,'LEFT should use a dedicated grounded renderer');
assert.match(game,/state\.direction==='left'.*frameAtDistance/s,'LEFT animation should advance by actual travel distance');
assert.match(game,/leftGroundContactX/,'LEFT shadow should follow the detected planted foot');
assert.match(game,/state\.direction==='left'&&leftFrameMetrics\.length===frameCount/,'LEFT renderer should only activate after all frame metrics are ready');
assert.doesNotMatch(game,/state\.direction==='left'[^\n]*grounding\.bobY/,'LEFT grounded renderer must not add legacy vertical bob that lifts the feet');

console.log('PASS: LEFT distance-driven alpha-grounded walk contract');
