(function(root,factory){
  if(typeof module==='object'&&module.exports){module.exports=factory;}
  else{root.LanguageVocabularyViewModel=factory;}
})(typeof globalThis!=='undefined'?globalThis:this,function(bank){
  const topics=bank&&bank.TOPICS?bank.TOPICS:{};
  const topicIds=Object.keys(topics);
  const defaultTopic=topicIds[0]||'';

  function topicEntries(topicId){
    const topic=topics[topicId];
    if(!topic)return[];
    return topic.words.map(word=>({topicId,topic,word}));
  }

  function initialEntries(){return topicEntries(defaultTopic);}

  function search(query){
    const q=String(query||'').trim().toLowerCase();
    if(!q)return initialEntries();
    const results=[];
    topicIds.forEach(topicId=>{
      const topic=topics[topicId];
      topic.words.forEach(word=>{
        const haystack=[topic.name,word.he,word.ar&&word.ar.target,word.it&&word.it.target,word.ru&&word.ru.target,word.es&&word.es.target]
          .filter(Boolean).join(' ').toLowerCase();
        if(haystack.includes(q))results.push({topicId,topic,word});
      });
    });
    return results;
  }

  return{topicIds,defaultTopic,topicEntries,initialEntries,search};
});
