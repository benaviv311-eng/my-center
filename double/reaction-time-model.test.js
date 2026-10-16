const assert=require('assert');
const R=require('./reaction-time-model.js');
assert.equal(R.formatSeconds(.842),'0.84 שנ׳');
assert.equal(R.formatSeconds(1.005),'1.00 שנ׳');
assert.equal(R.playerLabel(0),'שחקן 1');
assert.equal(R.playerLabel(1),'שחקן 2');
assert.equal(R.badgeText(.842,0),'⚡ 0.84 שנ׳ · שחקן 1');
console.log('reaction time model OK');
