const assert=require('assert');
const E=require('./encouragement-engine.js');

assert.strictEqual(E.baseLevel(0.60,'easy'),4,'0.60s on easy should be level 4');
assert.strictEqual(E.baseLevel(0.60,'normal'),5,'0.60s on normal should be level 5');
assert.strictEqual(E.baseLevel(0.79,'hard'),5,'0.79s on hard should be level 5');
assert.strictEqual(E.baseLevel(0.84,'hard'),4,'0.84s on hard should be level 4');
assert.strictEqual(E.baseLevel(3.10,'hard'),1,'slow hard response should be level 1');

const upgraded=E.evaluate({seconds:1.20,difficulty:'normal',previousBestMs:1400});
assert.strictEqual(upgraded.baseLevel,3);
assert.strictEqual(upgraded.level,4,'new personal best should upgrade one reinforcement level');
assert.strictEqual(upgraded.isNewBest,true);
assert.strictEqual(upgraded.timeMs,1200);
assert.strictEqual(upgraded.meta,'1.20 שנ׳ · בינוני ⚡ · 🏆 NEW BEST');

const first=E.evaluate({seconds:2.20,difficulty:'easy',previousBestMs:null});
assert.strictEqual(first.isNewBest,false,'first recorded response seeds the best without bonus');
assert.strictEqual(first.level,1);

assert.strictEqual(E.nextBestMs(null,900),900);
assert.strictEqual(E.nextBestMs(800,900),800);
assert.strictEqual(E.nextBestMs(800,700),700);
assert.strictEqual(E.phraseFor('italian',5),'Leggendario!');
assert.strictEqual(E.phraseFor('japanese',1),'いいね！');

console.log('encouragement-engine tests OK');
