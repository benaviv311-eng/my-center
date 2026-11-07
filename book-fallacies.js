(function(root,factory){
  const api=factory(root&&root.BookFallaciesData);
  if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./book-fallacies-data.js'));
  if(root)root.BookFallacies=api;
})(typeof window!=='undefined'?window:globalThis,function(data){
  'use strict';
  const CATEGORIES=data&&data.CATEGORIES||[];
  function normalize(value){
    return String(value==null?'':value).normalize('NFKD')
      .replace(/[\u0591-\u05C7]/g,'')
      .replace(/[’‘״׳"'.,:;()\[\]–—_-]/g,' ')
      .replace(/\s+/g,' ').trim().toLowerCase();
  }
  function isTargetBook(book){
    if(!book)return false;
    const title=normalize([book.title,book.name,book.title_en,book.slug].filter(Boolean).join(' '));
    const author=normalize([book.author,book.content&&book.content.author].filter(Boolean).join(' '));
    return /logically fallacious/.test(title)||/כשלים לוגיים/.test(title)&&/bo bennett|בו בנט/.test(author);
  }
  function search(entries,query,category,savedIds){
    const terms=normalize(query).split(' ').filter(Boolean);
    const saved=savedIds instanceof Set?savedIds:new Set(savedIds||[]);
    return (Array.isArray(entries)?entries:[]).filter(entry=>{
      if(category==='saved'&&!saved.has(entry.id))return false;
      if(category&&category!=='all'&&category!=='saved'&&entry.category!==category)return false;
      if(!terms.length)return true;
      const hay=normalize([entry.title,entry.englishTitle,entry.aliases,entry.definition,entry.example].join(' '));
      return terms.every(term=>hay.includes(term));
    });
  }
  return {CATEGORIES,normalize,isTargetBook,search};
});
