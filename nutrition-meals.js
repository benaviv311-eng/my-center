(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NutritionMeals=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function normalizeMealCount(value){
    const n=Math.round(Number(value));
    if(!Number.isFinite(n))return 3;
    return Math.min(6,Math.max(1,n));
  }

  function createMealShells(count){
    const n=normalizeMealCount(count);
    return Array.from({length:n},(_,i)=>({name:`ארוחה ${i+1}`,items:[]}));
  }

  function caloriesForQuantity(food,grams){
    const k=Number(food?.k)||0;
    const q=Number(grams)||0;
    return k*q/100;
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
    const explicit=Number(food?.dailyMax);
    if(Number.isFinite(explicit)&&explicit>0)return explicit;
    const legacy=Number(food?.max);
    return Number.isFinite(legacy)&&legacy>0?legacy:500;
  }

  function perMealMax(food){
    const explicit=Number(food?.perMealMax);
    if(Number.isFinite(explicit)&&explicit>0)return explicit;
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

  return {
    normalizeMealCount,
    createMealShells,
    distributeItems,
    caloriesForQuantity,
    mealCalories,
    dailyCalories,
    reasonableDailyMax
  };
});
