(function(){
  const root=document.getElementById('feed-context-links');
  if(!root)return;

  function ensureVocabularyLink(){
    let link=root.querySelector('[data-vocabulary-link]');
    if(!link){
      link=document.createElement('a');
      link.className='btn small';
      link.dataset.vocabularyLink='1';
      link.textContent='📚 אוצר מילים';
      root.prepend(link);
    }
    link.href='language-vocabulary.html';
    link.setAttribute('aria-label','אוצר מילים לכל השפות');
  }

  const observer=new MutationObserver(()=>ensureVocabularyLink());
  observer.observe(root,{childList:true});
  ensureVocabularyLink();
})();
