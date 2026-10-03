from pathlib import Path

p = Path('nutrition-builder.html')
s = p.read_text(encoding='utf-8')

start = s.find('function showFoodValues(')
if start < 0:
    raise SystemExit('showFoodValues start not found')
end = s.find('\nfunction qs(id)', start)
if end < 0:
    raise SystemExit('showFoodValues end not found')

new_func = '''function showFoodValues(food,grams=100){
  const amount=Number(grams)>0?Number(grams):100;
  const base=food.all||{food_energy:food.k,protein:food.p,carbohydrates:food.c,total_fat:food.f,total_dietary_fiber:food.fi};
  const data=window.NutritionMeals?.nutrientsForQuantity?window.NutritionMeals.nutrientsForQuantity(base,amount):base;
  const skip=new Set(['_id','Code','code','smlmitzrach','shmmitzrach','makor','tarich_ptiha','tarich_idkun','english_name']);
  const rows=Object.entries(data).filter(([k,v])=>!skip.has(k)&&v!==null&&v!==''&&v!==undefined&&!(typeof v==='number'&&Number.isNaN(v))).map(([k,v])=>`<div class="nutrient-item"><b>${NUTRIENT_LABELS[k]||k}</b><span>${v}${nutrientUnit(k)}</span></div>`).join('');
  const back=document.createElement('div');back.className='modal-back';back.innerHTML=`<div class="modal-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><h2 style="margin:0">${food.name}</h2><div class="muted">ערכים ל־${Math.round(amount)} גרם · ${food.source||'מאגר פנימי'}</div></div><button class="mini">✕</button></div><div class="nutrient-grid" style="margin-top:14px">${rows||'<div>אין נתונים נוספים.</div>'}</div></div>`;back.onclick=e=>{if(e.target===back)back.remove()};back.querySelector('button').onclick=()=>back.remove();document.body.appendChild(back);
}'''

s = s[:start] + new_func + s[end:]

s = s.replace('btns[0].onclick=()=>showFoodValues(f);', 'btns[0].onclick=()=>showFoodValues(f,q);')
s = s.replace('<button class="btn primary" id="buildBtn">בנה תפריט</button>', '<button class="btn primary" id="buildBtn">בנה לי תפריט</button>')
s = s.replace('nutrition-meals.js?v=2', 'nutrition-meals.js?v=3')
s = s.replace('nutrition-profile-meals.js?v=1', 'nutrition-profile-meals.js?v=2')

if 'showFoodValues(f,q)' not in s:
    raise SystemExit('actual-grams values handler missing after patch')
if 'ערכים ל־${Math.round(amount)} גרם' not in s:
    raise SystemExit('actual-grams heading missing after patch')
if 'nutrition-meals.js?v=3' not in s:
    raise SystemExit('nutrition meals cache-bust missing after patch')
if 'nutrition-profile-meals.js?v=2' not in s:
    raise SystemExit('profile meals cache-bust missing after patch')

p.write_text(s, encoding='utf-8')
