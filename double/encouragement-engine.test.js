const assert=require('assert');
const E=require('./encouragement-engine.js');

assert.strictEqual(E.baseLevel(0.60,'easy'),4);
assert.strictEqual(E.baseLevel(0.60,'normal'),5);
assert.strictEqual(E.baseLevel(0.79,'hard'),5);
assert.strictEqual(E.baseLevel(0.84,'hard'),4);
assert.strictEqual(E.baseLevel(3.10,'hard'),1);

const upgraded=E.evaluate({seconds:1.20,difficulty:'normal',previousBestMs:1400});
assert.strictEqual(upgraded.baseLevel,3);
assert.strictEqual(upgraded.level,4);
assert.strictEqual(upgraded.isNewBest,true);
assert.strictEqual(upgraded.meta,'1.20 שנ׳ · בינוני ⚡ · 🏆 NEW BEST');

const versus=E.evaluate({seconds:.84,difficulty:'hard',player:0});
assert.strictEqual(versus.meta,'0.84 שנ׳ · קשה 🔥 · שחקן 1');

assert.strictEqual(E.phraseFor('british',5),'Absolutely legendary!');
assert.strictEqual(E.phraseFor('american',2),"Let's go!");
assert.strictEqual(E.phraseFor('arcade',4),'MEGA MATCH!');
assert.strictEqual(E.phraseFor('russian',5),'Легендарно!');
assert.strictEqual(E.phraseFor('italian',4),'Incredibile!');
assert.strictEqual(E.phraseFor('japanese',3),'最高！');

const british=E.voiceProfile(3,'british');
const american=E.voiceProfile(3,'american');
const arcade=E.voiceProfile(3,'arcade');
const russian=E.voiceProfile(3,'russian');
const italian=E.voiceProfile(3,'italian');
const japanese=E.voiceProfile(3,'japanese');
assert(russian.pitch < british.pitch,'Russian announcer should sound deeper');
assert(arcade.pitch > american.pitch,'Arcade announcer should sound more game-like');
assert(american.rate > british.rate,'American announcer should be more energetic than British');
assert(italian.pitch > british.pitch,'Italian announcer should be more expressive');
assert(japanese.rate >= british.rate,'Japanese announcer should be crisp, not slower than British');
for(const pack of ['british','american','arcade','russian','italian','japanese']){
  const low=E.voiceProfile(1,pack),high=E.voiceProfile(5,pack);
  assert(high.rate>=low.rate,pack+' level 5 should not speak slower than level 1');
  assert(high.volume>=low.volume,pack+' level 5 should not be quieter than level 1');
  assert(low.volume>0&&high.volume<=1,pack+' volume must stay in browser range');
  assert(low.pitch>=.5&&high.pitch<=2,pack+' pitch must stay in browser range');
}

console.log('encouragement-engine announcer tests OK');
