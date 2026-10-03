(function(){
'use strict';
function el(id){return document.getElementById(id)}
function profileApi(){return window.NutritionProfile}
function normalize(v){return window.NutritionMeals?.normalizeMealCount(v)??Math.min(6,Math.max(1,Math.round(Number(v)||3)))}
function load(){try{return profileApi()?.load(localStorage)||null}catch(e){return null}}
function save(p){try{return profileApi()?.save(localStorage,p)||p}catch(e){return p}}

function injectStyles(){
  if(el('nutritionMealCountStyles'))return;
  const s=document.createElement('style');s.id='nutritionMealCountStyles';s.textContent=`
  .meal-count-picker{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.meal-count-picker button{border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 5px;font-weight:800;cursor:pointer}.meal-count-picker button.selected{border:2px solid var(--blue);background:#f2f7ff;color:var(--blue)}
  .meal-count-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f4f7fb;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:12px;flex-wrap:wrap}.meal-count-bar button{border:0;background:transparent;color:var(--blue);font-weight:800;cursor:pointer}
  .meal-picker-back{position:fixed;inset:0;background:#0007;display:grid;place-items:center;z-index:130;padding:16px}.meal-picker-card{background:#fff;border-radius:22px;padding:20px;width:min(430px,100%);box-shadow:0 20px 60px #0003}.meal-picker-card h3{margin:0 0 6px}.meal-picker-card p{color:var(--muted);margin:0 0 14px}.meal-picker-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.meal-picker-options button{border:1px solid var(--line);background:#fff;border-radius:14px;padding:13px;font-weight:900;cursor:pointer}.meal-picker-options button.selected{border:2px solid var(--blue);background:#f2f7ff;color:var(--blue)}
  @media(max-width:800px){.meal-count-picker{grid-template-columns:repeat(3,1fr)}}`;
  document.head.appendChild(s);
}

function selectedFromForm(){const b=document.querySelector('#mealCountChoices button.selected');return normalize(b?.dataset.meals||load()?.mealCount||3)}
function setForm(value){const n=normalize(value);document.querySelectorAll('#mealCountChoices button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.meals)===n));return n}

function ensureField(){
  if(el('mealCountChoices'))return;
  const grid=document.querySelector('#step1 .grid2');if(!grid)return;
  const field=document.createElement('div');field.className='field';field.innerHTML=`<label>מספר ארוחות ביום</label><div class="meal-count-picker" id="mealCountChoices">${[1,2,3,4,5,6].map(n=>`<button type="button" data-meals="${n}" class="${n===3?'selected':''}">${n}</button>`).join('')}</div>`;
  grid.appendChild(field);field.querySelectorAll('button').forEach(b=>b.onclick=()=>setForm(b.dataset.meals));setForm(load()?.mealCount||3);
}

function patchSavedProfileFromForm(){const p=load();if(!p)return;save({...p,mealCount:selectedFromForm(),updatedAt:new Date().toISOString()});refreshAll()}
function ensureSaveHook(){const btn=document.querySelector('#targetsWrap .actions .primary');if(!btn||btn.dataset.mealHook)return;btn.dataset.mealHook='1';btn.addEventListener('click',()=>setTimeout(patchSavedProfileFromForm,0))}
function openPicker(current,onPick){
  el('mealCountPicker')?.remove();const n=normalize(current);const back=document.createElement('div');back.id='mealCountPicker';back.className='meal-picker-back';back.innerHTML=`<div class="meal-picker-card"><h3>כמה ארוחות ביום?</h3><p>הבחירה נשמרת בפרופיל ומחלקת מחדש את התפריט.</p><div class="meal-picker-options">${[1,2,3,4,5,6].map(x=>`<button data-meals="${x}" class="${x===n?'selected':''}">${x} ארוחות</button>`).join('')}</div><div class="actions"><button class="btn ghost" data-close>ביטול</button></div></div>`;
  back.querySelectorAll('[data-meals]').forEach(b=>b.onclick=()=>{const value=normalize(b.dataset.meals);back.remove();onPick(value)});back.querySelector('[data-close]').onclick=()=>back.remove();back.onclick=e=>{if(e.target===back)back.remove()};document.body.appendChild(back);
}
function quickChange(){
  const p=load();const current=normalize(p?.mealCount||selectedFromForm());openPicker(current,n=>{setForm(n);if(p)save({...p,mealCount:n,updatedAt:new Date().toISOString()});refreshAll();if(typeof renderMenu==='function'&&typeof state!=='undefined'&&state.result)renderMenu()});
}
function updateProfileHome(){
  const p=load();if(!p)return;const n=normalize(p.mealCount||3);const meta=el('profileCardMeta');if(meta&&!meta.textContent.includes('ארוחות'))meta.textContent+=` · ${n} ארוחות`;
  const bar=document.querySelector('#profileHome .profile-editbar');if(bar){let b=el('profileMealCountBtn');if(!b){b=document.createElement('button');b.id='profileMealCountBtn';b.className='profile-secondary';b.onclick=quickChange;bar.insertBefore(b,bar.children[1]||null)}const text=`🍽️ ${n} ארוחות`;if(b.textContent!==text)b.textContent=text;}
}
function ensureBars(){
  const p=load();if(!p)return;const n=normalize(p.mealCount||3);['step2','step3'].forEach(id=>{const step=el(id);if(!step)return;let bar=step.querySelector('.meal-count-bar');if(!bar){bar=document.createElement('div');bar.className='meal-count-bar';bar.innerHTML='<span></span><button>שנה מספר ארוחות</button>';bar.querySelector('button').onclick=quickChange;step.prepend(bar)}const span=bar.querySelector('span'),html=`🍽️ <b>${n} ארוחות ביום</b>`;if(span.innerHTML!==html)span.innerHTML=html;});
}
function refreshAll(){const p=load();setForm(p?.mealCount||3);updateProfileHome();ensureBars()}
window.getNutritionMealCount=()=>normalize(load()?.mealCount||selectedFromForm());window.quickNutritionMealCount=quickChange;
function init(){injectStyles();ensureField();ensureSaveHook();refreshAll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
