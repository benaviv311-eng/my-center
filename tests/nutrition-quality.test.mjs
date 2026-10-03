import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Meals from '../nutrition-meals.js';
import Planner from '../nutrition-planner.js';

const TARGET={cal:2200,protein:130,carbs:260,fat:70,fiber:30};

const foods=[
  {id:'chicken',name:'חזה עוף',cat:'protein',k:165,p:31,c:0,f:3.6,fi:0,dailyMax:350,perMealMax:220},
  {id:'oats',name:'שיבולת שועל מלאה',cat:'carb',k:389,p:16.9,c:66.3,f:6.9,fi:10.6,dailyMax:140,perMealMax:100},
  {id:'lentils',name:'עדשים מבושלות',cat:'fiber',k:116,p:9,c:20,f:.4,fi:7.9,dailyMax:350,perMealMax:220},
  {id:'apple',name:'תפוח',cat:'fiber',k:52,p:.3,c:13.8,f:.2,fi:2.4,dailyMax:360,perMealMax:200},
  {id:'broccoli',name:'ברוקולי',cat:'fiber',k:34,p:2.8,c:6.6,f:.4,fi:2.6,dailyMax:400,perMealMax:250},
  {id:'oliveoil',name:'שמן זית',cat:'fat',k:884,p:0,c:0,f:100,fi:0,dailyMax:45,perMealMax:20}
];

test('missing nutrient stays unknown when serving values are scaled',()=>{
  const scaled=Meals.nutrientsForQuantity({protein:null,food_energy:100,iron:''},150);
  assert.equal(scaled.protein,null);
  assert.equal(scaled.iron,null);
  assert.equal(scaled.food_energy,150);
});

test('target diagnostics mark incomplete nutrient knowledge as unknown rather than deficient from a fabricated zero',()=>{
  const unknownProtein={id:'mystery',name:'מזון ללא חלבון ידוע',cat:'carb',k:200,p:null,c:40,f:2,fi:3,dailyMax:150,perMealMax:150};
  const result=Planner.planDay({foods:[unknownProtein],fallbackFoods:[],targets:TARGET,mealCount:1,mode:'strict'});
  assert.equal(result.targetDiagnostics.protein.unknown,true);
  assert.equal(result.targetDiagnostics.protein.status,'unknown');
  assert.ok(result.gaps.some(x=>/אין נתון מלא.*חלבון/.test(x)));
  assert.ok(!result.gaps.some(x=>/^חסרים.*חלבון/.test(x)));
});

test('quality diagnostics describe diversity, food groups, produce, whole grain or legume, concentration and portions',()=>{
  const result=Planner.planDay({foods,fallbackFoods:[],targets:TARGET,mealCount:3,mode:'strict'});
  const q=result.qualityDiagnostics;
  assert.equal(q.uniqueFoods,result.items.length);
  assert.ok(q.categoryCoverage.includes('protein'));
  assert.equal(q.producePresent,true);
  assert.equal(q.wholeGrainOrLegumePresent,true);
  assert.equal(typeof q.energyConcentrationPct,'number');
  assert.equal(typeof q.concentrationWarning,'boolean');
  assert.equal(q.portionsReasonable,true);
  assert.equal(typeof q.emptyMeals,'number');
  assert.ok(Array.isArray(q.messages));
  assert.ok(q.messages.length>0);
});

test('a day dominated by one food raises a concentration warning',()=>{
  const dominant={id:'dense',name:'מזון מרוכז',cat:'fat',k:900,p:1,c:1,f:99,fi:0,dailyMax:100,perMealMax:100};
  const light={id:'apple',name:'תפוח',cat:'fiber',k:52,p:.3,c:13.8,f:.2,fi:2.4,dailyMax:100,perMealMax:100};
  const result=Planner.planDay({foods:[dominant,light],fallbackFoods:[],targets:{cal:800,protein:10,carbs:40,fat:60,fiber:10},mealCount:2,mode:'strict'});
  assert.equal(result.qualityDiagnostics.concentrationWarning,true);
  assert.ok(result.qualityDiagnostics.energyConcentrationPct>=50);
});

test('builder keeps government missing nutrients nullable and exposes separate target-fit and quality sections',()=>{
  const html=readFileSync(new URL('../nutrition-builder.html',import.meta.url),'utf8');
  const gov=html.match(/function govFoodFromRow\(r\)\{([\s\S]*?)\n\}/);
  assert.ok(gov,'govFoodFromRow should exist');
  assert.match(gov[1],/nullableNumber/);
  assert.doesNotMatch(gov[1],/const p=num\(r\.protein\)/);
  assert.match(html,/התאמה ליעדים/);
  assert.match(html,/איכות וגיוון/);
});
