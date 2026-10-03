(function(){
'use strict';
if(!window.NutritionMeals)return;
const Meals=window.NutritionMeals;

function addOrReplaceFood(food){
  const idx=DB.findIndex(f=>f.id===food.id);
  if(idx>=0)DB[idx]=food;else DB.push(food);
}

function safeDailyCap(food){
  const current=Number(food.max)||800;
  const explicit=Number(food.dailyMax);
  if(Number.isFinite(explicit)&&explicit>0)return Math.min(current,explicit);
  const k=Number(food.k)||0;
  if(food.cat==='fat'&&k>=400)return Math.min(current,100);
  if(food.cat==='carb'&&k>=250)return Math.min(current,300);
  if(food.cat==='carb')return Math.min(current,500);
  if(food.cat==='protein')return Math.min(current,500);
  if(food.cat==='fiber'&&k>=300)return Math.min(current,250);
  if(food.cat==='fiber')return Math.min(current,800);
  return Math.min(current,500);
}

function safePerMealCap(food){
  const explicit=Number(food.perMealMax);
  if(Number.isFinite(explicit)&&explicit>0)return explicit;
  const k=Number(food.k)||0;
  if(food.cat==='fat'&&k>=400)return 50;
  if(food.cat==='carb'&&k>=250)return 150;
  if(food.cat==='carb')return 300;
  if(food.cat==='protein')return 250;
  if(food.cat==='fiber'&&k>=300)return 120;
  if(food.cat==='fiber')return 350;
  return 300;
}

function applyFoodCap(food){
  if(!food)return food;
  const daily=safeDailyCap(food);
  food.dailyMax=daily;
  food.max=daily;
  food.perMealMax=Math.min(safePerMealCap(food),daily);
  return food;
}

function installPreparedRice(){
  const old=DB.findIndex(f=>f.id==='brownrice');
  if(old>=0)DB.splice(old,1);
  Meals.preparationChoices('אורז מלא').forEach(x=>addOrReplaceFood(applyFoodCap(x.food)));
}

function applyAllCaps(){DB.forEach(applyFoodCap)}
installPreparedRice();
applyAllCaps();

function insertFood(type,text,food){
  const ready=applyFoodCap({...food,aliases:[...(food.aliases||[])]});
  addOrReplaceFood(ready);
  if(!state.foods[type].some(x=>x.id===ready.id))state.foods[type].push({raw:text,id:ready.id});
  const input=qs(type+'Input');if(input)input.value='';
  renderChips(type);
}

function choosePreparation(text,choices){
  return new Promise(resolve=>{
    const back=document.createElement('div');back.className='modal-back';
    const buttons=choices.map((x,i)=>`<button class="choice" data-i="${i}" style="min-height:86px"><strong>${x.label}</strong><small>${Math.round(x.food.k)} קק״ל ל־100 גרם</small></button>`).join('');
    back.innerHTML=`<div class="modal-card" style="max-width:520px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h2 style="margin:0">איך אתה מודד ${text}?</h2><div class="muted" style="margin-top:5px">הערכים שונים מאוד לפני ואחרי בישול.</div></div><button class="mini" data-close>✕</button></div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px">${buttons}</div></div>`;
    function done(value){back.remove();resolve(value)}
    back.querySelector('[data-close]').onclick=()=>done(null);
    back.onclick=e=>{if(e.target===back)done(null)};
    back.querySelectorAll('[data-i]').forEach(btn=>btn.onclick=()=>done(choices[Number(btn.dataset.i)]));
    document.body.appendChild(back);
  });
}

const baseAddFood=addFood;
addFood=async function(type){
  const input=qs(type+'Input'),text=input?.value.trim();
  if(!text)return;
  const choices=Meals.preparationChoices(text);
  if(choices.length){
    const picked=await choosePreparation(text,choices);
    if(picked)insertFood(type,picked.food.name,picked.food);
    return;
  }
  const prepared=Meals.preparedFoodFor(text);
  if(prepared){insertFood(type,prepared.name,prepared);return;}
  await baseAddFood(type);
  applyAllCaps();
};

const baseOptimize=optimize;
optimize=function(foods,target){
  (foods||[]).forEach(applyFoodCap);
  return baseOptimize(foods,target);
};

function calorieTolerance(target){return Math.max(50,(Number(target)||0)*.02)}
const baseIssueList=issueList;
issueList=function(res){
  const base=baseIssueList(res).filter(msg=>!String(msg).includes('קלור'));
  const target=Number(state.targets?.cal)||0,actual=Number(res?.totals?.cal)||0,diff=actual-target,tol=calorieTolerance(target);
  if(target&&Math.abs(diff)>tol){
    base.unshift(diff<0
      ? `חסרות כ-${Math.round(-diff)} קק״ל כדי להגיע ליעד. לא הגדלתי מאכל יחיד לכמות חריגה.`
      : `התפריט גבוה בכ-${Math.round(diff)} קק״ל מהיעד.`);
  }
  return [...new Set(base)];
};

function decorateCalories(){
  if(!state.result||!state.targets)return;
  const chosen=state.result.foods.map((f,i)=>({f,q:state.result.amounts[i]})).filter(x=>x.q>0);
  const count=window.getNutritionMealCount?window.getNutritionMealCount():3;
  const meals=Meals.distributeItems(chosen,count).filter(m=>m.items.length);
  const cards=[...document.querySelectorAll('#meals .meal')];
  cards.forEach((card,i)=>{
    const meal=meals[i];if(!meal)return;
    const kcal=Math.round(Meals.mealCalories(meal));
    const head=card.querySelector('.mealhead');
    if(head){
      const badge=document.createElement('span');badge.className='source-tag';badge.textContent=`${kcal} קק״ל`;head.insertBefore(badge,head.querySelector('button'));
    }
    const rows=[...card.querySelectorAll('.foodrow')];
    rows.forEach((row,j)=>{
      const item=meal.items[j],muted=row.querySelector('.muted');if(!item||!muted)return;
      muted.textContent+=` · ${Math.round(Meals.caloriesForQuantity(item.f,item.q))} קק״ל`;
    });
  });

  const actual=Math.round(Meals.dailyCalories(meals)),target=Math.round(Number(state.targets.cal)||0),diff=actual-target,tol=calorieTolerance(target);
  let box=qs('dailyCaloriesSummary');
  if(!box){box=document.createElement('div');box.id='dailyCaloriesSummary';qs('meals')?.before(box)}
  box.className='note '+(Math.abs(diff)<=tol?'success':'warn');
  const delta=diff===0?'בדיוק ביעד':diff<0?`חסרות ${Math.abs(diff)} קק״ל`:`עודף ${diff} קק״ל`;
  box.innerHTML=`<strong>סה״כ יומי: ${actual.toLocaleString('he-IL')} / ${target.toLocaleString('he-IL')} קק״ל</strong><br>${delta}.`+(Math.abs(diff)>tol&&diff<0?' המערכת עצרה לפני כמות לא סבירה של מאכל בודד; אפשר להוסיף או להחליף מקור מזון כדי להשלים את היעד.':'');
}

const baseRenderMenu=renderMenu;
renderMenu=function(unknown=[]){
  baseRenderMenu(unknown);
  decorateCalories();
};

})();
