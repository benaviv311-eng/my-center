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
const NUTRIENTS={
  cal:{field:'k',label:'קלוריות'},
  protein:{field:'p',label:'חלבון'},
  carbs:{field:'c',label:'פחמימות'},
  fat:{field:'f',label:'שומן'},
  fiber:{field:'fi',label:'סיבים'}
};

function num(value){
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}
function nullable(value){return Meals.nullableNumber?Meals.nullableNumber(value):(value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null))}
function normalizeText(value){return String(value??'').toLowerCase().trim().replace(/[״׳'\"]/g,'').replace(/\s+/g,' ')}
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
function categoryUtility(food,saved){
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
function nutritionKnowledge(items){
  const out={};
  Object.entries(NUTRIENTS).forEach(([key,{field}])=>{
    let total=0,unknownCount=0;
    (items||[]).forEach(({f,q})=>{
      const value=nullable(f?.[field]);
      if(value===null){unknownCount++;return;}
      total+=value*(num(q)/100);
    });
    out[key]={total,unknown:unknownCount>0,unknownCount};
  });
  return out;
}
function totalsFromItems(items){
  const knowledge=nutritionKnowledge(items);
  return Object.fromEntries(Object.keys(NUTRIENTS).map(key=>[key,knowledge[key].total]));
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
function selectBest(candidates,saved){
  return [...candidates].sort((a,b)=>{
    const d=categoryUtility(b,saved)-categoryUtility(a,saved);
    return Math.abs(d)>1e-9?d:Meals.foodIdentity(a).localeCompare(Meals.foodIdentity(b));
  })[0]||null;
}
function addFood(selected,food){
  if(!food)return false;
  const id=Meals.foodIdentity(food);
  if(selected.some(x=>Meals.foodIdentity(x)===id))return false;
  selected.push(food);return true;
}
function buildSelection(current,fallback,mode,mealCount,saved){
  const selected=[];
  const currentUnique=uniqueFoods(current);
  const fallbackUnique=uniqueFoods(fallback).filter(f=>!currentUnique.some(x=>Meals.foodIdentity(x)===Meals.foodIdentity(f)));

  CATEGORY_ORDER.forEach(cat=>addFood(selected,selectBest(currentUnique.filter(f=>f.cat===cat),saved)));

  const desired=Math.min(currentUnique.length,Math.max(5,Meals.normalizeMealCount(mealCount)+2));
  const remaining=currentUnique
    .filter(f=>!selected.some(x=>Meals.foodIdentity(x)===Meals.foodIdentity(f)))
    .sort((a,b)=>categoryUtility(b,saved)-categoryUtility(a,saved)||Meals.foodIdentity(a).localeCompare(Meals.foodIdentity(b)));
  for(const food of remaining){
    if(selected.length>=desired)break;
    if(categoryUtility(food,saved)>-5)addFood(selected,food);
  }

  const added=[];
  if(mode==='auto'){
    const missingCats=CATEGORY_ORDER.filter(cat=>!selected.some(f=>f.cat===cat));
    missingCats.forEach(cat=>{
      const food=selectBest(fallbackUnique.filter(f=>f.cat===cat),saved);
      if(addFood(selected,food))added.push(Meals.foodIdentity(food));
    });
    const autoDesired=Math.max(Math.min(Meals.normalizeMealCount(mealCount)+1,6),Math.min(4,currentUnique.length+fallbackUnique.length));
    const extra=fallbackUnique
      .filter(f=>!selected.some(x=>Meals.foodIdentity(x)===Meals.foodIdentity(f)))
      .sort((a,b)=>categoryUtility(b,saved)-categoryUtility(a,saved)||Meals.foodIdentity(a).localeCompare(Meals.foodIdentity(b)));
    for(const food of extra){
      if(selected.length>=autoDesired)break;
      if(categoryUtility(food,saved)>-5&&addFood(selected,food))added.push(Meals.foodIdentity(food));
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
        const next=Math.max(10,Math.min(cap,items[i].q+step));
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
function targetDiagnostics(totals,targets,knowledge){
  return Object.fromEntries(Object.entries(NUTRIENTS).map(([key,{label}])=>{
    const actual=num(totals[key]),goal=num(targets?.[key]),unknown=Boolean(knowledge?.[key]?.unknown);
    if(unknown)return [key,{label,actual,goal,pct:null,unknown:true,status:'unknown',unknownCount:knowledge[key].unknownCount}];
    const pct=goal>0?Math.round(actual/goal*100):null;
    const status=pct===null?'unknown':pct<85?'low':pct>115?'high':'ok';
    return [key,{label,actual,goal,pct,unknown:false,status}];
  }));
}
function isProduce(food){
  const t=normalizeText(`${food?.id||''} ${food?.name||''}`);
  return /(apple|banana|orange|berries|blueberries|broccoli|carrot|tomato|cucumber|pepper|lettuce|spinach|תפוח|בננה|תפוז|אוכמנ|פטל|ברוקולי|גזר|עגבנ|מלפפון|פלפל|חסה|תרד|ירק|פרי)/.test(t);
}
function isWholeGrainOrLegume(food){
  const t=normalizeText(`${food?.id||''} ${food?.name||''}`);
  return /(lentil|chickpea|bean|oat|quinoa|brownrice|whole|עדש|חומוס|שעוע|שיבולת|קוואקר|קינואה|אורז מלא|לחם מלא|פיתה מלאה|דגן מלא)/.test(t);
}
function qualityDiagnostics(items,meals){
  const unique=Meals.mergeDuplicateFoods(items||[]);
  const categories=[...new Set(unique.map(x=>x.f.cat).filter(Boolean))];
  const totalCal=unique.reduce((s,x)=>s+Meals.caloriesForQuantity(x.f,x.q),0);
  const maxCal=unique.reduce((m,x)=>Math.max(m,Meals.caloriesForQuantity(x.f,x.q)),0);
  const concentrationPct=totalCal>0?Math.round(maxCal/totalCal*100):0;
  const producePresent=unique.some(x=>isProduce(x.f));
  const wholeGrainOrLegumePresent=unique.some(x=>isWholeGrainOrLegume(x.f));
  const portionsReasonable=unique.every(x=>num(x.q)<=maxAmount(x.f)+1e-9);
  const emptyMeals=(meals||[]).filter(m=>!m.items?.length).length;
  const messages=[];
  messages.push(`${unique.length} מאכלים ייחודיים בתפריט`);
  messages.push(producePresent?'יש פרי או ירק בתפריט':'לא זוהה פרי או ירק בתפריט');
  messages.push(wholeGrainOrLegumePresent?'יש דגן מלא או קטנייה':'לא זוהה דגן מלא או קטנייה');
  if(concentrationPct>=50)messages.push(`ריכוז גבוה: כ-${concentrationPct}% מהקלוריות מגיעות ממאכל אחד`);
  else messages.push('האנרגיה מפוזרת בין כמה מאכלים');
  messages.push(portionsReasonable?'הכמויות בתוך מגבלות המנה':'זוהתה כמות שחורגת ממגבלת מנה');
  if(emptyMeals)messages.push(`${emptyMeals} ארוחות נשארו ללא מאכל ייחודי`);
  return {uniqueFoods:unique.length,categoryCoverage:categories,producePresent,wholeGrainOrLegumePresent,energyConcentrationPct:concentrationPct,concentrationWarning:concentrationPct>=50,portionsReasonable,emptyMeals,messages};
}
function makeGaps(totals,targets,meals,uniqueCount,mealCount,diagnostics){
  const gaps=[];
  const checks=[['cal','קלוריות',.9],['protein','חלבון',.85],['fiber','סיבים',.8]];
  checks.forEach(([key,label,min])=>{
    const d=diagnostics[key];
    if(d?.unknown){gaps.push(`אין נתון מלא עבור ${label}, ולכן לא ניתן לקבוע אם היעד הושג`);return;}
    if(num(targets?.[key])>0&&num(totals[key])<targets[key]*min){
      if(key==='cal')gaps.push(`חסרות כ-${Math.round(targets.cal-totals.cal)} קלוריות כדי להגיע ליעד`);
      else gaps.push(`חסרים כ-${Math.round(targets[key]-totals[key])} גרם ${label}`);
    }
  });
  const empty=meals.filter(m=>!m.items.length).length;
  if(empty>0)gaps.push(`אין מספיק מאכלים ייחודיים כדי למלא ${Meals.normalizeMealCount(mealCount)} ארוחות בלי לחזור על אותו מאכל`);
  if(uniqueCount<Math.min(4,Meals.normalizeMealCount(mealCount)+1))gaps.push('הגיוון היומי נמוך; כדאי להוסיף עוד מאכלים מקבוצות שונות');
  return gaps;
}
function emptyResult(targets,count,sportMode){
  const meals=Meals.createMealShells(count),items=[],knowledge=nutritionKnowledge(items),totals=totalsFromItems(items),diagnostics=targetDiagnostics(totals,targets,knowledge);
  return {items,meals,totals,nutrientKnowledge:knowledge,targetDiagnostics:diagnostics,qualityDiagnostics:qualityDiagnostics(items,meals),gaps:['לא נבחרו מאכלים זמינים לבניית תפריט'],addedFoodIds:[],sportMode:Boolean(sportMode)};
}
function planDay({foods=[],fallbackFoods=[],targets={},mealCount=3,mode='strict',savedFoodIds=[],sportMode=false}={}){
  const count=Meals.normalizeMealCount(mealCount);
  const saved=normalizedSaved(savedFoodIds);
  const {selected,added}=buildSelection(foods,fallbackFoods,mode,count,saved);
  if(!selected.length)return emptyResult(targets,count,sportMode);
  const optimized=optimizeQuantities(selected,targets);
  const items=Meals.mergeDuplicateFoods(optimized.items);
  const meals=Meals.assignUniqueFoodsToMeals(items,count);
  const knowledge=nutritionKnowledge(items);
  const totals=totalsFromItems(items);
  const diagnostics=targetDiagnostics(totals,targets,knowledge);
  return {
    items,
    meals,
    totals,
    nutrientKnowledge:knowledge,
    targetDiagnostics:diagnostics,
    qualityDiagnostics:qualityDiagnostics(items,meals),
    gaps:makeGaps(totals,targets,meals,items.length,count,diagnostics),
    addedFoodIds:added,
    sportMode:Boolean(sportMode)
  };
}

return {planDay,totalsFromItems,targetLoss,nutritionKnowledge,qualityDiagnostics};
});
