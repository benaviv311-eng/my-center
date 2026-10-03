import { readFileSync, writeFileSync } from 'node:fs';

// Preserve missing nutrient values as unknown rather than an empty string/zero.
const mealsPath='nutrition-meals.js';
let meals=readFileSync(mealsPath,'utf8');
meals=meals.replace(
  `if(value===null||value===undefined||value==='')return [key,value??null];`,
  `if(value===null||value===undefined||value==='')return [key,null];`
);
writeFileSync(mealsPath,meals);

const path='nutrition-builder.html';
let html=readFileSync(path,'utf8');

if(!html.includes('function nullableNumber(v)')){
  const numLine=`function num(v){const n=parseFloat(v);return Number.isFinite(n)?n:0}`;
  if(!html.includes(numLine))throw new Error('numeric helper anchor not found');
  html=html.replace(numLine,numLine+`\nfunction nullableNumber(v){if(window.NutritionMeals?.nullableNumber)return window.NutritionMeals.nullableNumber(v);if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null}`);
}

const oldGov=`function govFoodFromRow(r){
  const p=num(r.protein),f=num(r.total_fat),c=num(r.carbohydrates),fi=num(r.total_dietary_fiber),k=num(r.food_energy);
  const code=r.Code??r.code??r.CODE??r._id,name=r.shmmitzrach||r.english_name||'מזון';
  let cat='carb';if(fi>=5)cat='fiber';else if(f>=15)cat='fat';else if(p>=Math.max(c/2,f/2))cat='protein';
  return {id:'gov-'+code,code,name,aliases:[name],p,c,f,fi,k,cat,max:800,all:r,source:'משרד הבריאות'};
}`;
const newGov=`function govFoodFromRow(r){
  const p=nullableNumber(r.protein),f=nullableNumber(r.total_fat),c=nullableNumber(r.carbohydrates),fi=nullableNumber(r.total_dietary_fiber),k=nullableNumber(r.food_energy);
  const code=r.Code??r.code??r.CODE??r._id,name=r.shmmitzrach||r.english_name||'מזון';
  const pv=p??0,fv=f??0,cv=c??0,fiv=fi??0;
  let cat='carb';if(fiv>=5)cat='fiber';else if(fv>=15)cat='fat';else if(pv>=Math.max(cv/2,fv/2))cat='protein';
  return {id:'gov-'+code,code,sourceCode:String(code),name,aliases:[name],p,c,f,fi,k,cat,max:800,all:r,source:'משרד הבריאות'};
}`;
if(html.includes(oldGov))html=html.replace(oldGov,newGov);
else if(!/function govFoodFromRow\(r\)\{[\s\S]*?nullableNumber/.test(html))throw new Error('government food normalization block not found');

html=html.replace(
  `<h3>מצב היעדים</h3>\n    <div class="balance" id="balance"></div>`,
  `<h3>התאמה ליעדים</h3>\n    <div class="balance" id="balance"></div>\n\n    <h3>איכות וגיוון</h3>\n    <div id="qualityDiagnostics"></div>`
);

html=html.replace(`  const issues=issueList(res);`,`  const issues=res.planner?(res.gaps||[]):issueList(res);`);
html=html.replace(`  renderBalance();\n}`,`  renderBalance();\n  renderQualityDiagnostics();\n}`);

if(!html.includes('function renderQualityDiagnostics()')){
  const anchor=`function replaceFood(id){`;
  if(!html.includes(anchor))throw new Error('quality renderer insertion anchor not found');
  const fn=`function renderQualityDiagnostics(){
  const wrap=qs('qualityDiagnostics');if(!wrap)return;
  const q=state.result?.qualityDiagnostics;
  if(!q){wrap.innerHTML='<div class="note info">נתוני איכות וגיוון יופיעו לאחר בניית התפריט.</div>';return;}
  const messages=q.messages||[];
  const status=q.concentrationWarning||!q.portionsReasonable?'warn':'success';
  wrap.innerHTML=\`<div class="note ${'${'}status}"><strong>${'${'}q.uniqueFoods} מאכלים ייחודיים</strong><br>${'${'}messages.map(x=>'• '+x).join('<br>')}</div>\`;
}

`;
  html=html.replace(anchor,fn+anchor);
}

// Target-fit bars must not present an unknown nutrient as a measured zero.
const oldBalance=`  qs('balance').innerHTML=rows.map(([label,k,goal,u])=>{
    const val=Math.round(a[k]);const pct=Math.min(130,Math.round(val/goal*100));
    return \`<div class="barbox"><strong>${'${'}label}</strong><div>${'${'}val}${'${'}u} / ${'${'}Math.round(goal)}${'${'}u}</div><div class="barline"><div class="barfill" style="width:${'${'}Math.min(100,pct)}%"></div></div><small>${'${'}pct}%</small></div>\`;
  }).join('');`;
const newBalance=`  qs('balance').innerHTML=rows.map(([label,k,goal,u])=>{
    const d=state.result?.targetDiagnostics?.[k];
    if(d?.unknown){const known=Math.round(d.actual||0);return \`<div class="barbox"><strong>${'${'}label}</strong><div>לפחות ${'${'}known}${'${'}u} / ${'${'}Math.round(goal)}${'${'}u}</div><div class="barline"><div class="barfill" style="width:0"></div></div><small>אין נתון מלא</small></div>\`;}
    const val=Math.round(a[k]);const pct=Math.min(130,Math.round(val/goal*100));
    return \`<div class="barbox"><strong>${'${'}label}</strong><div>${'${'}val}${'${'}u} / ${'${'}Math.round(goal)}${'${'}u}</div><div class="barline"><div class="barfill" style="width:${'${'}Math.min(100,pct)}%"></div></div><small>${'${'}pct}%</small></div>\`;
  }).join('');`;
if(html.includes(oldBalance))html=html.replace(oldBalance,newBalance);

// In the nutrient modal, known nutrient fields with missing source data are shown explicitly.
const oldRows=`  const rows=Object.entries(data).filter(([k,v])=>!skip.has(k)&&v!==null&&v!==''&&v!==undefined&&!(typeof v==='number'&&Number.isNaN(v))).map(([k,v])=>\`<div class="nutrient-item"><b>${'${'}NUTRIENT_LABELS[k]||k}</b><span>${'${'}v}${'${'}nutrientUnit(k)}</span></div>\`).join('');`;
const newRows=`  const rows=Object.entries(data).filter(([k,v])=>!skip.has(k)&&(NUTRIENT_LABELS[k]||v!==null&&v!==''&&v!==undefined&&!(typeof v==='number'&&Number.isNaN(v)))).map(([k,v])=>{const missing=v===null||v===''||v===undefined||typeof v==='number'&&Number.isNaN(v);return \`<div class="nutrient-item"><b>${'${'}NUTRIENT_LABELS[k]||k}</b><span>${'${'}missing?'אין נתון':v+nutrientUnit(k)}</span></div>\`}).join('');`;
if(html.includes(oldRows))html=html.replace(oldRows,newRows);

html=html.replace('nutrition-meals.js?v=4','nutrition-meals.js?v=5');
html=html.replace('nutrition-planner.js?v=1','nutrition-planner.js?v=2');
writeFileSync(path,html);
