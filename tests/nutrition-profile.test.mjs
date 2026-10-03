import test from 'node:test';
import assert from 'node:assert/strict';
import Profile from '../nutrition-profile.js';

function storage(seed={}){
  const data=new Map(Object.entries(seed));
  return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),dump:()=>Object.fromEntries(data)};
}

test('saved foods survive profile save and load without duplicates', () => {
  const s=storage();
  let p={version:2,name:'בן',mealCount:3,savedFoods:[]};
  p=Profile.toggleSavedFood(p,{id:'chicken',name:'חזה עוף',source:'local'});
  p=Profile.toggleSavedFood(p,{id:'rice',name:'אורז',preparation:'cooked',source:'local'});
  p=Profile.toggleSavedFood(p,{id:'rice',name:'אורז',preparation:'cooked',source:'local'}); // toggle removes
  p=Profile.toggleSavedFood(p,{id:'rice',name:'אורז',preparation:'cooked',source:'local'}); // add again once
  Profile.save(s,p);
  const loaded=Profile.load(s);
  assert.equal(loaded.savedFoods.length,2);
  assert.ok(Profile.isSaved(loaded,{id:'chicken'}));
  assert.ok(Profile.isSaved(loaded,{id:'rice',preparation:'cooked'}));
});

test('removing saved food preserves unrelated profile fields', () => {
  const p={version:2,name:'בן',mealCount:5,goal:'performance',savedFoods:[{id:'egg',name:'ביצים',savedAt:'x'}]};
  const next=Profile.removeSavedFood(p,'egg');
  assert.equal(next.mealCount,5);
  assert.equal(next.goal,'performance');
  assert.deepEqual(next.savedFoods,[]);
});

test('meal count is normalized to 1-6 on save', () => {
  const s=storage();
  Profile.save(s,{version:2,mealCount:99,savedFoods:[]});
  assert.equal(Profile.load(s).mealCount,6);
});

test('migration prefers nutritionProfileV1 and safely merges useful legacy fields', () => {
  const s=storage({
    nutritionProfile:JSON.stringify({age:32,w:91,h:178,sex:'male',activity:3,goal:'maintain'}),
    nutritionProfileV1:JSON.stringify({version:1,name:'בן',weight:90,height:178,mealCount:4,savedFoods:[{id:'egg',name:'ביצים',savedAt:'x'}]})
  });
  const p=Profile.migrate(s);
  assert.equal(p.name,'בן');
  assert.equal(p.weight,90);
  assert.equal(p.age,32);
  assert.equal(p.mealCount,4);
  assert.equal(p.savedFoods.length,1);
  assert.equal(p.version,2);
});

test('government saved food keeps stable source lookup metadata', () => {
  const p=Profile.toggleSavedFood({version:2,savedFoods:[]},{id:'gov-123',name:'דוגמה',source:'משרד הבריאות',sourceCode:'123'});
  assert.deepEqual(Object.keys(p.savedFoods[0]).sort(),['id','name','savedAt','source','sourceCode'].sort());
  assert.equal(p.savedFoods[0].sourceCode,'123');
});
