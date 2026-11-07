(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.BookFallaciesUI=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const STORAGE_KEY='my-center-logically-fallacious-saved';
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeUrl=value=>/^https:\/\/www\.logicallyfallacious\.com\//.test(value||'')?value:'https://www.logicallyfallacious.com/fallacies';

  function cardMarkup(entry,saved){
    return `<button type="button" class="fallacy-card" data-fallacy-open="${esc(entry.id)}" aria-label="פתח את ${esc(entry.title)}">
      <span class="fallacy-card-kicker">${entry.kind==='reference'?'מאמר עזר':'כשל לוגי'} ${saved?'<span class="fallacy-card-saved">★ שמורים</span>':''}</span>
      <strong>${esc(entry.title)}</strong><span class="fallacy-card-english" dir="ltr">${esc(entry.englishTitle)}</span>
      ${entry.definition?`<span class="fallacy-card-preview">${esc(entry.definition)}</span>`:'<span class="fallacy-card-preview fallacy-card-pending">הסבר מלא במקור הרשמי</span>'}
      <span class="fallacy-card-action">לפתיחת הערך ←</span>
    </button>`;
  }

  function detailMarkup(entry,saved){
    const link=safeUrl(entry.sourceUrl);
    return `<div class="fallacy-detail-top"><span class="reading-eyebrow">${entry.kind==='reference'?'מאמר עזר':'מילון הכשלים הלוגיים'}</span><button type="button" data-fallacy-detail-close aria-label="סגור פירוט">×</button></div>
      <h3>${esc(entry.title)}</h3><p class="fallacy-detail-english" dir="ltr">${esc(entry.englishTitle)}</p>
      <div class="fallacy-detail-body">
        ${entry.definition?`<section><h4>מהו הכשל?</h4><p>${esc(entry.definition)}</p></section>`:'<section><h4>פירוט</h4><p>טרם נוסף הסבר עברי מאומת לערך הזה. אפשר לקרוא את הפירוט המלא במקור הרשמי; השתמש בשם האנגלי המופיע מעל כדי לאתר אותו.</p></section>'}
        ${entry.example?`<section><h4>דוגמה מהחיים</h4><p>${esc(entry.example)}</p></section>`:''}
        <section class="fallacy-detail-check"><h4>שאלה שכדאי לשאול</h4><p>מהי הראיה למסקנה, והאם הנימוק באמת מוביל אליה?</p></section>
      </div><div class="fallacy-detail-actions">
        <button type="button" class="fallacy-save-button" data-fallacy-save="${esc(entry.id)}" aria-pressed="${saved?'true':'false'}">${saved?'★ הסר מהשמורים':'☆ שמור ללמידה'}</button>
        <a href="${esc(link)}" target="_blank" rel="noopener noreferrer">למאגר המקור הרשמי ↗</a>
      </div><p class="fallacy-credit">מקור שמות הערכים: Logically Fallacious. ההסברים והדוגמאות בעברית הם עיבוד לימודי עצמאי ואינם ציטוט מספרו של בו בנט.</p>`;
  }

  function readSaved(){
    try{
      const raw=JSON.parse(root.localStorage.getItem(STORAGE_KEY)||'[]');
      return new Set(Array.isArray(raw)?raw.filter(x=>typeof x==='string'):[]);
    }catch(_){return new Set()}
  }
  function writeSaved(saved){
    try{root.localStorage.setItem(STORAGE_KEY,JSON.stringify([...saved]))}catch(_){}
  }

  function install(){
    if(!root.document)return;
    const doc=root.document,byId=id=>doc.getElementById(id);
    const toggle=byId('book-fallacies-toggle'),section=byId('book-fallacies-section'),input=byId('book-fallacies-input');
    const filters=byId('book-fallacies-filters'),results=byId('book-fallacies-results'),detail=byId('book-fallacies-detail');
    const more=byId('book-fallacies-more'),count=byId('book-fallacies-count'),close=byId('book-fallacies-close');
    if(!toggle||!section||!input||!filters||!results||!detail||!more||!count||!close)return;
    const dataset=root.BookFallaciesData,model=root.BookFallacies;
    if(!dataset||!model)return;
    const all=dataset.ENTRIES,byEntry=new Map(all.map(x=>[x.id,x]));
    let saved=readSaved(),category='all',shown=48,selected=null,enabled=false;

    function filterMarkup(){
      filters.innerHTML=model.CATEGORIES.map(c=>`<button type="button" class="fallacy-chip ${category===c.id?'is-active':''}" data-fallacy-category="${esc(c.id)}" aria-pressed="${category===c.id?'true':'false'}">${esc(c.label)}${c.id==='saved'?` (${saved.size})`:''}</button>`).join('');
    }
    function render(){
      const matching=model.search(all,input.value,category,saved);
      count.textContent=`${matching.length} תוצאות מתוך ${all.length} ערכי המאגר המקוון · ${saved.size} שמורים`;
      results.innerHTML=matching.length?matching.slice(0,shown).map(x=>cardMarkup(x,saved.has(x.id))).join(''):'<p class="fallacy-empty">אין תוצאות לחיפוש הזה. נסה מונח קצר יותר או קטגוריה אחרת.</p>';
      more.hidden=matching.length<=shown;
      filterMarkup();
    }
    function renderDetail(){
      if(!selected){detail.hidden=true;detail.innerHTML='';return}
      const entry=byEntry.get(selected);
      if(!entry){selected=null;detail.hidden=true;return}
      detail.innerHTML=detailMarkup(entry,saved.has(entry.id));detail.hidden=false;
    }
    function setOpen(open){
      section.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent=open?'⚠️ סגור את מילון הכשלים':'⚠️ מילון הכשלים · 238 ערכים';
      if(open){render();section.scrollIntoView({behavior:'smooth',block:'start'})}
      else toggle.focus({preventScroll:true});
    }
    toggle.addEventListener('click',()=>setOpen(section.hidden));
    close.addEventListener('click',()=>setOpen(false));
    input.addEventListener('input',()=>{shown=48;selected=null;renderDetail();render()});
    filters.addEventListener('click',event=>{
      const button=event.target.closest('[data-fallacy-category]');if(!button)return;
      category=button.dataset.fallacyCategory;shown=48;selected=null;renderDetail();render();
    });
    results.addEventListener('click',event=>{
      const button=event.target.closest('[data-fallacy-open]');if(!button)return;
      selected=button.dataset.fallacyOpen;renderDetail();
      detail.scrollIntoView({behavior:'smooth',block:'nearest'});
      detail.querySelector('[data-fallacy-detail-close]')?.focus({preventScroll:true});
    });
    detail.addEventListener('click',event=>{
      if(event.target.closest('[data-fallacy-detail-close]')){selected=null;renderDetail();return}
      const save=event.target.closest('[data-fallacy-save]');if(!save)return;
      const id=save.dataset.fallacySave;
      if(saved.has(id))saved.delete(id);else saved.add(id);
      writeSaved(saved);render();renderDetail();
    });
    more.addEventListener('click',()=>{shown+=48;render()});
    section.addEventListener('keydown',event=>{if(event.key==='Escape'&&selected){selected=null;renderDetail()}});
    root.addEventListener('book:content-ready',event=>{
      const book=event.detail&&event.detail.book;
      enabled=model.isTargetBook(book);toggle.hidden=!enabled;
      if(!enabled){section.hidden=true;selected=null;renderDetail();return}
      category='all';shown=48;input.value='';saved=readSaved();render();
    });
  }
  if(root.document){
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});
    else install();
  }
  return {cardMarkup,detailMarkup,install};
});
