(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./nutrition-meals.js'));
  }else if(root){
    root.NutritionPlanner=factory(root.NutritionMeals);
  }
})(typeof window!=='undefined'?window:globalThis,function(Meals){
'use strict';

if(!Meals)throw new Error('NutritionMeals is required');

const CATEGORY_ORDER=['protein','carb','fiber','fat'];

function num(value){
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}
function uniqueFoods(foods){
  const map=new Map();
  (foods||[]).filter(Boolean).forEach(food=>{
    const id=Meals.foodIdentity(food);
    if(id&&!map.has(id))map.set(id,food);
  });
  return [...map.values()];
}
function normalizedSaved(savedFoodIds){
  return new Set((savedFoodIds||[]).map(x=>typeof x==='string'?x:Meals.foodIdentity(x)));
}
function foodSaved(food,saved){
  const identity=Meals.foodIdentity(food);
  return saved.has(identity)||saved.has(String(food?.id||''));
}
function categoryUtility(food,saved,targets){
  const k=num(food.k),p=num(food.p),c=num(food.c),f=num(food.f),fi=num(food.fi);
  let score=0;
  if(food.cat==='protein')score=p*3-k*.02+fi*.5;
  else if(food.cat==='carb')score=c*.7+fi*1.5+p*.25-k*.005;
  else if(food.cat==='fiber')score=fi*8+p*.4-k*.01;
  else if(food.cat==='fat')score=f*.75+fi*1.5-k*.004;
  else score=p+c*.2+fi*3+f*.1-k*.01;
  if(foodSaved(food,saved))score+=10;
  if(k<=0)score-=20;
  return score;
}
function maxAmount(food){
  const daily=Meals.reasonableDailyMax(food);
  const meal=Number(food?.perMealMax);
  return Number.isFinite(meal)&&meal>0?Math.min(daily,meal):daily;
}
function baseAmount(food){
  let q=100;
  if(food.cat==='protein')q=120;
  else if(food.cat==='carb')q=num(food.k)>300?60:110;
  else if(food.cat==='fiber')q=120;
  else if(food.cat==='fat')q=num(food.k)>500?12:25;
  return Math.max(10,Math.min(maxAmount(food),q));
}
function totalsFromItems(items){
  const totals={cal:0,protein:0,carbs:0,fat:0,fiber:0};
  (items||[]).forEach(({f,q})=>{
    const factor=num(q)/100;
    totals.cal+=num(f.k)*factor;
    totals.protein+=num(f.p)*factor;
    totals.carbs+=num(f.c)*factor;
    totals.fat+=num(f.f)*factor;
    totals.fiber+=num(f.fi)*factor;
  });
  return totals;
}
function targetLoss(t,target){
  const defs=[['cal','cal',2],['protein','protein',2],['carbs','carbs',1],['fat','fat',1],['fiber','fiber',1.5]];
  return defs.reduce((sum,[actualKey,targetKey,weight])=>{
    const goal=Math.max(num(target?.[targetKey]),1);
    const delta=(num(t[actualKey])-goal)/goal;
    const over=actualKey==='cal'&&delta>0?1.8:1;
    return sum+weight*over*delta*delta;
  },0);
}
function selectBest(candidates,saved,targets){
  return [...candidates].sort((a,b)=>{
    const d=categoryUtility(b,saved,targets)-categoryUtility(a,saved,targets);
    return Math.abs(d)>1e-9?d:Meals.foodIdentity(a).localeCompare(Meals.foodIdentity(b));
  })[0]||null;
}
function addFood(selected,food){
  if(!food)return false;
  const id=Meals.foodIdentity(food);
  if(selected.some(x=>Meals.foodIdentity(x)===id))return false;
  selected.push(food);return true;
}
function buildSelection(current,fallback,mode,mealCount,saved,targets){
  const selected=[];
  const currentUnique=uniqueFoods(current);
  const fallbackUnique=uniqueFoods(fallback).filter(f=>!currentUnique.some(x=>Meals.foodIdentity(x)===Meals.foodIdentity(f)));

  CATEGORY_ORDER.forEach(cat=>{
    const candidates=currentUnique.filter(f=>f.cat===cat);
    addFood(selected,selectBest(candidates,saved,targets));
  });

  const desired=Math.min(currentUnique.length,Math.max(4,Meals.normalizeMealCount(mealCount)+1));
  const remaining=currentUnique
    .filter(f=>!selected.some(x=>Meals.foodIdentity(x)===Meals.foodIdentity(f)))
    .sort((a,b)=>categoryUtility(b,saved,targets)-categoryUtility(a,saved,targets)||Meals.foodIdentity(a).localeCompare(Meals.foodIdentity(b)));
  for(const food of remaining){
    if(selected.length>=desired)break;
    if(categoryUtility(food,saved,targets)>-5)addFood(selected,food);
  }

  const added=[];
  if(mode==='auto'){
    const missingCats=CATEGORY_ORDER.filter(cat=>!selected.some(f=>f.cat===cat));
    missingCats.forEach(cat=>{
      const food=selectBest(fallbackUnique.filter(f=>f.cat===cat),saved,targets);
      if(addFood(selected,food))added.push(Meals.foodIdentity(food));
    });
    const autoDesired=Math.max(Math.min(Meals.normalizeMealCount(mealCount)+1,6),Math.min(4,currentUnique.length+fallbackUnique.length));
    const extra=fallbackUnique
      .filter(f=>!selected.some(x=>Meals.foodIdentity(x)===Meals.foodIdentity(f)))
      .sort((a,b)=>categoryUtility(b,saved,targets)-categoryUtility(a,saved,targets)||Meals.foodIdentity(a).localeCompare(Meals.foodIdentity(b)));
    for(const food of extra){
      if(selected.length>=autoDesired)break;
      if(categoryUtility(food,saved,targets)>-5&&addFood(selected,food))added.push(Meals.foodIdentity(food));
    }
  }
  return {selected,added};
}
function optimizeQuantities(selected,targets){
  const items=selected.map(f=>({f,q:baseAmount(f)}));
  let current=totalsFromItems(items);
  let currentLoss=targetLoss(current,targets);
  for(let iter=0;iter<2500;iter++){
    let best=null;
    for(let i=0;i<items.length;i++){
      const cap=maxAmount(items[i].f);
      for(const step of [10,-10]){
        const min=10;
        const next=Math.max(min,Math.min(cap,items[i].q+step));
        if(Math.abs(next-items[i].q)<1e-9)continue;
        const trial=items.map((x,j)=>j===i?{...x,q:next}:x);
        const totals=totalsFromItems(trial);
        const loss=targetLoss(totals,targets);
        if(!best||loss<best.loss-1e-10||(Math.abs(loss-best.loss)<1e-10&&Meals.foodIdentity(items[i].f)<Meals.foodIdentity(items[best.i].f)))best={i,next,loss,totals};
      }
    }
    if(!best||best.loss>=currentLoss-1e-9)break;
    items[best.i].q=best.next;current=best.totals;currentLoss=best.loss;
  }
  return {items:Meals.mergeDuplicateFoods(items),totals:current,loss:currentLoss};
}
function targetDiagnostics(totals,targets){
  const defs=[['cal','קלוריות'],['protein','חלבון'],['carbs','פחמימות'],['fat','שומן'],['fiber','סיבים']];
  return Object.fromEntries(defs.map(([key,label])=>{
    const actual=num(totals[key]),goal=num(targets?.[key]);
    return [key,{label,actual,goal,pct:goal>0?Math.round(actual/goal*100):null}];
  }));
}
function makeGaps(totals,targets,meals,uniqueCount,mealCount){
  const gaps=[];
  if(num(targets?.cal)>0&&totals.cal<targets.cal*.9)gaps.push(`חסרות כ-${Math.round(targets.cal-totals.cal)} קלוריות כדי להגיע ליעד`);
  if(num(targets?.protein)>0&&totals.protein<targets.protein*.85)gaps.push(`חסרים כ-${Math.round(targets.protein-totals.protein)} גרם חלבון`);
  if(num(targets?.fiber)>0&&totals.fiber<targets.fiber*.8)gaps.push(`חסרים כ-${Math.round(targets.fiber-totals.fiber)} גרם סיבים`);
  const empty=meals.filter(m=>!m.items.length).length;
  if(empty>0)gaps.push(`אין מספיק מאכלים ייחודיים כדי למלא ${Meals.normalizeMealCount(mealCount)} ארוחות בלי לחזור על אותו מאכל`);
  if(uniqueCount<Math.min(4,Meals.normalizeMealCount(mealCount)+1))gaps.push('הגיוון היומי נמוך; כדאי להוסיף עוד מאכלים מקבוצות שונות');
  return gaps;
}
function planDay({foods=[],fallbackFoods=[],targets={},mealCount=3,mode='strict',savedFoodIds=[],sportMode=false}={}){
  const count=Meals.normalizeMealCount(mealCount);
  const saved=normalizedSaved(savedFoodIds);
  const {selected,added}=buildSelection(foods,fallbackFoods,mode,count,saved,targets);
  if(!selected.length){
    const meals=Meals.createMealShells(count);
    return {items:[],meals,totals:{cal:0,protein:0,carbs:0,fat:0,fiber:0},targetDiagnostics:targetDiagnostics({},targets),qualityDiagnostics:{uniqueFoods:0,categoryCoverage:[],emptyMeals:count},gaps:['לא נבחרו מאכלים זמינים לבניית תפריט'],addedFoodIds:[],sportMode:Boolean(sportMode)};
  }
  const optimized=optimizeQuantities(selected,targets);
  const items=Meals.mergeDuplicateFoods(optimized.items);
  const meals=Meals.assignUniqueFoodsToMeals(items,count);
  const totals=totalsFromItems(items);
  const categories=[...new Set(items.map(x=>x.f.cat).filter(Boolean))];
  const emptyMeals=meals.filter(m=>!m.items.length).length;
  return {
    items,
    meals,
    totals,
    targetDiagnostics:targetDiagnostics(totals,targets),
    qualityDiagnostics:{uniqueFoods:items.length,categoryCoverage:categories,emptyMeals},
    gaps:makeGaps(totals,targets,meals,items.length,count),
    addedFoodIds:added,
    sportMode:Boolean(sportMode)
  };
}

return {planDay,totalsFromItems,targetLoss};
});
