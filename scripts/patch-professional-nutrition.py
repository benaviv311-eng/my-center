from pathlib import Path
import re

p=Path('nutrition-builder.html')
s=p.read_text(encoding='utf-8')

# Professional result UI.
if 'id="quality"' not in s:
    s=s.replace('<div id="imbalance"></div>\n    <div class="meals" id="meals"></div>', '<div id="imbalance"></div>\n    <div class="meals" id="meals"></div>\n\n    <h3>איכות וגיוון</h3>\n    <div id="quality"></div>')

# Optional sports overlay switch; no workout timing is invented.
if 'id="sportMode"' not in s:
    marker='    <div class="actions">\n      <button class="btn primary" id="calcBtn">חשב את היעדים שלי</button>\n    </div>'
    sport='    <div class="note info" style="margin-top:14px"><label style="display:flex;gap:9px;align-items:center;cursor:pointer"><input id="sportMode" type="checkbox"> <span><b>מצב ספורט</b> — פיזור מקצועי יותר של חלבון ופחמימות ליום פעיל. תזמון לפני/אחרי אימון יופעל רק בעתיד אם תוגדר שעת אימון.</span></label></div>\n\n'+marker
    assert marker in s
    s=s.replace(marker,sport,1)

# Nullable government nutrition values: missing is unknown, not zero.
old=re.search(r'function govFoodFromRow\(r\)\{.*?\n\}',s,re.S)
assert old
new='''function govFoodFromRow(r){
  const nullableNumber=v=>window.NutritionMeals?.nullableNumber?window.NutritionMeals.nullableNumber(v):(v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null));
  const p=nullableNumber(r.protein),f=nullableNumber(r.total_fat),c=nullableNumber(r.carbohydrates),fi=nullableNumber(r.total_dietary_fiber),k=nullableNumber(r.food_energy);
  const code=r.Code??r.code??r.CODE??r._id,name=r.shmmitzrach||r.english_name||'מזון';
  let cat='carb';if((fi??0)>=5)cat='fiber';else if((f??0)>=15)cat='fat';else if((p??0)>=Math.max((c??0)/2,(f??0)/2))cat='protein';
  return {id:'gov-'+code,code,name,aliases:[name],p,c,f,fi,k,cat,max:800,all:r,source:'משרד הבריאות',sourceCode:String(code)};
}'''
s=s[:old.start()]+new+s[old.end():]

