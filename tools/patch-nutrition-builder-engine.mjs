import { readFileSync, writeFileSync } from 'node:fs';

const builderPath='nutrition-builder.html';
let html=readFileSync(builderPath,'utf8');

// Migration cleanup is intentionally idempotent so later planner/UI patches can reuse this tool.
const legacyWrite=`\n  localStorage.setItem('nutritionProfile',JSON.stringify({\n    age,w,h,sex,activity:state.activity,goal:state.goal,targets:state.targets\n  }));`;
if(html.includes(legacyWrite))html=html.replace(legacyWrite,'');
const legacyLoader=/\n\(function loadProfile\(\)\{[\s\S]*?\n\}\)\(\);\n(?=<\/script>)/;
if(legacyLoader.test(html))html=html.replace(legacyLoader,'\n');

if(!html.includes('NutritionPlanner.planDay')){
  const buildPattern=/function buildMenu\(\)\{[\s\S]*?\n\}\n\nfunction renderMenu/;
  if(!buildPattern.test(html))throw new Error('buildMenu block not found');
  const replacement=`function buildMenu(){
  if(!state.targets){calculateTargets(); if(!state.targets)return;}
  if(!window.NutritionPlanner){alert('מנוע התפריט עדיין נטען. נסה שוב בעוד רגע.');return;}
  const entered=enteredFoods();
  const unknown=Object.values(state.foods).flat().filter(x=>!x.id);
  if(state.mode==='strict' && entered.length===0){
    alert('במצב "רק ממה שיש לי" צריך לכתוב לפחות מאכל אחד.');
    return;
  }
  const profile=window.NutritionProfile?.load(localStorage)||null;
  const savedFoodIds=(profile?.savedFoods||[]).map(x=>window.NutritionProfile?.foodIdentity(x)||x.id).filter(Boolean);
  const mealCount=window.getNutritionMealCount?window.getNutritionMealCount():(profile?.mealCount||3);
  const planned=window.NutritionPlanner.planDay({
    foods:entered,
    fallbackFoods:state.mode==='auto'?DB:[],
    targets:state.targets,
    mealCount,
    mode:state.mode,
    savedFoodIds,
    sportMode:Boolean(profile?.sportMode)
  });
  state.result={
    ...planned,
    planner:true,
    foods:planned.items.map(x=>x.f),
    amounts:planned.items.map(x=>x.q)
  };
  renderMenu(unknown);
  goStep(3);
}

function renderMenu`;
  html=html.replace(buildPattern,replacement);
}

const oldDistribution=`  const chosen=res.foods.map((f,i)=>({f,q:res.amounts[i]})).filter(x=>x.q>0);\n  const mealCount=window.getNutritionMealCount?window.getNutritionMealCount():3;\n  const meals=window.NutritionMeals?window.NutritionMeals.distributeItems(chosen,mealCount):[{name:'ארוחה 1',items:chosen}];`;
const newDistribution=`  const chosen=res.foods.map((f,i)=>({f,q:res.amounts[i]})).filter(x=>x.q>0);\n  const mealCount=window.getNutritionMealCount?window.getNutritionMealCount():3;\n  const meals=res.meals||(window.NutritionMeals?window.NutritionMeals.assignUniqueFoodsToMeals(chosen,mealCount):[{name:'ארוחה 1',items:chosen}]);`;
if(html.includes(oldDistribution))html=html.replace(oldDistribution,newDistribution);
else if(!html.includes('const meals=res.meals||'))throw new Error('meal distribution block not found');

