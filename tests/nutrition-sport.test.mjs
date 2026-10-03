import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Profile from '../nutrition-profile.js';
import Planner from '../nutrition-planner.js';

function fakeStorage(){const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}

const TARGET={cal:2400,protein:150,carbs:320,fat:70,fiber:30};
const foods=[
  {id:'chicken',name:'חזה עוף',cat:'protein',k:165,p:31,c:0,f:3.6,fi:0,dailyMax:350,perMealMax:220},
  {id:'yogurt',name:'יוגורט',cat:'protein',k:98,p:9,c:4,f:5,fi:0,dailyMax:350,perMealMax:250},
  {id:'oats',name:'שיבולת שועל',cat:'carb',k:389,p:16.9,c:66.3,f:6.9,fi:10.6,dailyMax:140,perMealMax:100},
  {id:'rice',name:'אורז מבושל',cat:'carb',k:130,p:2.7,c:28,f:.3,fi:.4,dailyMax:450,perMealMax:250},
  {id:'banana',name:'בננה',cat:'fiber',k:89,p:1.1,c:22.8,f:.3,fi:2.6,dailyMax:240,perMealMax:160},
  {id:'oil',name:'שמן זית',cat:'fat',k:884,p:0,c:0,f:100,fi:0,dailyMax:45,perMealMax:20}
];

test('sport mode defaults false and persists when explicitly enabled',()=>{
  const normalized=Profile.normalizeProfile({mealCount:3,savedFoods:[]});
  assert.equal(normalized.sportMode,false);
  const storage=fakeStorage();
  Profile.save(storage,{mealCount:3,savedFoods:[],sportMode:true});
  assert.equal(Profile.load(storage).sportMode,true);
});

test('sport overlay reports carbohydrate emphasis for active performance context and never invents workout timing',()=>{
  const result=Planner.planDay({foods,fallbackFoods:[],targets:TARGET,mealCount:4,mode:'strict',sportMode:true,activity:4,goal:'performance'});
  assert.equal(result.sportDiagnostics.enabled,true);
  assert.equal(result.sportDiagnostics.carbohydrateEmphasis,true);
  assert.equal(result.sportDiagnostics.timingApplied,false);
  assert.ok(result.meals.every(m=>/^ארוחה \d+$/.test(m.name)));
  assert.ok(!JSON.stringify(result).match(/pre-workout|post-workout|לפני אימון|אחרי אימון/));
});

test('sport overlay evaluates protein concentration across meals',()=>{
  const result=Planner.planDay({foods,fallbackFoods:[],targets:TARGET,mealCount:4,mode:'strict',sportMode:true,activity:4,goal:'performance'});
  assert.equal(typeof result.sportDiagnostics.proteinConcentrationPct,'number');
  assert.equal(typeof result.sportDiagnostics.proteinConcentrationWarning,'boolean');
});

test('sport mode increases carbohydrate fitting priority in active performance context',()=>{
  const regular=Planner.planDay({foods,fallbackFoods:[],targets:TARGET,mealCount:4,mode:'strict',sportMode:false,activity:4,goal:'performance'});
  const sport=Planner.planDay({foods,fallbackFoods:[],targets:TARGET,mealCount:4,mode:'strict',sportMode:true,activity:4,goal:'performance'});
  const regularGap=Math.abs(TARGET.carbs-regular.totals.carbs);
  const sportGap=Math.abs(TARGET.carbs-sport.totals.carbs);
  assert.ok(sportGap<=regularGap,`sport carb gap ${sportGap} should not exceed regular ${regularGap}`);
});

test('builder exposes sport mode in the profile and passes activity and goal to the planner',()=>{
  const profile=readFileSync(new URL('../nutrition-profile.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../nutrition-builder.html',import.meta.url),'utf8');
  assert.match(profile,/מצב ספורט/);
  assert.match(profile,/sportMode/);
  const build=html.match(/NutritionPlanner\.planDay\(\{([\s\S]*?)\}\);/);
  assert.ok(build);
  assert.match(build[1],/activity:/);
  assert.match(build[1],/goal:/);
});