# Helpers + professional build/render pipeline.
start=s.index('function buildMenu(){')
end=s.index('function renderBalance(){',start)
replacement=r'''function currentNutritionProfile(){
  return window.NutritionProfile?.migrate(localStorage)||{savedFoods:[]};
}
function savedFoodIds(){return (currentNutritionProfile().savedFoods||[]).map(f=>window.NutritionMeals?.foodIdentity(f)||f.id)}
function isFoodSaved(food){return window.NutritionProfile?.isSaved(currentNutritionProfile(),food)||false}
function toggleFoodSaved(food){
  if(!window.NutritionProfile)return;
  const next=window.NutritionProfile.toggleSavedFood(currentNutritionProfile(),food);
  window.NutritionProfile.save(localStorage,next);
  renderMenu();
}
function plannerGaps(targetDiagnostics,qualityDiagnostics){
  const names={cal:'קלוריות',protein:'חלבון',carbs:'פחמימות',fat:'שומן',fiber:'סיבים'};const out=[];
  (targetDiagnostics||[]).forEach(d=>{if(d.status==='low')out.push(`חסר ${names[d.key]}: ${Math.round(d.value)} מתוך ${Math.round(d.target)}`);else if(d.status==='unknown')out.push(`אין מספיק נתונים כדי לחשב ${names[d.key]}`)});
  if((qualityDiagnostics||[]).some(x=>x.code==='insufficient-variety'))out.push('חסר גיוון כדי לבנות את כל הארוחות בלי לחזור על אותו מאכל.');
  return out;
}
function refreshPlannerResult(items){
  const planner=state.result.planner;
  planner.items=window.NutritionMeals.mergeDuplicateFoods(items);
  planner.meals=window.NutritionMeals.assignUniqueFoodsToMeals(planner.items,window.getNutritionMealCount?window.getNutritionMealCount():3);
  planner.totals=window.NutritionPlanner.totals(planner.items);
  planner.targetDiagnostics=window.NutritionPlanner.targetDiagnostics(planner.totals,state.targets);
  planner.qualityDiagnostics=window.NutritionPlanner.qualityDiagnostics(planner.items,planner.meals,planner.totals,state.targets,!!qs('sportMode')?.checked,enteredFoods());
  planner.gaps=plannerGaps(planner.targetDiagnostics,planner.qualityDiagnostics);
  state.result={planner,foods:planner.items.map(x=>x.f),amounts:planner.items.map(x=>x.q),totals:planner.totals,qualityDiagnostics:planner.qualityDiagnostics,targetDiagnostics:planner.targetDiagnostics};
}
function buildMenu(){
  if(!state.targets){calculateTargets(); if(!state.targets)return;}
  const entered=enteredFoods();
  const unknown=Object.values(state.foods).flat().filter(x=>!x.id);
  if(state.mode==='strict' && entered.length===0){alert('במצב "רק ממה שיש לי" צריך לכתוב לפחות מאכל אחד.');return;}
  const profile=currentNutritionProfile();
  const saved=profile.savedFoods||[];
  const savedLocal=saved.map(ref=>DB.find(f=>(window.NutritionMeals?.foodIdentity(f)||f.id)===(window.NutritionMeals?.foodIdentity(ref)||ref.id))).filter(Boolean);
  const current=[...entered];
  if(state.mode==='auto')savedLocal.forEach(f=>{if(!current.some(x=>x.id===f.id))current.push(f)});
  const currentIds=new Set(current.map(f=>window.NutritionMeals?.foodIdentity(f)||f.id));
  const fallback=DB.filter(f=>!currentIds.has(window.NutritionMeals?.foodIdentity(f)||f.id));
  const planner=window.NutritionPlanner.planDay({foods:current,fallbackFoods:fallback,targets:state.targets,mealCount:window.getNutritionMealCount?window.getNutritionMealCount():3,mode:state.mode,savedFoodIds:saved.map(f=>window.NutritionMeals?.foodIdentity(f)||f.id),sportMode:!!qs('sportMode')?.checked});
  state.result={planner,foods:planner.items.map(x=>x.f),amounts:planner.items.map(x=>x.q),totals:planner.totals,qualityDiagnostics:planner.qualityDiagnostics,targetDiagnostics:planner.targetDiagnostics};
  renderMenu(unknown);goStep(3);
}

function renderMenu(unknown=[]){
  const res=state.result;if(!res?.planner)return;
  qs('menuIntro').textContent=state.mode==='strict'?'נבנה רק מהמאכלים שכתבת, בלי כפילויות ובלי תוספות שקטות.':'המערכת מעדיפה מאכלים ששמרת, גיוון ומנות סבירות לפני הגדלה קיצונית של מאכל אחד.';
  const meals=res.planner.meals;
  const wrap=qs('meals');wrap.innerHTML='';
  meals.forEach(m=>{
    const card=document.createElement('div');card.className='meal';card.innerHTML=`<div class="mealhead"><h3>${m.name}</h3><span class="muted">${Math.round(window.NutritionMeals.mealCalories(m))} קק״ל</span></div>`;
    if(!m.items.length){card.innerHTML+='<div class="note warn">אין כרגע מאכל ייחודי נוסף לארוחה הזאת. עדיף להוסיף אפשרות מזון מאשר לשכפל את אותו מאכל.</div>'}
    m.items.forEach(({f,q})=>{
      const row=document.createElement('div');row.className='foodrow';
      const star=isFoodSaved(f)?'★ שמור בפרופיל':'☆ שמור בפרופיל';
      row.innerHTML=`<div><strong>${f.name}</strong><div class="muted">${humanQuantity(f,q)} · ${Math.round(window.NutritionMeals.caloriesForQuantity(f,q))} קק״ל</div>${f.source?`<span class="source-tag">${f.source}</span>`:''}</div><button class="mini">ערכים</button><button class="mini">${star}</button><button class="mini">כמות</button>`;
      const btns=row.querySelectorAll('button');btns[0].onclick=()=>showFoodValues(f,q);btns[1].onclick=()=>toggleFoodSaved(f);btns[2].onclick=()=>changeQty(f.id);card.appendChild(row);
    });wrap.appendChild(card);
  });
  const imb=qs('imbalance');imb.innerHTML='';
  if(res.planner.gaps.length)imb.innerHTML=`<div class="note warn"><strong>מה עדיין חסר:</strong><br>${res.planner.gaps.join(' · ')}</div>`;else imb.innerHTML='<div class="note success"><strong>התאמה טובה:</strong> התפריט עומד בצורה סבירה ביעדים ובמגבלות המנות.</div>';
  if(unknown.length)imb.innerHTML+=`<div class="note warn">לא הצלחתי לזהות: ${unknown.map(x=>x.raw).join(', ')}. הם לא נכנסו לחישוב.</div>`;
  const quality=qs('quality');if(quality)quality.innerHTML=(res.planner.qualityDiagnostics||[]).map(x=>`<div class="note ${x.status==='good'?'success':'warn'}">${x.status==='good'?'✓':'•'} ${x.message}</div>`).join('');
  renderBalance();
}

'''
s=s[:start]+replacement+s[end:]

