(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.HomeFeedSources=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const SOURCE_META={
    raika:{label:'⚡ ראיקה'},coach:{label:'🧠 מאמן'},volleyball:{label:'🏐 כדורעף'},
    languages:{label:'🌍 שפות'},music:{label:'🎵 מוזיקה'},library:{label:'📚 ספרייה'},verses:{label:'📖 פסוקים'}
  };
  const RAIKA_PAGES={character:'raika-characters.html',scene:'raika-scenes.html',plotline:'raika-plotlines.html',history:'raika-history.html',world:'raika-world.html',relationship:'raika-relationships.html',idea:'raika-writers-room.html'};
  function item(v){return Object.assign({id:'',source:'',type:'item',title:'',summary:'',fullText:'',deepLink:'',tags:[],weight:0,expandable:false,metadata:{}},v);}
  const text=v=>String(v==null?'':v).trim();
  const arr=v=>Array.isArray(v)?v:[];
  function cleanTags(tags){return [...new Set(arr(tags).map(text).filter(Boolean))];}
  function joinText(values){return values.map(text).filter(Boolean).join('\n\n');}
  function raikaTypeFor(group,row){
    if(row&&row.type) return text(row.type);
    return ({characters:'character',scenes:'scene',plotlines:'plotline',history:'history',world:'world',relationships:'relationship',ideas:'idea'})[group]||'item';
  }
  function fromRaika(data){
    const out=[];
    const groups=['characters','scenes','plotlines','history','world','relationships','ideas'];
    for(const group of groups){
      for(const row of arr(data&&data[group])){
        const type=raikaTypeFor(group,row);
        const rawId=text(row.id||row.slug||row.title||`${group}-${out.length}`);
        const title=text(row.title||row.name||row.label||'ראיקה');
        const summary=text(row.summary||row.body||row.description||row.text||row.placement||'');
        const fullText=joinText([summary,row.why,row.opens,row.thinking,arr(row.traits).join(' · '),arr(row.beliefs).join(' · '),arr(row.contradictions).join(' · ')]);
        out.push(item({
          id:`raika:${type}:${rawId}`,source:'raika',type,title,summary:summary||fullText,fullText,
          deepLink:RAIKA_PAGES[type]||'raika.html',tags:cleanTags(row.tags),weight:row.status==='canon'?2:0,
          expandable:Boolean(fullText&&fullText!==summary),metadata:{status:text(row.status||''),role:text(row.role||''),originalId:rawId}
        }));
      }
    }
    return out;
  }
  function fromCoach(data){
    const topics=new Map(arr(data&&data.COACH_TOPICS).map(t=>[t.id,t]));
    return arr(data&&data.COACH_FEED_CARDS).map(row=>{
      const topic=topics.get(row.topic)||{};
      const summary=text(row.body||row.question||row.summary||row.title);
      const fullText=joinText([summary,row.application,row.explanation,row.principle,row.applicationDetails]);
      return item({
        id:`coach:${text(row.id)}`,source:'coach',type:text(row.type||'concept'),title:text(row.title||'מאמן'),summary,fullText,
        deepLink:text(topic.page||'coach.html'),tags:cleanTags([row.topic,...arr(row.tags)]),weight:row.evidenceStrength==='חזק'?2:0,
        expandable:Boolean(fullText&&fullText!==summary),metadata:{topic:text(row.topic||''),source:text(row.source||''),evidenceStrength:text(row.evidenceStrength||'')}
      });
    }).filter(x=>x.id!=='coach:');
  }
  function fromVolleyball(cards){
    return arr(cards).map(row=>item({
      id:`volleyball:${text(row.id)}`,source:'volleyball',type:text(row.kind||'concept'),title:text(row.title||'כדורעף'),
      summary:text(row.text||row.title),fullText:joinText([row.text,row.detail]),deepLink:'volleyball.html#volleyball-feed-section',
      tags:cleanTags([row.topic,...arr(row.tags),...arr(row.populations),...arr(row.levels)]),weight:0,expandable:Boolean(text(row.detail)),
      metadata:{topic:text(row.topic||''),populations:arr(row.populations),levels:arr(row.levels)}
    })).filter(x=>x.id!=='volleyball:');
  }
  function languageSummary(card){
    if(card.he) return text(card.he);
    if(card.prompt) return text(card.prompt);
    if(card.title) return text(card.title);
    if(card.item&&card.item.he) return text(card.item.he);
    return text(card.target||'שפות');
  }
  function languageFullText(card){
    const values=[card.target,card.pron,card.he];
    if(card.item) values.push(card.item.target,card.item.pron,card.item.he);
    if(Array.isArray(card.lines)) values.push(...card.lines.map(line=>Array.isArray(line)?line.filter(Boolean).join(' · '):text(line)));
    if(card.question) values.push(card.question);
    return [...new Set(values.map(text).filter(Boolean))].join(' · ');
  }
  function fromLanguages(model,seed='home-languages',count=48){
    if(!model||typeof model.buildFeed!=='function') return [];
    let cards=[];
    try{cards=model.buildFeed({filter:'all',seed,count})||[];}catch(_){return []}
    return arr(cards).map((card,index)=>{
      const cid=text(card.id||`${index}`),lang=text(card.lang||'all'),type=text(card.type||'item');
      const summary=languageSummary(card),fullText=languageFullText(card)||summary;
      return item({id:`languages:${lang}:${type}:${cid}`,source:'languages',type,title:text(card.title||card.he||card.target||'שפות'),summary,fullText,deepLink:'languages.html',tags:cleanTags([lang,type]),weight:0,expandable:true,metadata:{lang}});
    });
  }
  function fromLibraryPayload(payload,discovery){
    const books=arr(payload&&payload.books);
    let posts=[];
    if(discovery&&typeof discovery.buildDiscoveryPool==='function'){
      try{posts=discovery.buildDiscoveryPool(books)||[];}catch(_){posts=[]}
    }
    if(posts.length){
      return posts.map((post,index)=>item({
        id:`library:${text(post.id||`${post.bookId||'book'}:${index}`)}`,source:'library',type:text(post.sourceKind||post.type||'post'),
        title:text(post.title||post.bookTitle||'ספרייה'),summary:text(post.text||post.explanation||''),
        fullText:joinText([post.text,post.example,post.application]),deepLink:'library.html',
        tags:cleanTags([post.type,post.sourceKind,post.bookTitle]),weight:0,expandable:Boolean(post.example||post.application),
        metadata:{bookId:text(post.bookId||''),bookTitle:text(post.bookTitle||''),sourceLabel:text(post.sourceLabel||'')}
      }));
    }
    return books.map(book=>item({
      id:`library:book:${text(book.slug||book.id)}`,source:'library',type:'book',title:text(book.title||'ספר'),
      summary:text(book.content&&book.content.summary||''),fullText:joinText([book.content&&book.content.summary,...arr(book.content&&book.content.ideas)]),
      deepLink:'library.html',tags:cleanTags([book.content&&book.content.category,...arr(book.content&&book.content.topics)]),weight:0,expandable:false,
      metadata:{bookId:text(book.id||''),slug:text(book.slug||'')}
    })).filter(x=>x.id!=='library:book:');
  }
  function fromVerseRows(rows){
    return arr(rows).map((row,index)=>{
      const c=row.content||{};
      const raw=text(row.id||row.slug||index);
      const verse=text(c.verse||row.title||'פסוק');
      const reference=text(c.reference||'');
      const summary=[verse,reference].filter(Boolean).join(' — ');
      return item({
        id:`verses:${raw}`,source:'verses',type:'verse',title:reference||text(row.title||'פסוק'),summary,fullText:joinText([c.literary,c.human,c.raika_context]),
        deepLink:'index.html',tags:cleanTags(['פסוק',reference]),weight:0,expandable:true,metadata:{slug:text(row.slug||''),reference}
      });
    });
  }
  function decodeEntities(s){
    return String(s||'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
  }
  function stripHtml(s){return decodeEntities(String(s||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
  function fromMusicHtml(html){
    const source=String(html||''),out=[];
    const cards=source.match(/<article\b[^>]*class=["'][^"']*\bcard\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)||[];
    cards.forEach((block,index)=>{
      const heading=(block.match(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/i)||[])[1];
      const label=(block.match(/<div\b[^>]*class=["'][^"']*\blabel\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)||[])[1];
      const title=stripHtml(heading)||stripHtml(label)||`מוזיקה ${index+1}`;
      const body=stripHtml(block);
      const summary=body.replace(title,'').trim().slice(0,320)||body.slice(0,320);
      out.push(item({id:`music:card:${index+1}`,source:'music',type:'music',title,summary,fullText:body,deepLink:'music.html',tags:cleanTags([stripHtml(label)]),weight:0,expandable:body.length>summary.length,metadata:{index}}));
    });
    return out;
  }
  async function collectAll(env={}){
    const items=[];const errors=[];
    const add=list=>{for(const x of arr(list)) if(x&&x.id) items.push(x);};
    try{add(fromRaika(env.raikaData))}catch(error){errors.push({source:'raika',message:error.message||String(error)})}
    try{add(fromCoach(env.coachData))}catch(error){errors.push({source:'coach',message:error.message||String(error)})}
    try{add(fromVolleyball(env.volleyballCards))}catch(error){errors.push({source:'volleyball',message:error.message||String(error)})}
    try{add(fromLanguages(env.languageModel,env.seed||'home-languages',48))}catch(error){errors.push({source:'languages',message:error.message||String(error)})}
    const jobs=[
      {source:'library',run:async()=>{
        if(typeof env.fetchLibraryPayload!=='function') return [];
        const payload=await env.fetchLibraryPayload();return fromLibraryPayload(payload,env.libraryDiscovery);
      }},
      {source:'verses',run:async()=>{
        if(typeof env.fetchVerses!=='function') return [];
        const rows=await env.fetchVerses();return fromVerseRows(rows);
      }},
      {source:'music',run:async()=>{
        if(typeof env.fetchMusicHtml!=='function') return [];
        const html=await env.fetchMusicHtml();return fromMusicHtml(html);
      }}
    ];
    const settled=await Promise.allSettled(jobs.map(j=>j.run()));
    settled.forEach((result,index)=>{
      if(result.status==='fulfilled') add(result.value);
      else errors.push({source:jobs[index].source,message:result.reason&&result.reason.message?result.reason.message:String(result.reason||'unknown')});
    });
    const unique=new Map();items.forEach(x=>{if(!unique.has(x.id))unique.set(x.id,x)});
    return {items:[...unique.values()],errors};
  }
  return {SOURCE_META,RAIKA_PAGES,item,fromRaika,fromCoach,fromVolleyball,fromLanguages,fromLibraryPayload,fromVerseRows,fromMusicHtml,collectAll};
});
