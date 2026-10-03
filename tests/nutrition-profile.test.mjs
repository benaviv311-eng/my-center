import test from 'node:test';
import assert from 'node:assert/strict';
import Profile from '../nutrition-profile.js';

function fakeStorage(initial={}){
  const map=new Map(Object.entries(initial));
  return {
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key),
    dump:()=>Object.fromEntries(map)
  };
}

test('saved foods persist, deduplicate by identity and can be removed', () => {
  const storage=fakeStorage();
  let profile={version:2,name:'בן',mealCount:3,savedFoods:[]};
  profile=Profile.toggleSavedFood(profile,{id:'chicken',name:'חזה עוף',source:'local'});
  profile=Profile.toggleSavedFood(profile,{id:'rice',name:'אורז',source:'local'});
  profile=Profile.toggleSavedFood(profile,{id:'rice',name:'אורז',source:'local'});
  assert.equal(profile.savedFoods.length,1,'second toggle removes same saved food');
  profile=Profile.toggleSavedFood(profile,{id:'rice',name:'אורז',source:'local'});
  Profile.save(storage,profile);
  const loaded=Profile.load(storage);
  assert.deepEqual(loaded.savedFoods.map(x=>x.id).sort(),['chicken','rice']);
  const removed=Profile.removeSavedFood(loaded,'chicken');
  assert.equal(Profile.isSaved(removed,{id:'chicken'}),false);
  assert.equal(Profile.isSaved(removed,{id:'rice'}),true);
});

test('meal count is normalized and unrelated profile fields survive save', () => {
  const storage=fakeStorage();
  Profile.save(storage,{version:2,name:'בן',mealCount:9,savedFoods:[],goal:'maintain',custom:'keep-me'});
  const loaded=Profile.load(storage);
  assert.equal(loaded.mealCount,6);
  assert.equal(loaded.custom,'keep-me');
});

test('migration prefers nutritionProfileV1 and safely fills missing legacy fields', () => {
  const storage=fakeStorage({
    nutritionProfile:JSON.stringify({age:32,w:91,h:178,sex:'male',activity:3,goal:'maintain'}),
    nutritionProfileV1:JSON.stringify({version:1,name:'בן',weight:90,height:178,mealCount:4,savedFoods:[{id:'egg',name:'ביצים'}]})
  });
  const migrated=Profile.migrate(storage);
  assert.equal(migrated.name,'בן');
  assert.equal(migrated.weight,90,'newer profile wins over legacy weight');
  assert.equal(migrated.age,32,'missing field may be filled from legacy');
  assert.equal(migrated.mealCount,4);
  assert.deepEqual(migrated.savedFoods.map(x=>x.id),['egg']);
  assert.equal(JSON.parse(storage.getItem('nutritionProfileV1')).version,2);
});

test('government saved food keeps stable lookup metadata without requiring nutrient snapshot', () => {
  const profile=Profile.toggleSavedFood({version:2,savedFoods:[]},{
    id:'gov-123',name:'מזון ממשלתי',source:'משרד הבריאות',sourceCode:'123',preparation:'מבושל',k:999
  });
  const saved=profile.savedFoods[0];
  assert.equal(saved.sourceCode,'123');
  assert.equal(saved.preparation,'מבושל');
  assert.equal('k' in saved,false);
});
