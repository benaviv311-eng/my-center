(function(){
  const root=document.getElementById('feed-context-links');
  if(!root)return;
  const codes=['ar','it','ru','es'];

  function currentLanguage(){
    const active=document.querySelector('[data-feed-filter][aria-pressed="true"]')?.dataset.feedFilter;
    if(codes.includes(active))return active;
    try{
      const saved=JSON.parse(localStorage.getItem('my-center-language-feed-v1')||'{}').filter;
      return codes.includes(saved)?saved:null;
    }catch(e){return null;}
  }

  function ensureVocabularyLink(){
    const lang=currentLanguage();
    const existing=root.querySelector('[data-vocabulary-link]');
    if(!lang){existing?.remove();return;}
    const href=`language-vocabulary.html?lang=${lang}`;
    if(existing){
      if(existing.getAttribute('href')!==href)existing.setAttribute('href',href);
      return;
    }
    const link=document.createElement('a');
    link.className='btn small';
    link.href=href;
    link.dataset.vocabularyLink='1';
    link.textContent='📚 אוצר מילים';
    root.prepend(link);
  }

  const observer=new MutationObserver(()=>ensureVocabularyLink());
  observer.observe(root,{childList:true});
  document.querySelectorAll('[data-feed-filter]').forEach(button=>button.addEventListener('click',()=>setTimeout(ensureVocabularyLink,0)));
  ensureVocabularyLink();
})();