if(!html.includes('toggleSavedFoodFor(f)')){
  const oldChips=`function renderChips(type){
  const wrap=qs(type+'Chips'); wrap.innerHTML='';
  state.foods[type].forEach((item,idx)=>{
    const f=item.id?DB.find(x=>x.id===item.id):null;
    const chip=document.createElement('span');
    chip.className='chip'+(f?'':' unknown');
    chip.innerHTML=\`${'${'}f?'✓ '+f.name:'? '+item.raw+' · לא זוהה'} <button aria-label="הסר">×</button>\`;
    chip.querySelector('button').onclick=()=>{state.foods[type].splice(idx,1);renderChips(type)};
    wrap.appendChild(chip);
  });
}`;
  const newChips=`function renderChips(type){
  const wrap=qs(type+'Chips'); wrap.innerHTML='';
  const profile=window.NutritionProfile?.load(localStorage)||null;
  state.foods[type].forEach((item,idx)=>{
    const f=item.id?DB.find(x=>x.id===item.id):null;
    const chip=document.createElement('span');
    chip.className='chip'+(f?'':' unknown');
    if(f){
      const saved=window.NutritionProfile?.isSaved(profile,f)||false;
      chip.innerHTML=\`✓ ${'${'}f.name} <button class="save-food" data-save aria-label="שמור בפרופיל">${'${'}saved?'★':'☆'} שמור בפרופיל</button> <button data-remove aria-label="הסר">×</button>\`;
      chip.querySelector('[data-save]').onclick=e=>{e.stopPropagation();toggleSavedFoodFor(f);renderChips(type);if(state.result)renderMenu()};
      chip.querySelector('[data-remove]').onclick=()=>{state.foods[type].splice(idx,1);renderChips(type)};
    }else{
      chip.innerHTML=\`? ${'${'}item.raw} · לא זוהה <button data-remove aria-label="הסר">×</button>\`;
      chip.querySelector('[data-remove]').onclick=()=>{state.foods[type].splice(idx,1);renderChips(type)};
    }
    wrap.appendChild(chip);
  });
}`;
  if(!html.includes(oldChips))throw new Error('renderChips block not found');
  html=html.replace(oldChips,newChips);
}

if(!html.includes('data-menu-save')){
  const oldRow=`      row.innerHTML=\`<div><strong>${'${'}f.name}</strong><div class="muted">${'${'}humanQuantity(f,q)}</div>${'${'}f.source?\`<span class="source-tag">${'${'}f.source}</span>\`:''}</div><button class="mini">ערכים</button><button class="mini">החלף</button><button class="mini">כמות</button>\`;
      const btns=row.querySelectorAll('button');
      btns[0].onclick=()=>showFoodValues(f,q);
      btns[1].onclick=()=>replaceFood(f.id);
      btns[2].onclick=()=>changeQty(f.id);`;
  const newRow=`      const saved=window.NutritionProfile?.isSaved(window.NutritionProfile?.load(localStorage),f)||false;
      row.innerHTML=\`<div><strong>${'${'}f.name}</strong><div class="muted">${'${'}humanQuantity(f,q)}</div>${'${'}f.source?\`<span class="source-tag">${'${'}f.source}</span>\`:''}</div><button class="mini" data-menu-save>${'${'}saved?'★':'☆'} שמור בפרופיל</button><button class="mini">ערכים</button><button class="mini">החלף</button><button class="mini">כמות</button>\`;
      const btns=row.querySelectorAll('button');
      btns[0].onclick=()=>{toggleSavedFoodFor(f);renderMenu(unknown)};
      btns[1].onclick=()=>showFoodValues(f,q);
      btns[2].onclick=()=>replaceFood(f.id);
      btns[3].onclick=()=>changeQty(f.id);`;
  if(!html.includes(oldRow))throw new Error('menu row block not found');
  html=html.replace(oldRow,newRow);
}

html=html.replace('nutrition-meals.js?v=3','nutrition-meals.js?v=4');
html=html.replace('nutrition-profile.js?v=1','nutrition-profile.js?v=2');
html=html.replace('nutrition-profile-meals.js?v=2','nutrition-profile-meals.js?v=3');
if(!html.includes('nutrition-planner.js')){
  const anchor='<script src="nutrition-profile-meals.js?v=3"></script>\n';
  if(!html.includes(anchor))throw new Error('planner script insertion anchor not found');
  html=html.replace(anchor,anchor+'<script src="nutrition-planner.js?v=1"></script>\n');
}
html=html.replace('nutrition-profile.js?v=2','nutrition-profile.js?v=3');
html=html.replace('nutrition-profile-meals.js?v=3','nutrition-profile-meals.js?v=4');
writeFileSync(builderPath,html);

