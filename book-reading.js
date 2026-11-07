(function(root,factory){
  const api=factory(root&&root.LibraryDiscovery);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.BookReading=api;
})(typeof window!=='undefined'?window:globalThis,function(discovery){
  'use strict';

  const str=value=>String(value==null?'':value).trim();
  const arr=value=>Array.isArray(value)?value.map(str).filter(Boolean):[];
  function hash(input){let h=2166136261;const s=str(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rotate(items,seed){if(!items.length)return[];const start=hash(seed)%items.length;return items.slice(start).concat(items.slice(0,start))}
  function safeId(value,index){const base=str(value).toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g,'-').replace(/^-+|-+$/g,'').slice(0,42);return base||`chapter-${index+1}`}
  function content(book){return book&&book.content?book.content:{}}
  function summaryOf(book){const c=content(book);return str(c.summary)||`הספר ${str(book&&book.title)||'הזה'} עוסק ברעיונות שאפשר לפרק, לבחון וליישם בהדרגה.`}

  const KEY_STOP_WORDS=new Set(['של','את','על','עם','זה','זו','הוא','היא','גם','אם','לא','כי','מה','איך','יותר','יכול','יכולה','אשר','כל','אחד','אחת','בין','the','and','that','this','with','from','into','when','then','than','your','you','are','for','can','will','was','were','has','have','had']);
  function keyTokens(value){
    return str(value).toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(token=>token.length>2&&!KEY_STOP_WORDS.has(token));
  }
  function splitSentences(value){
    return str(value).split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=18);
  }
  function keySentencePool(book){
    const c=content(book),out=[];
    arr(c.feed_posts).forEach(text=>out.push(text));
    arr(c.ideas).forEach(text=>out.push(text));
    splitSentences(c.summary).forEach(text=>out.push(text));
    const seen=new Set();
    return out.filter(text=>{
      const key=text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
      if(!key||seen.has(key))return false;
      seen.add(key);return true;
    });
  }
  function keySentencesFor(book,anchor,seed){
    const anchorTokens=new Set(keyTokens(anchor));
    const pool=keySentencePool(book);
    const scored=pool.map((text,index)=>{
      const tokens=keyTokens(text);
      let overlap=0;tokens.forEach(token=>{if(anchorTokens.has(token))overlap++});
      const contains=str(text).toLowerCase().includes(str(anchor).toLowerCase())||str(anchor).toLowerCase().includes(str(text).toLowerCase());
      return {text,index,score:overlap+(contains?4:0),tie:hash(`${seed}|${index}|${text}`)};
    }).sort((a,b)=>b.score-a.score||a.tie-b.tie);
    const relevant=scored.filter(item=>item.score>0);
    const fallback=scored.filter(item=>item.score===0);
    const selected=relevant.concat(fallback).slice(0,5).map(item=>item.text);
    return selected;
  }

  function relatedConcepts(book){
    if(discovery&&typeof discovery.matchConcepts==='function'){
      const found=discovery.matchConcepts(book,10);
      if(Array.isArray(found)&&found.length)return found;
    }
    const c=content(book);
    return arr(c.topics).concat(arr(c.ideas)).slice(0,8).map((title,index)=>({
      id:`fallback-${index}`,
      title,
      type:'מושג קשור',
      explanation:`${title} הוא ציר שאפשר להשתמש בו כדי לפרק את הרעיון, לזהות דפוסים ולשאול שאלות מדויקות יותר.`,
      example:`אפשר לחפש מצב יומיומי שבו ${title} משנה החלטה, התנהגות או דרך למידה.`,
      application:`בחר מקרה אחד ובדוק מה משתנה כאשר מסתכלים עליו דרך ${title}.`
    }));
  }

  function conceptFor(concepts,index){
    if(!concepts.length)return null;
    return concepts[index%concepts.length];
  }

  function mainParagraphs(book,title,anchor,summary,concept,index){
    const c=content(book),pool=keySentencePool(book),anchorText=str(anchor)||title;
    const tokens=new Set(keyTokens(anchorText));
    const score=text=>keyTokens(text).reduce((total,token)=>total+(tokens.has(token)?1:0),0);
    const ranked=pool.map((text,i)=>({text,score:score(text),i}))
      .sort((a,b)=>b.score-a.score||a.i-b.i);
    const result=[],seen=new Set();
    function add(text){
      const value=str(text),key=value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
      if(value.length<12||seen.has(key))return;
      seen.add(key);result.push(value);
    }
    if(index===0)add(c.summary);
    if(arr(c.ideas).includes(anchorText)||arr(c.feed_posts).includes(anchorText))add(anchorText);
    ranked.filter(item=>item.score>0).forEach(item=>add(item.text));
    // When no source passage uses the topic's exact vocabulary, show the
    // available book material without inventing an explanation of that topic.
    if(result.length<3)ranked.forEach(item=>add(item.text));
    if(result.length<3)add(c.summary);
    return result.slice(0,6);
  }

  function supportBlocks(anchor,concept,index){
    const blocks=[];
    if(concept){
      blocks.push({
        kind:'concept',
        title:`מושג מקצועי · ${str(concept.title)}`,
        text:str(concept.explanation)||`מושג מקצועי שמציע זווית נוספת על ${anchor}.`,
        sourceLabel:'מושג מקצועי קשור'
      });
      if(concept.application){
        blocks.push({
          kind:'application',
          title:'יישום מעשי',
          text:str(concept.application),
          sourceLabel:'הרחבה מקצועית'
        });
      }
    }else{
      blocks.push({
        kind:'question',
        title:'שאלה למחשבה',
        text:`איפה ${anchor} מופיע בצורה ברורה בחיים שלך, ומה היית רוצה לבדוק לגביו בפעם הבאה?`,
        sourceLabel:'הצעה של ChatGPT'
      });
    }
    if(index%2===1){
      blocks.push({
        kind:'perspective',
        title:'נקודת מבט אחרת',
        text:`נסה לקרוא את ${anchor} גם מהכיוון ההפוך: באילו מצבים העיקרון הזה עלול להיות חלקי, מוגזם או תלוי הקשר?`,
        sourceLabel:'הצעה של ChatGPT'
      });
    }
    return blocks;
  }

  function deepMaterial(book,title,anchor,summary,concept){
    const c=content(book);
    const paragraphs=mainParagraphs(book,title,anchor,summary,concept,1);
    const otherIdeas=arr(c.ideas).filter(text=>text!==anchor).slice(0,3);
    const topics=arr(c.topics).filter(text=>text!==anchor).slice(0,3);
    const conceptExplanation=str(concept&&concept.explanation);
    const conceptExample=str(concept&&concept.example);
    const conceptApplication=str(concept&&concept.application);
    const sourceSections=[
      {heading:'הרעיונות והטענות',paragraphs:paragraphs.slice(0,3)},
      {heading:'קשרים בתוך הספר',paragraphs:otherIdeas.concat(topics).slice(0,4)},
      {heading:concept?`מושג מקצועי קשור · ${str(concept.title)}`:'מושגים קשורים',paragraphs:[conceptExplanation,conceptExample].filter(Boolean)},
      {heading:'יישום ובדיקה',paragraphs:[conceptApplication].filter(Boolean)}
    ];
    return {
      title:`העמקה · ${title}`,
      sections:sourceSections.filter(section=>section.paragraphs.length),
      takeaway:conceptApplication||paragraphs[0]||'אין עדיין מספיק חומר משויך לנושא הזה כדי להציג סיכום מפורט.'
    };
  }

  function chapter(book,title,anchor,summary,concept,index,kicker,sourceLabel){
    return {
      id:safeId(`${index+1}-${title}`,index),
      kicker:kicker||`פרק ${index+1}`,
      title,
      sourceLabel:sourceLabel||'מתוך חומר הספר',
      keySentences:keySentencesFor(book,anchor,`${title}|${index}`),
      bodyParagraphs:mainParagraphs(book,title,anchor,summary,concept,index),
      supportBlocks:supportBlocks(anchor,concept,index),
      deep:deepMaterial(book,title,anchor,summary,concept)
    };
  }

  function buildReadingChapters(book,options){
    options=options||{};
    const c=content(book);
    const summary=summaryOf(book);
    const ideas=arr(c.ideas);
    const topics=arr(c.topics);
    const posts=arr(c.feed_posts);
    const concepts=rotate(relatedConcepts(book),`${str(options.seed)}|concepts`);
    const anchors=[];
    const pushUnique=(value,type)=>{const v=str(value);if(v&&!anchors.some(x=>x.value===v))anchors.push({value:v,type});};

    ideas.forEach(x=>pushUnique(x,'idea'));
    topics.forEach(x=>pushUnique(x,'topic'));
    posts.forEach(x=>pushUnique(x,'post'));

    const excluded=new Set(arr(options.excludeTitles));
    if(options.fullRefresh){
      const available=anchors.filter(entry=>!excluded.has(entry.value));
      const ordered=rotate(available,`${str(options.seed)}|fresh-anchors`);
      const selected=ordered.slice(0,6);
      const freshFallbacks=[
        'מבט אחר על הרעיון המרכזי',
        'הנחות שכדאי לבדוק',
        'מה משתנה כשמחליפים הקשר',
        'הבחנה שלא כדאי לפספס',
        'גבולות הרעיון',
        'שאלה חדשה לקחת הלאה'
      ];
      let fallbackIndex=0;
      while(selected.length<5&&fallbackIndex<freshFallbacks.length){
        const value=freshFallbacks[fallbackIndex++];
        if(!excluded.has(value)&&!selected.some(entry=>entry.value===value))selected.push({value,type:'fallback'});
      }
      return selected.map((entry,index)=>{
        const label=entry.type==='topic'?'נושא חדש ללמידה':entry.type==='post'?'נאגט אחר מהמאגר':entry.type==='idea'?'רעיון אחר מהספר':'זווית חדשה';
        return chapter(book,entry.value,entry.value,summary,conceptFor(concepts,index),index,label,'מתוך חומר הספר');
      }).slice(0,6);
    }

    const ordered=rotate(anchors,`${str(options.seed)}|anchors`);
    const selected=ordered.slice(0,5);
    while(selected.length<4){
      const fallback=['הרעיון המרכזי','הקשר ופרשנות','יישום ובדיקה','למידה והעברה'][selected.length];
      selected.push({value:fallback,type:'fallback'});
    }

    const chapters=[];
    chapters.push(chapter(book,'מפת הספר','הרעיון המרכזי של הספר',summary,conceptFor(concepts,0),0,'פתיחה','מתוך חומר הספר'));
    selected.forEach((entry,i)=>{
      const label=entry.type==='topic'?'נושא ללמידה':entry.type==='post'?'רעיון מהמאגר':'רעיון מרכזי';
      chapters.push(chapter(book,entry.value,entry.value,summary,conceptFor(concepts,i+1),i+1,label,'מתוך חומר הספר'));
    });

    const applicationAnchor=topics[0]||ideas[0]||'העברה מהרעיון לפעולה';
    chapters.push(chapter(book,'מהרעיון לפעולה',applicationAnchor,summary,conceptFor(concepts,selected.length+1),chapters.length,'יישום','הרחבה מקצועית'));

    return chapters.slice(0,7);
  }

  function buildTakeaways(book,chapters){
    const c=content(book);
    const ideas=arr(c.ideas);
    const topics=arr(c.topics);
    const out=[];
    const add=value=>{const v=str(value);if(v&&!out.includes(v))out.push(v);};
    ideas.slice(0,3).forEach(add);
    topics.slice(0,2).forEach(topic=>add(`נושא שכדאי להמשיך לעקוב אחריו: ${topic}`));
    (chapters||[]).slice(0,3).forEach(ch=>add(ch&&ch.deep&&ch.deep.takeaway));
    add(`המבחן החשוב של ${str(book&&book.title)||'הספר'} הוא מה משתנה בפעולה אחרי הקריאה, לא כמה משפטים זוכרים.`);
    return out.slice(0,7);
  }

  return {buildReadingChapters,buildTakeaways};
});
