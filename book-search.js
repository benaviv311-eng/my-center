(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.BookSearch=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const str=value=>String(value==null?'':value).trim();
  const list=value=>Array.isArray(value)?value:[];
  function normalize(value){
    return str(value).toLowerCase().normalize('NFKD')
      .replace(/\u05be/g,' ')
      .replace(/[\u0591-\u05c7\u0300-\u036f]/g,'')
      .replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
  }
  function point(value){
    if(typeof value==='string')return {title:value.slice(0,78),description:value};
    if(value&&typeof value==='object')return {
      title:str(value.title||value.heading||value.name||value.text||value.description).slice(0,78),
      description:str(value.text||value.description||value.summary||value.title)
    };
    return {title:'',description:''};
  }
  function buildBookIndex(book,chapters,relatedConcepts,guides){
    const c=book&&book.content||{},out=[],ids=new Set();
    function add(kind,id,title,description,more){
      const name=str(title),key=`${kind}:${id}`;
      if(!name||ids.has(key))return;
      ids.add(key);
      out.push(Object.assign({id:key,kind,title:name,description:str(description),sourceLabel:'מתוך חומר הספר'},more||{}));
    }
    list(chapters).forEach((ch,index)=>{
      const extra=list(ch&&ch.bodyParagraphs).join(' ');
      add('chapter',ch&&ch.id||index,ch&&ch.title,extra.slice(0,330),{
        chapterId:str(ch&&ch.id),searchTerms:extra,detail:extra,sourceLabel:ch&&ch.sourceLabel||'מסלול הקריאה'
      });
    });
    list(c.chapters).forEach((ch,index)=>{
      const p=point(ch);
      add('chapter-source',index,p.title,p.description,{detail:p.description,sourceLabel:'פרק ממאגר הספר'});
    });
    list(c.topics).forEach((title,index)=>add('topic',index,title,'',{sourceLabel:'מפת הנושאים'}));
    list(c.ideas).forEach((value,index)=>{
      const p=point(value);add('idea',index,p.title,p.description,{detail:p.description});
    });
    list(c.feed_posts).forEach((value,index)=>{
      const p=point(value);add('passage',index,p.title,p.description,{detail:p.description});
    });
    [...list(c.key_points),...list(c.learning_points)].forEach((value,index)=>{
      const p=point(value);add('point',index,p.title,p.description,{detail:p.description,sourceLabel:'נקודה ללמידה'});
    });
    list(relatedConcepts).forEach((concept,index)=>{
      add('concept',concept&&concept.id||index,concept&&concept.title,concept&&concept.explanation,{
        sourceLabel:'מושג מקצועי קשור',
        detail:str(concept&&concept.explanation),
        example:str(concept&&concept.example),
        application:str(concept&&concept.application),
        searchTerms:str(concept&&concept.keywords&&concept.keywords.join(' '))
      });
    });
    list(guides).forEach((guide,index)=>{
      add('guide',guide&&guide.id||index,guide&&guide.title,guide&&guide.explanation,{
        sourceLabel:str(guide&&guide.sourceLabel)||'הסבר לימודי על הספר',
        detail:str(guide&&guide.explanation),
        example:str(guide&&guide.example),
        distinction:str(guide&&guide.distinction),
        searchTerms:str(guide&&guide.searchTerms),
        sourceUrl:str(guide&&guide.sourceUrl)
      });
    });
    return out;
  }
  function searchBookIndex(entries,query){
    const terms=normalize(query).split(' ').filter(Boolean);
    if(!terms.length)return list(entries).slice();
    return list(entries).filter(entry=>{
      const value=normalize([entry.title,entry.description,entry.searchTerms].filter(Boolean).join(' '));
      return terms.every(term=>value.includes(term));
    }).sort((a,b)=>{
      const exactA=normalize(a.title)===normalize(query)?1:0;
      const exactB=normalize(b.title)===normalize(query)?1:0;
      return exactB-exactA;
    });
  }
  return {buildBookIndex,searchBookIndex,normalize};
});
