(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.LanguageGamePool=factory;
})(typeof globalThis!=='undefined'?globalThis:this,function createGamePool(bank,{lang='all',topic='all',seed='game'}={}){
  if(!bank||!bank.TOPICS||!bank.LANGUAGES)throw new Error('LanguageVocabularyBank is required');

  const languageCodes=Object.keys(bank.LANGUAGES);
  const langs=languageCodes.includes(lang)?[lang]:languageCodes;
  const topicIds=topic!=='all'&&bank.TOPICS[topic]?[topic]:Object.keys(bank.TOPICS);

  function normalise(value){return String(value||'').trim().toLowerCase();}
  function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function shuffled(list,salt){
    return list.slice().map((value,index)=>({value,key:hash(`${salt}:${index}:${value.key}`)})).sort((a,b)=>a.key-b.key).map(x=>x.value);
  }

  const unique=new Map();
  topicIds.forEach(topicId=>{
    const topicData=bank.TOPICS[topicId];
    (topicData.words||[]).forEach(word=>{
      langs.forEach(code=>{
        const target=word[code]?.target||'';
        if(!target)return;
        const key=`${code}|${normalise(target)}`;
        if(unique.has(key))return;
        unique.set(key,{
          key,
          id:`${topicId}:${word.id}:${code}`,
          lang:code,
          target,
          he:word.he||'',
          topicId,
          topicName:topicData.name||topicId
        });
      });
    });
  });

  const items=[...unique.values()];
  if(!items.length)throw new Error('No vocabulary items available for the selected pool');
  let cycle=0;
  let queue=shuffled(items,`${seed}:${cycle}`);

  function refill(){
    cycle++;
    queue=shuffled(items,`${seed}:${cycle}`);
  }

  function take(count=1){
    const wanted=Math.max(0,Number(count)||0);
    const out=[];
    while(out.length<wanted){
      if(!queue.length)refill();
      out.push(queue.shift());
    }
    return out;
  }

  return{
    size:items.length,
    take,
    remaining:()=>queue.length,
    reset:()=>{cycle=0;queue=shuffled(items,`${seed}:${cycle}`);},
    all:()=>items.slice()
  };
});

(function(root){
  const createGamePool=typeof module==='object'&&module.exports?module.exports:root.LanguageGamePool;
  if(!createGamePool)return;
  const arMap={'ا':'א','أ':'א','إ':'א','آ':'א','ب':'ב','ت':'ת','ث':'ת׳','ج':'ג׳','ح':'ח','خ':'ח׳','د':'ד','ذ':'ד׳','ر':'ר','ز':'ז','س':'ס','ش':'ש','ص':'צ','ض':'ד׳','ط':'ט','ظ':'ז׳','ع':'ע','غ':'ע׳','ف':'פ','ق':'ק','ك':'כ','ل':'ל','م':'מ','ن':'נ','ه':'ה','ة':'ה','و':'ו','ي':'י','ى':'א','ء':'א','ئ':'י','ؤ':'ו'};
  const ruMap={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
  function transliterate(text,map){return String(text||'').split('').map(ch=>{const low=ch.toLowerCase();const out=map[low];if(out===undefined)return ch;if(ch===ch.toUpperCase()&&ch!==low&&out)return out.charAt(0).toUpperCase()+out.slice(1);return out;}).join('');}
  createGamePool.display=function(item){
    if(!item)return{primary:'',secondary:'',translation:''};
    if(item.lang==='ar')return{primary:transliterate(item.target,arMap),secondary:item.target,translation:item.he||''};
    if(item.lang==='ru')return{primary:transliterate(item.target,ruMap),secondary:item.target,translation:item.he||''};
    return{primary:item.target||'',secondary:'',translation:item.he||''};
  };
})(typeof globalThis!=='undefined'?globalThis:this);
