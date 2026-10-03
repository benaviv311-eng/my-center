(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NutritionMeals=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const BROWN_RICE_COOKED={
    id:'brownrice-cooked',name:'אורז מלא מבושל',aliases:['אורז מלא מבושל','אורז חום מבושל'],
    p:2.6,c:23,f:0.9,fi:1.8,k:111,cat:'carb',max:450,dailyMax:450,perMealMax:250,
    measures:[{name:'כוס',plural:'כוסות',grams:195}]
  };
  const BROWN_RICE_DRY={
    id:'brownrice-dry',name:'אורז מלא יבש (לפני בישול)',aliases:['אורז מלא יבש','אורז חום יבש','אורז מלא לפני בישול','אורז חום לפני בישול'],
    p:7.3,c:76.7,f:3.3,fi:3,k:366,cat:'carb',max:180,dailyMax:180,perMealMax:100
  };

  function normalizeText(value){
    return String(value??'').toLowerCase().trim().replace(/[״׳'\"]/g,'').replace(/\s+/g,' ');
  }

  function isGenericBrownRice(text){
    const n=normalizeText(text);
    return n==='אורז מלא'||n==='אורז חום';
  }

  function preparedFoodFor(text){
    const n=normalizeText(text);
    if(isGenericBrownRice(n))return null;
    if(BROWN_RICE_COOKED.aliases.some(a=>normalizeText(a)===n))return {...BROWN_RICE_COOKED,aliases:[...BROWN_RICE_COOKED.aliases],measures:BROWN_RICE_COOKED.measures.map(x=>({...x}))};
    if(BROWN_RICE_DRY.aliases.some(a=>normalizeText(a)===n))return {...BROWN_RICE_DRY,aliases:[...BROWN_RICE_DRY.aliases]};
    return null;
  }

  function preparationChoices(text){
    if(!isGenericBrownRice(text))return [];
    return [
      {label:'מבושל',food:{...BROWN_RICE_COOKED,aliases:[...BROWN_RICE_COOKED.aliases],measures:BROWN_RICE_COOKED.measures.map(x=>({...x}))}},
      {label:'יבש / לפני בישול',food:{...BROWN_RICE_DRY,aliases:[...BROWN_RICE_DRY.aliases]}}
    ];
  }

  function normalizeMealCount(value){
    const n=Math.round(Number(value));
    if(!Number.isFinite(n))return 3;
    return Math.min(6,Math.max(1,n));
  }

  function createMealShells(count){
    const n=normalizeMealCount(count);
    return Array.from({length:n},(_,i)=>({name:`ארוחה ${i+1}`,items:[]}));
  }

  function nullableNumber(value){
    if(typeof value==='number')return Number.isFinite(value)?value:null;
    if(typeof value!=='string'||!value.trim())return null;
    const normalized=value.trim().replace(',','.');
    if(!/^-?\d+(?:\.\d+)?$/.test(normalized))return null;
    const n=Number(normalized);
    return Number.isFinite(n)?n:null;
  }

  function foodIdentity(food){
    if(!food)return '';
    const id=String(food.id||food.code||food.name||'').trim();
    const prep=String(food.preparation||'').trim();
    if(!prep||/-cooked$|-dry$/.test(id))return id;
    return `${id}::${prep}`;
  }

  function mergeDuplicateFoods(items){
    const map=new Map();
    (items||[]).forEach(item=>{
      const q=Number(item?.q)||0;
      if(q<=0||!item?.f)return;
      const key=foodIdentity(item.f);
      if(!key)return;
      const existing=map.get(key);
      if(existing)existing.q+=q;
      else map.set(key,{f:item.f,q});
    });
    return [...map.values()];
  }

  function caloriesForQuantity(food,grams){
    const k=nullableNumber(food?.k);
    const q=nullableNumber(grams);
    if(k===null||q===null)return 0;
    return k*q/100;
  }

  function roundedNutritionValue(value){
    if(!Number.isFinite(value))return value;
    if(Math.abs(value)>=100)return Math.round(value*10)/10;
    return Math.round(value*100)/100;
  }

  function nutrientsForQuantity(data,grams){
    const amount=nullableNumber(grams);
    const factor=amount!==null&&amount>=0?amount/100:1;
    return Object.fromEntries(Object.entries(data||{}).map(([key,value])=>{
      const n=nullableNumber(value);
      return [key,n===null?value:roundedNutritionValue(n*factor)];
    }));
  }

  function caloriesOf(item){
    return caloriesForQuantity(item?.f,item?.q);
  }

  function mealCalories(meal){
    return (meal?.items||[]).reduce((sum,item)=>sum+caloriesOf(item),0);
  }

  function dailyCalories(meals){
    return (meals||[]).reduce((sum,meal)=>sum+mealCalories(meal),0);
  }

  function reasonableDailyMax(food){
    const explicit=nullableNumber(food?.dailyMax);
    if(explicit!==null&&explicit>0)return explicit;
    const legacy=nullableNumber(food?.max);
    return legacy!==null&&legacy>0?legacy:500;
  }

  function perMealMax(food){
    const explicit=nullableNumber(food?.perMealMax);
    if(explicit!==null&&explicit>0)return explicit;
    return Infinity;
  }

  function chunkByPortion(item){
    const total=Number(item?.q)||0;
    if(total<=0)return [];
    const cap=perMealMax(item.f);
    if(!Number.isFinite(cap)||total<=cap)return [{f:item.f,q:total}];
    const out=[];
    let left=total;
    while(left>0){
      const q=Math.min(cap,left);
      out.push({f:item.f,q});
      left-=q;
    }
    return out;
  }

  function splitLargest(portions){
    let idx=-1;
    let best=-1;
    portions.forEach((item,i)=>{
      const q=Number(item.q)||0;
      if(q>best&&q>=20){best=q;idx=i;}
    });
    if(idx<0)return false;
    const item=portions[idx];
    const half=item.q/2;
    portions.splice(idx,1,{...item,q:half},{...item,q:item.q-half});
    return true;
  }

  function distributeItems(items,count){
    const meals=createMealShells(count);
    const portions=(items||[])
      .filter(x=>Number(x?.q)>0)
      .flatMap(x=>chunkByPortion({f:x.f,q:Number(x.q)}));
    while(portions.length<meals.length){
      if(!splitLargest(portions))break;
    }
    const loads=meals.map(()=>0);
    portions.sort((a,b)=>caloriesOf(b)-caloriesOf(a));
    portions.forEach(item=>{
      let idx=0;
      for(let i=1;i<loads.length;i++)if(loads[i]<loads[idx])idx=i;
      meals[idx].items.push(item);
      loads[idx]+=caloriesOf(item);
    });
    return meals;
  }

  function assignUniqueFoodsToMeals(items,count){
    const meals=createMealShells(count);
    const unique=mergeDuplicateFoods(items).sort((a,b)=>caloriesOf(b)-caloriesOf(a));
    const loads=meals.map(()=>0);
    unique.forEach(item=>{
      let idx=0;
      for(let i=1;i<loads.length;i++)if(loads[i]<loads[idx])idx=i;
      meals[idx].items.push(item);
      loads[idx]+=caloriesOf(item);
    });
    return meals;
  }

  return {
    normalizeMealCount,
    createMealShells,
    distributeItems,
    assignUniqueFoodsToMeals,
    foodIdentity,
    mergeDuplicateFoods,
    nullableNumber,
    caloriesForQuantity,
    nutrientsForQuantity,
    mealCalories,
    dailyCalories,
    reasonableDailyMax,
    preparationChoices,
    preparedFoodFor
  };
});
