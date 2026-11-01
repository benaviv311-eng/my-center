const assert=require('assert');
const World=require('../language-world-model.js');
const Mastery=require('../language-mastery.js');

assert.deepStrictEqual(World.LANGUAGE_CODES,['ar','it','ru','es']);
for(const lang of World.LANGUAGE_CODES){
  const places=World.getPlaces(lang);
  assert.deepStrictEqual(places.map(place=>place.id),['cafe','market','station']);
  for(const place of places){
    const mission=World.getMission(lang,place.id);
    assert.strictEqual(mission.steps.length,2,`${lang}/${place.id} must have two story steps`);
    mission.steps.forEach((step,index)=>{
      assert.ok(step.npc.target&&step.npc.he&&step.npc.pron,`${lang}/${place.id}/${index} needs dialogue and help`);
      assert.strictEqual(step.choices.length,3);
      assert.ok(step.choices.every(choice=>choice.target&&choice.he));
      assert.ok(step.correctIndex>=0&&step.correctIndex<3);
      const good=World.resolveChoice(lang,place.id,index,step.correctIndex);
      const bad=World.resolveChoice(lang,place.id,index,(step.correctIndex+1)%3);
      assert.strictEqual(good.correct,true);
      assert.strictEqual(bad.correct,false);
      assert.ok(good.reply.target&&bad.reply.target);
      assert.notStrictEqual(good.reply.target,bad.reply.target,'choices should change NPC response');
      assert.strictEqual(good.nextIndex,index===1?null:index+1);
      assert.strictEqual(good.key,`${place.id}:${index}`);
    });
  }
}
assert.strictEqual(World.getMission('xx','cafe'),null);
assert.strictEqual(World.resolveChoice('ar','cafe',0,99),null);
assert.strictEqual(World.getMission('ar','missing'),null);

const now=Date.UTC(2026,10,1,12);
const empty=Mastery.parse('{not json');
assert.deepStrictEqual(empty,Mastery.empty());
assert.deepStrictEqual(Mastery.due(empty,'it',now),[]);
const one=Mastery.record(empty,'it','cafe:0',true,now);
assert.strictEqual(one.byLanguage.it['cafe:0'].streak,1);
assert.strictEqual(one.byLanguage.it['cafe:0'].dueAt,now+86400000);
assert.deepStrictEqual(Mastery.due(one,'it',now),[]);
assert.deepStrictEqual(Mastery.due(one,'it',now+86400000).map(x=>x.key),['cafe:0']);
assert.deepStrictEqual(Mastery.due(one,'ru',now+86400000),[],'language memory must be isolated');
const two=Mastery.record(one,'it','cafe:0',true,now+86400000);
assert.strictEqual(two.byLanguage.it['cafe:0'].dueAt,now+86400000+3*86400000);
const three=Mastery.record(two,'it','cafe:0',true,now+4*86400000);
assert.strictEqual(three.byLanguage.it['cafe:0'].status,'mastered');
const mistake=Mastery.record(three,'it','cafe:0',false,now+5*86400000);
assert.strictEqual(mistake.byLanguage.it['cafe:0'].status,'review');
assert.deepStrictEqual(Mastery.due(mistake,'it',now+5*86400000).map(x=>x.key),['cafe:0']);
assert.strictEqual(Mastery.stats(mistake,'it').attempts,4);
assert.strictEqual(Mastery.stats(mistake,'ru').attempts,0);
assert.strictEqual(empty.byLanguage.it,undefined,'record must not mutate earlier state');
assert.deepStrictEqual(Mastery.parse(JSON.stringify(mistake)),mistake);

console.log('language world + mastery models: OK');
