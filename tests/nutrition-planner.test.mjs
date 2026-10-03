import test from 'node:test';
import assert from 'node:assert/strict';
import Planner from '../nutrition-planner.js';

const foods=[
  {id:'chicken',name:'חזה עוף',cat:'protein',k:165,p:31,c:0,f:3.6,fi:0,dailyMax:350,perMealMax:220},
  {id:'rice',name:'אורז מלא מבושל',cat:'carb',k:111,p:2.6,c:23,f:.9,fi:1.8,dailyMax:450,perMealMax:250},
  {id:'potato',name:'תפוח אדמה',cat:'carb',k:87,p:1.9,c:20,f:.1,fi:1.8,dailyMax:500,perMealMax:300},
  {id:'broccoli',name:'ברוקולי',cat:'fiber',k:34,p:2.8,c:6.6,f:.4,fi:2.6,dailyMax:500,perMealMax:250},
  {id:'olive',name:'שמן זית',cat:'fat',k:884,p:0,c:0,f:100,fi:0,dailyMax:45,perMealMax:15},
  {id:'apple',name:'תפוח',cat:'fruit',k:52,p:.3,c:13.8,f:.2,fi:2.4,dailyMax:400,perMealMax:220},
  {id:'lentils',name:'עדשים',cat:'legume',k:116,p:9,c:20,f:.4,fi:7.9,dailyMax:400,perMealMax:220}
];
const target={cal:2200,protein:140,carbs:250,fat:70,fiber:30};

test('planner uses unique foods and prefers diversity before extreme enlargement', () => {
  const out=Planner.planDay({foods, fallbackFoods:[], targets:target, mealCount:4, mode:'strict', savedFoodIds:[]});
  const ids=out.items.map(x=>x.f.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(ids.length>=4);
  const rice=out.items.find(x=>x.f.id==='rice');
  assert.ok(!rice || rice.q<=450);
});

test('strict mode never adds fallback foods', () => {
  const out=Planner.planDay({foods:foods.slice(0,2),fallbackFoods:[foods[4],foods[5]],targets:target,mealCount:3,mode:'strict',savedFoodIds:[]});
  assert.deepEqual(out.addedFoodIds,[]);
  assert.ok(out.items.every(x=>['chicken','rice'].includes(x.f.id)));
});

test('automatic mode may add a fallback food when it improves structure', () => {
  const out=Planner.planDay({foods:foods.slice(0,2),fallbackFoods:[foods[4],foods[5],foods[3]],targets:target,mealCount:3,mode:'auto',savedFoodIds:[]});
  assert.ok(out.addedFoodIds.length>0);
});

test('saved food is preferred between similar options but not forced past constraints', () => {
  const a={id:'carb-a',name:'A',cat:'carb',k:100,p:2,c:22,f:1,fi:2,dailyMax:300};
  const b={id:'carb-b',name:'B',cat:'carb',k:101,p:2,c:22,f:1,fi:2,dailyMax:300};
  const out=Planner.planDay({foods:[a,b,{...foods[0]}],fallbackFoods:[],targets:{cal:900,protein:80,carbs:100,fat:25,fiber:15},mealCount:2,mode:'strict',savedFoodIds:['carb-b']});
  assert.ok(out.items.some(x=>x.f.id==='carb-b'));
  const impossible={id:'saved-bad',name:'bad',cat:'fat',k:900,p:0,c:0,f:100,fi:0,dailyMax:0};
  const out2=Planner.planDay({foods:[impossible,foods[0],foods[1]],fallbackFoods:[],targets:target,mealCount:2,mode:'strict',savedFoodIds:['saved-bad']});
  assert.ok(!out2.items.some(x=>x.f.id==='saved-bad'));
});

test('planner respects daily maxima and reports explicit gaps when target is impossible', () => {
  const tiny=[{id:'rice',name:'אורז',cat:'carb',k:111,p:2.6,c:23,f:.9,fi:1.8,dailyMax:100,perMealMax:100}];
  const out=Planner.planDay({foods:tiny,fallbackFoods:[],targets:target,mealCount:4,mode:'strict',savedFoodIds:[]});
  assert.ok(out.items[0].q<=100);
  assert.ok(out.gaps.length>0);
  assert.ok(out.qualityDiagnostics.some(x=>x.code==='insufficient-variety'));
  const used=out.meals.flatMap(m=>m.items).map(x=>x.f.id);
  assert.equal(new Set(used).size,used.length);
});

test('missing nutrient data remains unknown in diagnostics', () => {
  const unknown={id:'unknown',name:'לא ידוע',cat:'protein',k:100,p:null,c:10,f:2,fi:null,dailyMax:200};
  const out=Planner.planDay({foods:[unknown],fallbackFoods:[],targets:target,mealCount:1,mode:'strict',savedFoodIds:[]});
  assert.equal(out.totals.protein,null);
  assert.equal(out.totals.fiber,null);
  assert.ok(out.targetDiagnostics.some(x=>x.key==='protein'&&x.status==='unknown'));
});

test('sports overlay does not invent workout timing and checks protein distribution', () => {
  const out=Planner.planDay({foods, fallbackFoods:[], targets:target, mealCount:4, mode:'strict', savedFoodIds:[], sportMode:true});
  assert.ok(out.qualityDiagnostics.some(x=>x.code==='sport-protein-distribution'||x.code==='sport-carbohydrate-availability'));
  assert.ok(out.meals.every(m=>!['pre-workout','post-workout'].includes(m.role)));
});
