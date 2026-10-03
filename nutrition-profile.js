(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.NutritionProfile=api;
    if(root.document)api.initUI(root);
  }
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const PROFILE_KEY='nutritionProfileV1';
const LEGACY_KEY='nutritionProfile';
const PROFILE_VERSION=2;

function normalizeMealCount(value){
  const n=Math.round(Number(value));
  if(!Number.isFinite(n))return 3;
  return Math.min(6,Math.max(1,n));
}
function normalizeText(value){return String(value??'').toLowerCase().trim().replace(/[״׳'\"]/g,'').replace(/\s+/g,' ')}
function foodIdentity(food){
  if(!food)return '';
  const id=String(food.id??food.sourceCode??food.code??food.name??'').trim();
  const preparation=normalizeText(food.preparation||'');
  if(!preparation)return id;
  if(normalizeText(id).includes(preparation))return id;
  return `${id}::${preparation}`;
}
function safeParse(raw){try{return raw?JSON.parse(raw):null}catch(e){return null}}
function mergeMissing(primary,fallback){
  const out={...(fallback||{}),...(primary||{})};
  Object.entries(primary||{}).forEach(([k,v])=>{if(v===undefined||v===null||v==='')delete out[k]});
  Object.entries(fallback||{}).forEach(([k,v])=>{if(!(k in out)&&v!==undefined)out[k]=v});
  return out;
}
function legacyToModern(p){
  if(!p)return null;
  return {
    age:p.age,
    sex:p.sex,
    weight:p.weight??p.w,
    height:p.height??p.h,
    activity:p.activity,
    goal:p.goal,
    targets:p.targets
  };
}
function savedFoodRecord(food,existingSavedAt){
  const record={
    id:String(food?.id??food?.sourceCode??food?.code??food?.name??'').trim(),
    name:String(food?.name??food?.id??'').trim(),
    savedAt:existingSavedAt||new Date().toISOString()
  };
  if(food?.preparation)record.preparation=food.preparation;
  if(food?.source)record.source=food.source;
  const sourceCode=food?.sourceCode??food?.code;
  if(sourceCode!==undefined&&sourceCode!==null&&String(sourceCode)!=='')record.sourceCode=String(sourceCode);
  return record;
}
function normalizeSavedFoods(list){
  const map=new Map();
  (Array.isArray(list)?list:[]).forEach(food=>{
    const record=savedFoodRecord(food,food?.savedAt);
    const id=foodIdentity(record);
    if(id&&!map.has(id))map.set(id,record);
  });
  return [...map.values()];
}
function normalizeProfile(profile){
  if(!profile)return null;
  return {
    ...profile,
    version:PROFILE_VERSION,
    mealCount:normalizeMealCount(profile.mealCount),
    savedFoods:normalizeSavedFoods(profile.savedFoods)
  };
}
function load(storage){
  if(!storage)return null;
  const parsed=safeParse(storage.getItem(PROFILE_KEY));
  return parsed?normalizeProfile(parsed):null;
}
function save(storage,profile){
  if(!storage)return normalizeProfile(profile);
  const normalized=normalizeProfile(profile);
  storage.setItem(PROFILE_KEY,JSON.stringify(normalized));
  return normalized;
}
function migrate(storage){
  if(!storage)return null;
  const modern=safeParse(storage.getItem(PROFILE_KEY));
  const legacy=safeParse(storage.getItem(LEGACY_KEY));
  if(!modern&&!legacy)return null;
  const merged=modern?mergeMissing(modern,legacyToModern(legacy)):legacyToModern(legacy);
  const normalized=normalizeProfile(merged||{});
  save(storage,normalized);
  return normalized;
}
function isSaved(profile,foodRef){
  const target=typeof foodRef==='string'?foodRef:foodIdentity(foodRef);
  return normalizeSavedFoods(profile?.savedFoods).some(x=>foodIdentity(x)===target||x.id===target);
}
function removeSavedFood(profile,identity){
  const target=typeof identity==='string'?identity:foodIdentity(identity);
  return normalizeProfile({...(profile||{}),savedFoods:normalizeSavedFoods(profile?.savedFoods).filter(x=>foodIdentity(x)!==target&&x.id!==target)});
}
function toggleSavedFood(profile,foodRef){
  const current=normalizeProfile(profile||{});
  const identity=foodIdentity(foodRef);
  if(isSaved(current,identity))return removeSavedFood(current,identity);
  return normalizeProfile({...current,savedFoods:[...(current.savedFoods||[]),savedFoodRecord(foodRef)]});
}

function initUI(win){
  const doc=win.document;
  if(!doc||win.__nutritionProfileUIInitialized)return;
  win.__nutritionProfileUIInitialized=true;

  function el(id){return doc.getElementById(id)}
  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  function fmtDate(iso){try{return new Intl.DateTimeFormat('he-IL',{day:'numeric',month:'numeric',year:'numeric'}).format(new Date(iso))}catch(e){return ''}}
  function goalName(v){return {maintain:'שמירה',loss:'ירידה בשומן',gain:'בניית שריר',performance:'ביצועים'}[v]||v}
  function activityName(v){return {1:'נמוכה מאוד',2:'קלה',3:'בינונית',4:'גבוהה',5:'גבוהה מאוד'}[v]||v}
  function currentProfile(){return load(win.localStorage)}
  function storeProfile(profile){try{return save(win.localStorage,profile)}catch(e){win.alert?.('לא הצלחתי לשמור את הפרופיל בדפדפן.');return profile}}

  function injectStyles(){
    if(el('nutritionProfileStyles'))return;
    const style=doc.createElement('style');
    style.id='nutritionProfileStyles';
    style.textContent=`
      .profile-card{background:linear-gradient(135deg,#fff,#f3f7ff);border:1px solid var(--line);border-radius:24px;padding:20px;margin:16px 0;box-shadow:0 5px 22px #14213d0c}
      .profile-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.profile-name{font-size:26px;font-weight:900;margin:0 0 4px}.profile-meta{color:var(--muted);line-height:1.6}
      .profile-goals{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px}.profile-goal{background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;text-align:center}.profile-goal b{display:block;font-size:18px}.profile-goal span{font-size:11px;color:var(--muted)}
      .profile-editbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.profile-editbar button{border:0;border-radius:12px;padding:10px 13px;font-weight:800;cursor:pointer}.profile-primary{background:var(--blue);color:#fff}.profile-secondary{background:#edf4ff;color:#235bb1}.profile-ghost{background:#fff;border:1px solid var(--line)!important}
      .profile-chip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f4f7fb;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:12px}.profile-chip button{border:0;background:transparent;color:var(--blue);font-weight:800;cursor:pointer}
      @media(max-width:800px){.profile-goals{grid-template-columns:repeat(2,1fr)}}`;
    doc.head.appendChild(style);
  }
  function ensureNameField(){
    if(el('profileName'))return;
    const grid=doc.querySelector('#step1 .grid2');if(!grid)return;
    const field=doc.createElement('div');field.className='field';field.innerHTML='<label>שם הפרופיל</label><input id="profileName" type="text" maxlength="40" placeholder="למשל: בן" autocomplete="name">';grid.prepend(field);
  }
  function ensureSaveButton(){
    const actions=doc.querySelector('#targetsWrap .actions');if(!actions)return;
    const btn=actions.querySelector('.primary');if(btn){btn.textContent='שמור פרופיל והמשך ←';btn.onclick=saveProfileAndContinue;}
  }
  function ensureProfileHome(){
    if(el('profileHome'))return;
    const stepper=doc.querySelector('.stepper');if(!stepper)return;
    const card=doc.createElement('section');card.id='profileHome';card.className='profile-card hidden';card.innerHTML=`
      <div class="profile-head"><div><div class="profile-name" id="profileCardName">הפרופיל שלי</div><div class="profile-meta" id="profileCardMeta"></div></div><div class="profile-meta" id="profileUpdated"></div></div>
      <div class="profile-goals" id="profileGoals"></div>
      <div class="profile-editbar"><button class="profile-primary" id="profileBuildBtn">בנה לי תפריט</button><button class="profile-secondary" id="profileWeightBtn">עדכן רק משקל</button><button class="profile-ghost" id="profileEditBtn">ערוך פרופיל</button></div>`;
    stepper.before(card);el('profileBuildBtn').onclick=openBuilderFromProfile;el('profileWeightBtn').onclick=quickWeightUpdate;el('profileEditBtn').onclick=editProfile;
  }
  function setSelected(group,value){doc.querySelectorAll('#'+group+' .choice').forEach(b=>b.classList.toggle('selected',String(b.dataset.value)===String(value)))}
  function applyProfile(p){
    if(!p)return;
    if(el('profileName'))el('profileName').value=p.name||'';
    if(el('age')&&p.age!==undefined)el('age').value=p.age;
    if(el('sex')&&p.sex)el('sex').value=p.sex;
    if(el('weight')&&p.weight!==undefined)el('weight').value=p.weight;
    if(el('height')&&p.height!==undefined)el('height').value=p.height;
    state.activity=Number(p.activity)||3;state.goal=p.goal||'maintain';state.targets=p.targets||null;
    setSelected('activityChoices',state.activity);setSelected('goalChoices',state.goal);
    if(state.targets){const ids={cal:'tCal',protein:'tProtein',carbs:'tCarbs',fat:'tFat',fiber:'tFiber',water:'tWater'};Object.entries(ids).forEach(([k,id])=>{if(el(id))el(id).textContent=state.targets[k]});el('targetsWrap')?.classList.remove('hidden');}
  }
  function buildProfileFromForm(){
    calculateTargets();
    if(!state.targets)return null;
    const previous=currentProfile()||{};
    return normalizeProfile({...previous,version:PROFILE_VERSION,name:(el('profileName')?.value||'').trim()||'הפרופיל שלי',age:Number(el('age').value),sex:el('sex').value,weight:Number(el('weight').value),height:Number(el('height').value),activity:Number(state.activity),goal:state.goal,targets:{...state.targets},updatedAt:new Date().toISOString()});
  }
  function saveProfileAndContinue(){const p=buildProfileFromForm();if(!p)return;const saved=storeProfile(p);applyProfile(saved);renderProfileHome(saved);openBuilderFromProfile()}
  win.saveProfileAndContinue=saveProfileAndContinue;
  function renderProfileHome(p){
    ensureProfileHome();el('profileCardName').textContent='👤 '+(p.name||'הפרופיל שלי');el('profileCardMeta').textContent=`${p.weight} ק״ג · ${p.height} ס״מ · פעילות ${activityName(p.activity)} · ${goalName(p.goal)}`;el('profileUpdated').textContent='עודכן לאחרונה: '+fmtDate(p.updatedAt);
    const t=p.targets||{};el('profileGoals').innerHTML=[['קלוריות',t.cal,'קק״ל'],['חלבון',t.protein,'ג׳'],['פחמימות',t.carbs,'ג׳'],['שומן',t.fat,'ג׳'],['סיבים',t.fiber,'ג׳']].map(([label,v,u])=>`<div class="profile-goal"><b>${esc(v)} ${u}</b><span>${label}</span></div>`).join('');
  }
  function showProfileHome(){const p=currentProfile();if(!p)return false;applyProfile(p);renderProfileHome(p);el('profileHome').classList.remove('hidden');doc.querySelector('.stepper')?.classList.add('hidden');[1,2,3].forEach(i=>el('step'+i)?.classList.add('hidden'));return true}
  function showProfileChip(){
    el('profileChip')?.remove();const step2=el('step2');if(!step2)return;const p=currentProfile();if(!p)return;
    const chip=doc.createElement('div');chip.id='profileChip';chip.className='profile-chip';chip.innerHTML=`<span><b>👤 ${esc(p.name||'הפרופיל שלי')}</b> · ${esc(p.weight)} ק״ג · ${esc(goalName(p.goal))}</span><button>שינוי פרופיל</button>`;chip.querySelector('button').onclick=editProfile;step2.prepend(chip);
  }
  function openBuilderFromProfile(){const p=currentProfile();if(p)applyProfile(p);el('profileHome')?.classList.add('hidden');doc.querySelector('.stepper')?.classList.remove('hidden');goStep(2);showProfileChip()}
  function editProfile(){const p=currentProfile();if(p)applyProfile(p);el('profileHome')?.classList.add('hidden');doc.querySelector('.stepper')?.classList.remove('hidden');goStep(1);setTimeout(()=>el('profileName')?.focus(),150)}
  function quickWeightUpdate(){
    const p=currentProfile();if(!p)return editProfile();const raw=win.prompt('מה המשקל החדש בק״ג?',p.weight);if(raw===null)return;const w=Number(String(raw).replace(',','.'));if(!Number.isFinite(w)||w<35||w>250){win.alert('הכנס משקל תקין בין 35 ל־250 ק״ג.');return;}
    applyProfile(p);el('weight').value=w;calculateTargets();const next=storeProfile({...p,weight:w,targets:{...state.targets},updatedAt:new Date().toISOString()});applyProfile(next);renderProfileHome(next);
  }
  function addNewProfileHint(){const h=doc.querySelector('#step1 h2');if(h&&!el('profileFirstHint')){const n=doc.createElement('div');n.id='profileFirstHint';n.className='note info';n.innerHTML='<b>ממלאים פעם אחת.</b> הפרטים, מספר הארוחות והמאכלים השמורים נשמרים במכשיר הזה.';h.after(n)}}
  function init(){injectStyles();ensureNameField();ensureSaveButton();ensureProfileHome();addNewProfileHint();migrate(win.localStorage);const p=currentProfile();if(p)showProfileHome()}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else init();
}

return {PROFILE_KEY,PROFILE_VERSION,load,save,migrate,toggleSavedFood,isSaved,removeSavedFood,foodIdentity,normalizeProfile,initUI};
});