# Null-aware target balance.
old_balance=re.search(r'function renderBalance\(\)\{.*?\n\}',s[end if False else 0:],re.S)
# Locate the first balance function after professional render.
bstart=s.index('function renderBalance(){')
bend=s.index('\nfunction replaceFood(',bstart)
new_balance=r'''function renderBalance(){
  const a=state.result.totals,t=state.targets;
  const rows=[['קלוריות','cal',t.cal,''],['חלבון','protein',t.protein,' ג׳'],['פחמימות','carbs',t.carbs,' ג׳'],['שומן','fat',t.fat,' ג׳'],['סיבים','fiber',t.fiber,' ג׳']];
  qs('balance').innerHTML=rows.map(([label,k,goal,u])=>{const raw=a[k];if(raw===null||raw===undefined)return `<div class="barbox"><strong>${label}</strong><div>אין נתון / ${Math.round(goal)}${u}</div><small>לא חושב כאפס</small></div>`;const val=Math.round(raw),pct=Math.min(130,Math.round(val/goal*100));return `<div class="barbox"><strong>${label}</strong><div>${val}${u} / ${Math.round(goal)}${u}</div><div class="barline"><div class="barfill" style="width:${Math.min(100,pct)}%"></div></div><small>${pct}%</small></div>`}).join('');
}
'''
s=s[:bstart]+new_balance+s[bend:]

# Keep replace/quantity controls compatible with planner output.
rstart=s.index('function replaceFood(')
rend=s.index('function shuffleMeal()',rstart)
new_controls=r'''function replaceFood(id){
  const planner=state.result?.planner;if(!planner)return;
  const idx=planner.items.findIndex(x=>x.f.id===id);if(idx<0)return;
  const old=planner.items[idx].f,allowed=state.mode==='strict'?enteredFoods():DB;
  const used=new Set(planner.items.map(x=>window.NutritionMeals.foodIdentity(x.f)));
  const candidates=allowed.filter(f=>f.id!==id&&!used.has(window.NutritionMeals.foodIdentity(f))&&(f.cat===old.cat||Math.abs((f.p||0)-(old.p||0))<8));
  if(!candidates.length){alert('אין כרגע חלופה ייחודית מותרת למאכל הזה.');return;}
  const next=candidates[0],items=planner.items.map((x,i)=>i===idx?{f:next,q:Math.min(x.q,window.NutritionMeals.reasonableDailyMax(next))}:x);refreshPlannerResult(items);renderMenu();
}
function changeQty(id){
  const planner=state.result?.planner;if(!planner)return;const idx=planner.items.findIndex(x=>x.f.id===id);if(idx<0)return;
  const item=planner.items[idx],val=prompt(`כמות חדשה בגרמים עבור ${item.f.name}`,Math.round(item.q));if(val===null)return;
  const cap=window.NutritionMeals.reasonableDailyMax(item.f),n=Math.max(0,Math.min(cap,+val||0));const items=planner.items.map((x,i)=>i===idx?{...x,q:n}:x).filter(x=>x.q>0);refreshPlannerResult(items);renderMenu();
}
'''
s=s[:rstart]+new_controls+s[rend:]

# Remove old legacy-profile bootstrap now handled by NutritionProfile.migrate().
s=re.sub(r'\n\(function loadProfile\(\)\{.*?\}\)\(\);\n</script>', '\n</script>', s, flags=re.S)

# Load planner between meals and profile; bump caches.
s=s.replace('<script src="nutrition-meals.js?v=3"></script>\n<script src="nutrition-profile.js?v=1"></script>', '<script src="nutrition-meals.js?v=4"></script>\n<script src="nutrition-planner.js?v=1"></script>\n<script src="nutrition-profile.js?v=2"></script>')

p.write_text(s,encoding='utf-8')
print('patched professional nutrition builder')
