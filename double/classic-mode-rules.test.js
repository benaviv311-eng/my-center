const assert=require('assert');
let R;
try{R=require('./classic-mode-rules.js')}catch(err){assert.fail('classic mode rules module missing');}
assert.equal(R.TARGET,20,'classic target should be 20');
assert.equal(R.isComplete(19),false);
assert.equal(R.isComplete(20),true);
assert.equal(R.isComplete(24),true);
assert.equal(R.normalizeDifficulty('hard'),'hard');
assert.equal(R.normalizeDifficulty('bad'),'normal');
assert.equal(R.nextBestSeconds(null,12.34),12.34);
assert.equal(R.nextBestSeconds(12.34,11.88),11.88);
assert.equal(R.nextBestSeconds(12.34,13.10),12.34);
assert.equal(R.formatSeconds(9.876),'9.88 שנ׳');
console.log('classic mode rules OK');
