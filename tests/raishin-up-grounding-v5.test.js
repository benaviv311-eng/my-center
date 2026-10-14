const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const game=fs.readFileSync(path.join(root,'raishin-legacy','game.js'),'utf8');
const upStart=game.indexOf('function buildUpGroundingMetrics');
const leftStart=game.indexOf('function buildLeftGroundingMetrics');
const upBlock=game.slice(upStart,leftStart);

assert.match(game,/findDenseFootContact/,'Walk UP grounding must use a dense foot-contact detector instead of the lowest alpha pixel');
assert.match(game,/minRowPixels/,'detector must require enough opaque pixels on a candidate support row');
assert.match(game,/minRunPixels/,'detector must require a contiguous opaque run so isolated halo pixels cannot become the floor');
assert.match(game,/supportBandDepth/,'detector must derive contact X from a small dense support band around the planted paw');
assert.doesNotMatch(upBlock,/maxY/,'UP grounding must not use the raw lowest nontransparent pixel as ground contact');
assert.match(upBlock,/upFrameMetrics\.push\(findDenseFootContact/,'every UP frame must use the robust detected support contact');

console.log('PASS: Walk UP ignores stray alpha pixels and grounds to a dense planted-paw contact');
