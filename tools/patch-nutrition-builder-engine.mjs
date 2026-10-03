import { readFileSync, writeFileSync } from 'node:fs';

const path='nutrition-builder.html';
let html=readFileSync(path,'utf8');

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

html=html.replace('nutrition-meals.js?v=3','nutrition-meals.js?v=4');
html=html.replace('nutrition-profile.js?v=1','nutrition-profile.js?v=2');
html=html.replace('nutrition-profile-meals.js?v=2','nutrition-profile-meals.js?v=3');
if(!html.includes('nutrition-planner.js')){
  const anchor='<script src="nutrition-profile-meals.js?v=3"></script>\n';
  if(!html.includes(anchor))throw new Error('planner script insertion anchor not found');
  html=html.replace(anchor,anchor+'<script src="nutrition-planner.js?v=1"></script>\n');
}

writeFileSync(path,html);
