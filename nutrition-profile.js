(function(root,factory){
  const api=factory(root?.NutritionMeals);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NutritionProfile=api;
  if(typeof document!=='undefined')api.initBrowser();
})(typeof window!=='undefined'?window:globalThis,function(Meals){
'use strict';
const PROFILE_KEY='nutritionProfileV1';
const LEGACY_KEY='nutritionProfile';
const PROFILE_VERSION=2;

function normalizeMealCount(v){
  if(Meals?.normalizeMealCount)return Meals.normalizeMealCount(v);
  const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(6,Math.max(1,n)):3;
}
function identity(food){
  if(Meals?.foodIdentity)return Meals.foodIdentity(food);
  const id=String(food?.id||food?.code||food?.name||'').trim();
  const prep=String(food?.preparation||'').trim();
  return prep?`${id}::${prep}`:id;
}
function parse(raw){try{return raw?JSON.parse(raw):null}catch(e){return null}}
function normalizeProfile(p={}){
  const saved=[];const seen=new Set();
  for(const f of Array.isArray(p.savedFoods)?p.savedFoods:[]){
    const key=identity(f);if(!key||seen.has(key))continue;seen.add(key);saved.push({...f});
  }
  return {...p,version:PROFILE_VERSION,mealCount:normalizeMealCount(p.mealCount),sportMode:!!p.sportMode,savedFoods:saved};
}
function load(storage){return normalizeProfile(parse(storage.getItem(PROFILE_KEY))||{});}
function save(storage,profile){const p=normalizeProfile(profile);storage.setItem(PROFILE_KEY,JSON.stringify(p));return p;}
function savedFoodRef(food){
  const out={id:food.id,name:food.name};
  if(food.preparation)out.preparation=food.preparation;
  if(food.source)out.source=food.source;
  if(food.sourceCode||food.code)out.sourceCode=String(food.sourceCode||food.code);
  out.savedAt=new Date().toISOString();return out;
}
function isSaved(profile,food){const key=identity(food);return (profile?.savedFoods||[]).some(x=>identity(x)===key);}
function toggleSavedFood(profile,food){
  const p=normalizeProfile(profile);const key=identity(food);
  if(!key)return p;
  if(isSaved(p,food))return {...p,savedFoods:p.savedFoods.filter(x=>identity(x)!==key)};
  return {...p,savedFoods:[...p.savedFoods,savedFoodRef(food)]};
}
function removeSavedFood(profile,keyOrFood){
  const p=normalizeProfile(profile);const key=typeof keyOrFood==='string'?keyOrFood:identity(keyOrFood);
  return {...p,savedFoods:p.savedFoods.filter(x=>identity(x)!==key&&x.id!==key)};
}
function migrate(storage){
  const current=parse(storage.getItem(PROFILE_KEY));
  const legacy=parse(storage.getItem(LEGACY_KEY));
  const merged={...(legacy||{}),...(current||{})};
  if(merged.weight==null&&legacy?.w!=null)merged.weight=legacy.w;
  if(merged.height==null&&legacy?.h!=null)merged.height=legacy.h;
  if(merged.age==null&&legacy?.age!=null)merged.age=legacy.age;
  if(merged.sex==null&&legacy?.sex!=null)merged.sex=legacy.sex;
  if(merged.activity==null&&legacy?.activity!=null)merged.activity=legacy.activity;
  if(merged.goal==null&&legacy?.goal!=null)merged.goal=legacy.goal;
  if(merged.targets==null&&legacy?.targets)merged.targets=legacy.targets;
  if(current?.savedFoods)merged.savedFoods=current.savedFoods;
  const p=save(storage,merged);
  return p;
}

function initBrowser(){
  if(typeof document==='undefined'||typeof localStorage==='undefined')return;
  const el=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const goalName=v=>({maintain:'שמירה',loss:'ירידה בשומן',gain:'בניית שריר',performance:'ביצועים'}[v]||v);
  const activityName=v=>({1:'נמוכה מאוד',2:'קלה',3:'בינונית',4:'גבוהה',5:'גבוהה מאוד'}[v]||v);
  const fmtDate=iso=>{try{return new Intl.DateTimeFormat('he-IL',{day:'numeric',month:'numeric',year:'numeric'}).format(new Date(iso))}catch(e){return ''}};

  function injectStyles(){if(el('nutritionProfileStyles'))return;const s=document.createElement('style');s.id='nutritionProfileStyles';s.textContent=`
  .profile-card{background:linear-gradient(135deg,#fff,#f3f7ff);border:1px solid var(--line);border-radius:24px;padding:20px;margin:16px 0;box-shadow:0 5px 22px #14213d0c}.profile-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.profile-name{font-size:26px;font-weight:900;margin:0 0 4px}.profile-meta{color:var(--muted);line-height:1.6}.profile-goals{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px}.profile-goal{background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;text-align:center}.profile-goal b{display:block;font-size:18px}.profile-goal span{font-size:11px;color:var(--muted)}.profile-editbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.profile-editbar button{border:0;border-radius:12px;padding:10px 13px;font-weight:800;cursor:pointer}.profile-primary{background:var(--blue);color:#fff}.profile-secondary{background:#edf4ff;color:#235bb1}.profile-ghost{background:#fff;border:1px solid var(--line)!important}.profile-chip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f4f7fb;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:12px}.profile-chip button{border:0;background:transparent;color:var(--blue);font-weight:800;cursor:pointer}.saved-foods{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}.saved-food-list{display:flex;gap:7px;flex-wrap:wrap}.saved-food-pill{display:flex;gap:7px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 10px;font-size:13px}.saved-food-pill button{border:0;background:transparent;cursor:pointer}@media(max-width:800px){.profile-goals{grid-template-columns:repeat(2,1fr)}}`;document.head.appendChild(s)}
  function ensureNameField(){if(el('profileName'))return;const grid=document.querySelector('#step1 .grid2');if(!grid)return;const f=document.createElement('div');f.className='field';f.innerHTML='<label>שם הפרופיל</label><input id="profileName" type="text" maxlength="40" placeholder="למשל: בן" autocomplete="name">';grid.prepend(f)}
  function getProfile(){return migrate(localStorage)}
  function setSelected(group,value){document.querySelectorAll('#'+group+' .choice').forEach(b=>b.classList.toggle('selected',String(b.dataset.value)===String(value)))}
  function applyProfile(p){if(!p)return;if(el('profileName'))el('profileName').value=p.name||'';if(el('age')&&p.age!=null)el('age').value=p.age;if(el('sex')&&p.sex)el('sex').value=p.sex;if(el('weight')&&p.weight!=null)el('weight').value=p.weight;if(el('height')&&p.height!=null)el('height').value=p.height;if(el('sportMode'))el('sportMode').checked=!!p.sportMode;if(typeof state!=='undefined'){state.activity=Number(p.activity)||3;state.goal=p.goal||'maintain';state.targets=p.targets||null;setSelected('activityChoices',state.activity);setSelected('goalChoices',state.goal);if(state.targets){for(const [k,id] of Object.entries({cal:'tCal',protein:'tProtein',carbs:'tCarbs',fat:'tFat',fiber:'tFiber',water:'tWater'}))if(el(id))el(id).textContent=state.targets[k];el('targetsWrap')?.classList.remove('hidden')}}}
  function ensureProfileHome(){if(el('profileHome'))return;const stepper=document.querySelector('.stepper');if(!stepper)return;const card=document.createElement('section');card.id='profileHome';card.className='profile-card hidden';card.innerHTML=`<div class="profile-head"><div><div class="profile-name" id="profileCardName">הפרופיל שלי</div><div class="profile-meta" id="profileCardMeta"></div></div><div class="profile-meta" id="profileUpdated"></div></div><div class="profile-goals" id="profileGoals"></div><div class="saved-foods"><b>⭐ מאכלים שמורים</b><div class="saved-food-list" id="profileSavedFoods"></div></div><div class="profile-editbar"><button class="profile-primary" id="profileBuildBtn">בנה לי תפריט</button><button class="profile-secondary" id="profileWeightBtn">עדכן רק משקל</button><button class="profile-ghost" id="profileEditBtn">ערוך פרופיל</button></div>`;stepper.before(card);el('profileBuildBtn').onclick=openBuilderFromProfile;el('profileWeightBtn').onclick=quickWeightUpdate;el('profileEditBtn').onclick=editProfile}
  function renderSaved(p){const box=el('profileSavedFoods');if(!box)return;const foods=p.savedFoods||[];box.innerHTML=foods.length?foods.map(f=>`<span class="saved-food-pill" data-id="${esc(identity(f))}">★ ${esc(f.name)} <button title="הסר">×</button></span>`).join(''):'<span class="profile-meta">עדיין לא שמרת מאכלים.</span>';box.querySelectorAll('.saved-food-pill').forEach(x=>x.querySelector('button').onclick=()=>{const next=removeSavedFood(getProfile(),x.dataset.id);save(localStorage,next);renderProfileHome(next)})}
  function renderProfileHome(p){ensureProfileHome();el('profileCardName').textContent='👤 '+(p.name||'הפרופיל שלי');el('profileCardMeta').textContent=`${p.weight??'—'} ק״ג · ${p.height??'—'} ס״מ · פעילות ${activityName(p.activity)} · ${goalName(p.goal)}${p.sportMode?' · מצב ספורט':''}`;el('profileUpdated').textContent=p.updatedAt?'עודכן לאחרונה: '+fmtDate(p.updatedAt):'';const t=p.targets||{};el('profileGoals').innerHTML=[['קלוריות',t.cal,'קק״ל'],['חלבון',t.protein,'ג׳'],['פחמימות',t.carbs,'ג׳'],['שומן',t.fat,'ג׳'],['סיבים',t.fiber,'ג׳']].map(([label,v,u])=>`<div class="profile-goal"><b>${esc(v??'—')} ${u}</b><span>${label}</span></div>`).join('');renderSaved(p)}
  function buildProfileFromForm(){if(typeof calculateTargets==='function')calculateTargets();if(typeof state==='undefined'||!state.targets)return null;const old=getProfile();return normalizeProfile({...old,name:(el('profileName')?.value||'').trim()||'הפרופיל שלי',age:Number(el('age').value),sex:el('sex').value,weight:Number(el('weight').value),height:Number(el('height').value),activity:Number(state.activity),goal:state.goal,sportMode:!!el('sportMode')?.checked,targets:{...state.targets},updatedAt:new Date().toISOString()})}
  function saveProfileAndContinue(){const p=buildProfileFromForm();if(!p)return;save(localStorage,p);applyProfile(p);renderProfileHome(p);openBuilderFromProfile()}
  function ensureSaveButton(){const btn=document.querySelector('#targetsWrap .actions .primary');if(btn){btn.textContent='שמור פרופיל והמשך ←';btn.onclick=saveProfileAndContinue}}
  function showProfileHome(){const p=getProfile();if(!p||(!p.name&&!p.weight))return false;applyProfile(p);renderProfileHome(p);el('profileHome').classList.remove('hidden');document.querySelector('.stepper')?.classList.add('hidden');[1,2,3].forEach(i=>el('step'+i)?.classList.add('hidden'));return true}
  function showProfileChip(){if(el('profileChip'))return;const step2=el('step2'),p=getProfile();if(!step2||!p)return;const chip=document.createElement('div');chip.id='profileChip';chip.className='profile-chip';chip.innerHTML=`<span><b>👤 ${esc(p.name||'הפרופיל שלי')}</b> · ${esc(p.weight??'—')} ק״ג · ${esc(goalName(p.goal))}${p.sportMode?' · ספורט':''}</span><button>שינוי פרופיל</button>`;chip.querySelector('button').onclick=editProfile;step2.prepend(chip)}
  function openBuilderFromProfile(){const p=getProfile();applyProfile(p);el('profileHome')?.classList.add('hidden');document.querySelector('.stepper')?.classList.remove('hidden');if(typeof goStep==='function')goStep(2);showProfileChip()}
  function editProfile(){const p=getProfile();applyProfile(p);el('profileHome')?.classList.add('hidden');document.querySelector('.stepper')?.classList.remove('hidden');if(typeof goStep==='function')goStep(1);setTimeout(()=>el('profileName')?.focus(),100)}
  function quickWeightUpdate(){const p=getProfile();const raw=prompt('מה המשקל החדש בק״ג?',p.weight??'');if(raw===null)return;const w=Number(String(raw).replace(',','.'));if(!Number.isFinite(w)||w<35||w>250){alert('הכנס משקל תקין בין 35 ל־250 ק״ג.');return}applyProfile(p);el('weight').value=w;if(typeof calculateTargets==='function')calculateTargets();const next=normalizeProfile({...p,weight:w,targets:typeof state!=='undefined'?{...state.targets}:p.targets,updatedAt:new Date().toISOString()});save(localStorage,next);renderProfileHome(next)}
  function addHint(){const h=document.querySelector('#step1 h2');if(h&&!el('profileFirstHint')){const n=document.createElement('div');n.id='profileFirstHint';n.className='note info';n.innerHTML='<b>ממלאים פעם אחת.</b> הפרטים, מצב הספורט, היעדים והמאכלים ששמרת יישמרו במכשיר הזה.';h.after(n)}}
  injectStyles();ensureNameField();ensureSaveButton();ensureProfileHome();addHint();window.saveProfileAndContinue=saveProfileAndContinue;const p=getProfile();if(p.name||p.weight)showProfileHome();
}

return {PROFILE_KEY,PROFILE_VERSION,normalizeProfile,load,save,migrate,isSaved,toggleSavedFood,removeSavedFood,savedFoodRef,initBrowser};
});
