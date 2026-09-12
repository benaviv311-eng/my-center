(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./language-feed-model.js'));
  }else{
    root.LanguageFeedModel=factory(root.LanguageFeedModel);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
  if(!M)return M;

  const CODES=M.LANGUAGE_CODES;
  const TYPE_ORDER=M.TYPE_ORDER;
  const GAME_TYPES=M.GAME_TYPES;

  function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function pick(list,n){return list[n%list.length];}
  function shuffle(list,seed){return list.slice().map((value,index)=>({value,key:hash(`${seed}:${index}:${value.id||value}`)})).sort((a,b)=>a.key-b.key).map(x=>x.value);}
  function wordObject(lang,row){return {lang,id:row[0],target:row[1],pron:row[2]||'',he:row[3]};}
  function sentenceObject(lang,row){return {lang,id:row[0],target:row[1],pron:row[2]||'',he:row[3]};}
  function findWord(lang,id){return M.BANK[lang].words.find(row=>row[0]===id)||M.BANK[lang].words[0];}
  function findSentence(lang,id){return M.BANK[lang].sentences.find(row=>row[0]===id)||M.BANK[lang].sentences[0];}

  const SHARED_WORD_IDS=M.BANK.ar.words.map(row=>row[0]).filter(id=>CODES.every(lang=>M.BANK[lang].words.some(row=>row[0]===id)));
  const SHARED_SENTENCE_IDS=M.BANK.ar.sentences.map(row=>row[0]).filter(id=>CODES.every(lang=>M.BANK[lang].sentences.some(row=>row[0]===id)));

  function challengeVariant(lang,concept,seed){
    const correct=wordObject(lang,findWord(lang,concept));
    const alternatives=shuffle(M.BANK[lang].words.filter(row=>row[0]!==concept).map(row=>wordObject(lang,row)),`${seed}:${lang}:alts`).slice(0,3);
    return {correct,options:shuffle([correct,...alternatives],`${seed}:${lang}:opts`),prompt:'מה פירוש המילה?'};
  }

  function variantsFor(type,index,seed){
    const variants={};
    const variantHash=hash(`${seed}:${type}:${index}`);

    if(type==='word'){
      const concept=pick(SHARED_WORD_IDS,variantHash);
      CODES.forEach(lang=>{variants[lang]={item:wordObject(lang,findWord(lang,concept))};});
      return {variants,hebrew:variants.ar.item.he,concept};
    }

    if(type==='sentence'){
      const concept=pick(SHARED_SENTENCE_IDS,variantHash);
      CODES.forEach(lang=>{variants[lang]={item:sentenceObject(lang,findSentence(lang,concept))};});
      return {variants,hebrew:variants.ar.item.he,concept};
    }

    if(type==='challenge'){
      const concept=pick(SHARED_WORD_IDS,variantHash);
      CODES.forEach(lang=>{variants[lang]=challengeVariant(lang,concept,`${seed}:${index}`);});
      return {variants,hebrew:variants.ar.correct.he,concept};
    }

    const collectionName=type==='joke'?'jokes':type==='story'?'stories':type==='dialogue'?'dialogues':type==='culture'?'culture':null;
    if(collectionName){
      const minLength=Math.min(...CODES.map(lang=>M.BANK[lang][collectionName].length));
      const slot=variantHash%Math.max(1,minLength);
      CODES.forEach(lang=>{variants[lang]={...M.BANK[lang][collectionName][slot]};});
      let hebrew='';
      if(type==='culture')hebrew=variants.ar.phrase?.[2]||variants.ar.title||'';
      else hebrew=(variants.ar.lines||[]).map(row=>row[2]).filter(Boolean).join(' ');
      return {variants,hebrew,slot};
    }

    return variantsFor('word',index,seed);
  }

  function buildFourLanguageFeed({seed='four-feed',count=12}={}){
    const safeCount=Math.max(1,Math.min(60,Number(count)||12));
    const typeShift=hash(`${seed}:types`)%TYPE_ORDER.length;
    const cards=[];
    for(let i=0;i<safeCount;i++){
      const type=TYPE_ORDER[(i+typeShift)%TYPE_ORDER.length];
      const built=variantsFor(type,i,seed);
      cards.push({id:`four:${seed}:${type}:${i}:${hash(seed+type+i)%97}`,lang:'four',type,...built});
    }
    return cards;
  }

  function commonWordConcepts(seed,count){
    return shuffle(SHARED_WORD_IDS,`${seed}:concepts`).slice(0,Math.min(count,SHARED_WORD_IDS.length));
  }

  function wordItemsForLang(lang,concepts){
    return concepts.map(id=>wordObject(lang,findWord(lang,id)));
  }

  function buildFourLanguageMiniGame({type='flashcards',seed='four-game'}={}){
    const safeType=GAME_TYPES.includes(type)&&type!=='four-languages'?type:'flashcards';
    const variants={};
    const id=`four-game:${safeType}:${hash(seed)}`;

    if(safeType==='sentence-builder'){
      const sentenceId=pick(SHARED_SENTENCE_IDS,hash(`${seed}:sentence`));
      CODES.forEach(lang=>{
        const sentence=sentenceObject(lang,findSentence(lang,sentenceId));
        const answer=M.getDisplay(sentence).primary.split(/\s+/).filter(Boolean);
        variants[lang]={lang,sentence,answer,words:shuffle(answer,`${seed}:${lang}:words`)};
      });
      return {id,type:safeType,lang:'four',variants,prompt:variants.ar.sentence.he};
    }

    const count=safeType==='memory'||safeType==='recall'?4:6;
    const concepts=commonWordConcepts(seed,count);
    CODES.forEach(lang=>{variants[lang]={lang,items:wordItemsForLang(lang,concepts)};});
    return {id,type:safeType,lang:'four',variants,prompt:variants.ar.items[0]?.he||''};
  }

  M.buildFourLanguageFeed=buildFourLanguageFeed;
  M.buildFourLanguageMiniGame=buildFourLanguageMiniGame;
  return M;
});