// Add saved-food management to the persistent profile UI.
const profilePath='nutrition-profile.js';
let profile=readFileSync(profilePath,'utf8');
if(!profile.includes('profileSavedFoods')){
  profile=profile.replace(
    `.profile-chip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f4f7fb;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:12px}.profile-chip button{border:0;background:transparent;color:var(--blue);font-weight:800;cursor:pointer}\n      @media`,
    `.profile-chip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f4f7fb;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:12px}.profile-chip button{border:0;background:transparent;color:var(--blue);font-weight:800;cursor:pointer}\n      .profile-saved{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}.profile-saved h3{margin:0 0 9px;font-size:16px}.profile-saved-list{display:flex;gap:7px;flex-wrap:wrap}.saved-food-chip{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 10px;font-size:13px}.saved-food-chip button{border:0;background:transparent;cursor:pointer;color:#8e3030;font-weight:900}.saved-food-empty{color:var(--muted);font-size:13px}\n      @media`
  );
  profile=profile.replace(
    `      <div class="profile-goals" id="profileGoals"></div>\n      <div class="profile-editbar">`,
    `      <div class="profile-goals" id="profileGoals"></div>\n      <div class="profile-saved"><h3>⭐ מאכלים שמורים</h3><div class="profile-saved-list" id="profileSavedFoods"></div></div>\n      <div class="profile-editbar">`
  );
  profile=profile.replace(
    `    const t=p.targets||{};el('profileGoals').innerHTML=[['קלוריות',t.cal,'קק״ל'],['חלבון',t.protein,'ג׳'],['פחמימות',t.carbs,'ג׳'],['שומן',t.fat,'ג׳'],['סיבים',t.fiber,'ג׳']].map(([label,v,u])=>\`<div class="profile-goal"><b>${'${'}esc(v)} ${'${'}u}</b><span>${'${'}label}</span></div>\`).join('');\n  }`,
    `    const t=p.targets||{};el('profileGoals').innerHTML=[['קלוריות',t.cal,'קק״ל'],['חלבון',t.protein,'ג׳'],['פחמימות',t.carbs,'ג׳'],['שומן',t.fat,'ג׳'],['סיבים',t.fiber,'ג׳']].map(([label,v,u])=>\`<div class="profile-goal"><b>${'${'}esc(v)} ${'${'}u}</b><span>${'${'}label}</span></div>\`).join('');\n    renderSavedFoods(p);\n  }\n  function renderSavedFoods(p){\n    const wrap=el('profileSavedFoods');if(!wrap)return;const list=p?.savedFoods||[];wrap.innerHTML='';\n    if(!list.length){wrap.innerHTML='<span class="saved-food-empty">עוד לא שמרת מאכלים בפרופיל.</span>';return;}\n    list.forEach(food=>{const chip=doc.createElement('span');chip.className='saved-food-chip';const source=food.source?\` · ${'${'}esc(food.source)}\`:'';chip.innerHTML=\`<span>${'${'}esc(food.name)}${'${'}source}</span><button aria-label="הסר מאכל שמור">×</button>\`;chip.querySelector('button').onclick=()=>{const next=storeProfile(removeSavedFood(currentProfile()||p,foodIdentity(food)));renderProfileHome(next);notifyProfileChange(next)};wrap.appendChild(chip)});\n  }\n  function notifyProfileChange(profile){try{doc.dispatchEvent(new CustomEvent('nutrition-profile-change',{detail:{profile}}))}catch(e){}}\n  function toggleSavedFoodFor(food){const current=currentProfile()||normalizeProfile({version:PROFILE_VERSION,mealCount:3,savedFoods:[]});const next=storeProfile(toggleSavedFood(current,food));if(el('profileHome'))renderProfileHome(next);notifyProfileChange(next);return isSaved(next,food)}\n  win.toggleSavedFoodFor=toggleSavedFoodFor;`
  );
}
writeFileSync(profilePath,profile);

// Re-plan when the meal count changes so meal assignment cannot revive duplicates.
const mealsPath='nutrition-profile-meals.js';
let mealUI=readFileSync(mealsPath,'utf8');
mealUI=mealUI.replace(
  `refreshAll();if(typeof renderMenu==='function'&&typeof state!=='undefined'&&state.result)renderMenu()`,
  `refreshAll();if(typeof buildMenu==='function'&&typeof state!=='undefined'&&state.result)buildMenu()`
);
writeFileSync(mealsPath,mealUI);
