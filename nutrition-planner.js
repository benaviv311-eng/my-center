(function(root,factory){
  let Meals=root?.NutritionMeals;
  if(typeof module==='object'&&module.exports){Meals=require('./nutrition-meals.js');module.exports=factory(Meals);return;}
  if(root)root.NutritionPlanner=factory(Meals);
})(typeof window!=='undefined'?window:globalThis,function(Meals){
'use strict';

const NUTRIENTS={cal:'k',protein:'p',carbs:'c',fat:'f',fiber:'fi'};
function num(v){return Meals?.nullableNumber?Meals.nullableNumber(v):(Number.isFinite(Number(v))?Number(v):null)}
function id(food){return Meals?.foodIdentity?Meals.foodIdentity(food):String(food?.id||food?.name||'')}
function limit(food){const n=num(food?.dailyMax);if(n!==null)return Math.max(0,n);const m=num(food?.max);return m!==null?Math.max(0,m):500}
function startAmount(food){const cap=limit(food);if(cap<=0)return 0;if(food.cat==='fat')return Math.min(cap,15);if(food.cat==='fruit')return Math.min(cap,150);return Math.min(cap,100)}
function category(food){const c=food?.cat||'other';if(c==='legume')return 'protein-fiber';if(c==='fruit'||c==='vegetable')return 'produce';return c}
function uniqueFoods(list){const m=new Map();for(const f of list||[]){const k=id(f);if(k&&!m.has(k))m.set(k,f)}return [...m.values()]}
function savedSet(saved){return new Set((saved||[]).map(x=>typeof x==='string'?x:id(x)))}
function rankFoods(list,saved){return [...list].sort((a,b)=>{const sa=saved.has(id(a))?1:0,sb=saved.has(id(b))?1:0;if(sa!==sb)return sb-sa;const ca=category(a),cb=category(b);if(ca!==cb)return ca.localeCompare(cb);return id(a).localeCompare(id(b))})}

function selectInitial(current,fallback,mode,saved,mealCount){
  const selected=[];const added=[];const seen=new Set();
  const add=(f,isFallback=false)=>{const k=id(f);if(!k||seen.has(k)||limit(f)<=0)return false;seen.add(k);selected.push(f);if(isFallback)added.push(k);return true};
  const currentRank=rankFoods(current,saved);
  const categories=['protein','carb','produce','fiber','protein-fiber','fat'];
  for(const c of categories){const f=currentRank.find(x=>category(x)===c&&!seen.has(id(x)));if(f)add(f)}
  const desired=Math.min(Math.max(4,mealCount),7);
  for(const f of currentRank){if(selected.length>=desired)break;add(f)}
  if(mode==='auto'){
    const fallbackRank=rankFoods(fallback,saved);
    for(const c of categories){if(selected.some(x=>category(x)===c))continue;const f=fallbackRank.find(x=>category(x)===c&&!seen.has(id(x)));if(f)add(f,true)}
    for(const f of fallbackRank){if(selected.length>=desired)break;add(f,true)}
  }
  return {selected,added};
}

function totals(items){
  const out={cal:0,protein:0,carbs:0,fat:0,fiber:0};const unknown={};
  for(const key of Object.keys(NUTRIENTS))unknown[key]=false;
  for(const {f,q} of items){
    for(const [key,field] of Object.entries(NUTRIENTS)){
      const v=num(f?.[field]);if(v===null){unknown[key]=true;continue}out[key]+=v*q/100;
    }
  }
  for(const key of Object.keys(out)){if(unknown[key])out[key]=null;else out[key]=Math.round(out[key]*10)/10}
  return out;
}
function targetLoss(t,target){
  const weights={cal:2,protein:1.4,carbs:.8,fat:.8,fiber:1.1};let s=0;
  for(const key of Object.keys(weights)){if(t[key]===null||!target?.[key])continue;const d=(t[key]-target[key])/target[key];s+=weights[key]*d*d*(key==='cal'&&d>0?1.7:1)}return s;
}
function optimizeAmounts(selected,target){
  const items=selected.map(f=>({f,q:startAmount(f)})).filter(x=>x.q>0);
  let best=targetLoss(totals(items),target);
  for(let iter=0;iter<2500;iter++){
    let choice=null;
    for(let i=0;i<items.length;i++){
      const item=items[i],cap=limit(item.f);if(item.q+10>cap+1e-9)continue;
      item.q+=10;const score=targetLoss(totals(items),target);item.q-=10;
      const concentrationPenalty=(item.q+10)/Math.max(1,cap)>.85?.01:0;
      const adjusted=score+concentrationPenalty;
      if(!choice||adjusted<choice.score-1e-10){choice={i,score:adjusted,raw:score}}
    }
    if(!choice||choice.raw>=best-1e-7)break;
    items[choice.i].q+=10;best=choice.raw;
  }
  return items;
}
function targetDiagnostics(total,target){return Object.keys(NUTRIENTS).map(key=>{const value=total[key],goal=target?.[key];if(value===null)return {key,status:'unknown',value:null,target:goal??null};if(!goal)return {key,status:'no-target',value,target:goal??null};const ratio=value/goal;return {key,status:ratio<.85?'low':ratio>1.15?'high':'ok',value,target:goal,ratio}})}
function qualityDiagnostics(items,meals,total,target,sportMode,available){
  const q=[];const cats=new Set(items.map(x=>category(x.f)));const unique=items.length;
  q.push({code:'unique-foods',status:unique>=4?'good':'warn',message:`${unique} מאכלים ייחודיים ביום`});
  q.push({code:'category-coverage',status:cats.size>=3?'good':'warn',message:`${cats.size} קבוצות מזון שונות`});
  if(unique<Math.min(4,meals.length))q.push({code:'insufficient-variety',status:'warn',message:'אין מספיק מאכלים ייחודיים כדי למלא את מספר הארוחות בלי כפילויות.'});
  if(meals.some(m=>m.items.length===0))q.push({code:'empty-meals',status:'warn',message:'חלק מהארוחות נשארו ללא מאכל ייחודי; עדיף להוסיף אפשרות מזון נוספת.'});
  const dayCal=total.cal;
  if(dayCal&&dayCal>0){const shares=items.map(x=>({id:id(x.f),share:(num(x.f.k)||0)*x.q/100/dayCal}));const max=shares.sort((a,b)=>b.share-a.share)[0];if(max?.share>.45)q.push({code:'energy-concentration',status:'warn',message:'חלק גדול מדי מהאנרגיה מגיע ממאכל אחד.'})}
  const produceAvailable=(available||[]).some(f=>['produce','fruit','vegetable','fiber'].includes(category(f)));
  if(produceAvailable)q.push({code:'produce',status:items.some(x=>['produce','fruit','vegetable','fiber'].includes(category(x.f)))?'good':'warn',message:'נוכחות פרי/ירק או מזון עשיר בסיבים'});
  if(sportMode){
    const mealProtein=meals.map(m=>totals(m.items).protein).filter(v=>v!==null);
    const concentrated=mealProtein.length&&Math.max(...mealProtein)>(target?.protein||0)*.55;
    q.push({code:concentrated?'sport-protein-distribution':'sport-carbohydrate-availability',status:concentrated?'warn':'good',message:concentrated?'החלבון מרוכז מדי בארוחה אחת.':'פיזור האנרגיה מתאים יותר ליום פעיל; תזמון סביב אימון יתווסף רק כשמגדירים שעת אימון.'});
  }
  return q;
}
function gapsFrom(diags,quality){
  const names={cal:'קלוריות',protein:'חלבון',carbs:'פחמימות',fat:'שומן',fiber:'סיבים'};const out=[];
  for(const d of diags){if(d.status==='low')out.push(`חסר ${names[d.key]}: ${Math.round(d.value)} מתוך ${Math.round(d.target)}`);else if(d.status==='unknown')out.push(`אין מספיק נתונים כדי לחשב ${names[d.key]}`)}
  if(quality.some(x=>x.code==='insufficient-variety'))out.push('חסר גיוון כדי לבנות את כל הארוחות בלי לחזור על אותו מאכל.');return out;
}
function planDay({foods=[],fallbackFoods=[],targets={},mealCount=3,mode='strict',savedFoodIds=[],sportMode=false}={}){
  const current=uniqueFoods(foods),fallback=uniqueFoods(fallbackFoods).filter(f=>!current.some(x=>id(x)===id(f)));
  const saved=savedSet(savedFoodIds);const picked=selectInitial(current,fallback,mode,saved,Meals?.normalizeMealCount?Meals.normalizeMealCount(mealCount):mealCount);
  const items=Meals?.mergeDuplicateFoods?Meals.mergeDuplicateFoods(optimizeAmounts(picked.selected,targets)):optimizeAmounts(picked.selected,targets);
  const meals=Meals?.assignUniqueFoodsToMeals?Meals.assignUniqueFoodsToMeals(items,mealCount):[];
  const total=totals(items);const targetDiags=targetDiagnostics(total,targets);const quality=qualityDiagnostics(items,meals,total,targets,sportMode,[...current,...fallback]);
  return {items,meals,totals:total,targetDiagnostics:targetDiags,qualityDiagnostics:quality,gaps:gapsFrom(targetDiags,quality),addedFoodIds:picked.added};
}
return {planDay,totals,targetDiagnostics,qualityDiagnostics};
});
