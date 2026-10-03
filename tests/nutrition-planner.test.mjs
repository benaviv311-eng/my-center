import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Planner from '../nutrition-planner.js';
import Meals from '../nutrition-meals.js';

const TARGET={cal:2200,protein:130,carbs:260,fat:70,fiber:30};
const foods={
  rice:{id:'rice',name:'אורז מבושל',cat:'carb',k:130,p:2.7,c:28,f:.3,fi:.4,dailyMax:450,perMealMax:250},
  chicken:{id:'chicken',name:'חזה עוף',cat:'protein',k:165,p:31,c:0,f:3.6,fi:0,dailyMax:350,perMealMax:220},
  yogurt:{id:'yogurt',name:'יוגורט',cat:'protein',k:98,p:9,c:4,f:5,fi:0,dailyMax:400,perMealMax:250},
  lentils:{id:'lentils',name:'עדשים',cat:'fiber',k:116,p:9,c:20,f:.4,fi:7.9,dailyMax:350,perMealMax:220},
  broccoli:{id:'broccoli',name:'ברוקולי',cat:'fiber',k:34,p:2.8,c:6.6,f:.4,fi:2.6,dailyMax:400,perMealMax:250},
  oil:{id:'oil',name:'שמן זית',cat:'fat',k:884,p:0,c:0,f:100,fi:0,dailyMax:45,perMealMax:20},
  oats:{id:'oats',name:'שיבולת שועל',cat:'carb',k:389,p:16.9,c:66.3,f:6.9,fi:10.6,dailyMax:140,perMealMax:100},
  apple:{id:'apple',name:'תפוח',cat:'fiber',k:52,p:.3,c:13.8,f:.2,fi:2.4,dailyMax:360,perMealMax:200},
};

function identities(result){return result.items.map(x=>Meals.foodIdentity(x.f));}

test('planner uses several unique foods before pushing one convenient food to an extreme amount',()=>{
  const result=Planner.planDay({
    foods:[foods.rice,foods.chicken,foods.lentils,foods.oil,foods.oats,foods.apple],
    fallbackFoods:[],targets:TARGET,mealCount:3,mode:'strict',savedFoodIds:[]
  });
  const ids=identities(result);
  assert.equal(ids.length,new Set(ids).size);
  assert.ok(ids.length>=4,`expected variety, got ${ids.join(',')}`);
  const rice=result.items.find(x=>x.f.id==='rice');
  assert.ok(!rice||rice.q<450,'rice should not be maxed before diversity is used');
});

test('strict mode never adds fallback food while automatic mode may add it to improve structure',()=>{
  const strict=Planner.planDay({foods:[foods.chicken],fallbackFoods:[foods.rice,foods.oil,foods.broccoli],targets:TARGET,mealCount:3,mode:'strict',savedFoodIds:[]});
  assert.deepEqual(strict.addedFoodIds,[]);
  assert.deepEqual(identities(strict),['chicken']);

  const auto=Planner.planDay({foods:[foods.chicken],fallbackFoods:[foods.rice,foods.oil,foods.broccoli],targets:TARGET,mealCount:3,mode:'auto',savedFoodIds:[]});
  assert.ok(auto.addedFoodIds.length>0);
  assert.ok(auto.items.some(x=>x.f.id!=='chicken'));
});

test('saved food wins between similar choices but is not forced when it is nutritionally poor',()=>{
  const similarA={id:'protein-a',name:'A',cat:'protein',k:150,p:28,c:2,f:3,fi:0,dailyMax:250,perMealMax:200};
  const similarB={id:'protein-b',name:'B',cat:'protein',k:152,p:28,c:2,f:3,fi:0,dailyMax:250,perMealMax:200};
  const preferred=Planner.planDay({foods:[similarA,similarB,foods.rice,foods.oil,foods.broccoli],fallbackFoods:[],targets:TARGET,mealCount:3,mode:'strict',savedFoodIds:['protein-b']});
  assert.ok(preferred.items.some(x=>x.f.id==='protein-b'));

  const poor={id:'poor-saved',name:'Poor',cat:'protein',k:900,p:1,c:1,f:90,fi:0,dailyMax:30,perMealMax:30};
  const sensible=Planner.planDay({foods:[poor,foods.chicken,foods.rice,foods.lentils,foods.oil],fallbackFoods:[],targets:TARGET,mealCount:3,mode:'strict',savedFoodIds:['poor-saved']});
  assert.ok(sensible.items.some(x=>x.f.id==='chicken'));
  assert.ok(!sensible.items.some(x=>x.f.id==='poor-saved'),'saved preference must not force a harmful fit');
});

test('planner respects daily and per-meal ceilings and reports an explicit gap when targets are impossible',()=>{
  const tiny={id:'tiny',name:'Tiny',cat:'carb',k:100,p:1,c:20,f:0,fi:1,dailyMax:50,perMealMax:40};
  const result=Planner.planDay({foods:[tiny],fallbackFoods:[],targets:TARGET,mealCount:3,mode:'strict',savedFoodIds:[]});
  const item=result.items[0];
  assert.ok(item.q<=40);
  assert.ok(result.gaps.some(x=>/קלור|אנרג/.test(x)));
});

test('too few strict foods leave meal slots empty and report insufficient variety instead of cloning foods',()=>{
  const result=Planner.planDay({foods:[foods.chicken,foods.rice],fallbackFoods:[],targets:TARGET,mealCount:4,mode:'strict',savedFoodIds:[]});
  const ids=result.meals.flatMap(m=>m.items).map(x=>Meals.foodIdentity(x.f));
  assert.equal(ids.length,new Set(ids).size);
  assert.equal(result.meals.length,4);
  assert.ok(result.meals.some(m=>m.items.length===0));
  assert.ok(result.gaps.some(x=>/גיוון|ייחוד|ארוחות/.test(x)));
});

test('planner output exposes target and quality diagnostics',()=>{
  const result=Planner.planDay({foods:[foods.chicken,foods.rice,foods.lentils,foods.oil],fallbackFoods:[],targets:TARGET,mealCount:3,mode:'strict',savedFoodIds:[]});
  assert.ok(result.targetDiagnostics);
  assert.ok(result.qualityDiagnostics);
  assert.equal(result.qualityDiagnostics.uniqueFoods,result.items.length);
});

test('builder build path loads and calls the professional planner',()=>{
  const html=readFileSync(new URL('../nutrition-builder.html',import.meta.url),'utf8');
  assert.match(html,/nutrition-planner\.js/);
  const build=html.match(/function buildMenu\(\)\{([\s\S]*?)\n\}\n\nfunction renderMenu/);
  assert.ok(build,'buildMenu function should be present');
  assert.match(build[1],/NutritionPlanner\.planDay/);
  assert.doesNotMatch(build[1],/optimize\(/);
});
