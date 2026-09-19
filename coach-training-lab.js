(function(root,factory){
  let data={};
  if(typeof module!=='undefined'&&module.exports){
    data=require('./coach-training-lab-data.js');
  }else if(root&&root.CoachTrainingLabData){
    data=root.CoachTrainingLabData;
  }
  const api=factory(data);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachTrainingLab=api;
})(typeof window!=='undefined'?window:globalThis,function(data){
  'use strict';

  function normalizeText(value){
    return String(value==null?'':value).normalize('NFKD').replace(/[׳’']/g,'').trim().toLowerCase();
  }

  function isValidHttpUrl(value){
    try{
      const url=new URL(value);
      return url.protocol==='http:'||url.protocol==='https:';
    }catch(_error){
      return false;
    }
  }

  function validateItem(item){
    const errors=[];
    const required=['id','title','type','summary','topics','levels','sourceKind','evidenceStrength','tags'];
    for(const key of required){
      const value=item?.[key];
      if(value==null||value===''||(Array.isArray(value)&&value.length===0)) errors.push(key);
    }
    if(item?.type&&!data.LAB_TYPES.includes(item.type)) errors.push('type');
    if(Array.isArray(item?.topics)&&item.topics.some(topic=>!data.LAB_TOPICS.some(x=>x.id===topic))) errors.push('topics');
    if(Array.isArray(item?.levels)&&item.levels.some(level=>!data.LAB_LEVELS.includes(level))) errors.push('levels');
    if(item?.sourceKind&&!data.LAB_SOURCE_KINDS.includes(item.sourceKind)) errors.push('sourceKind');
    if(item?.evidenceStrength&&!data.LAB_EVIDENCE_STRENGTHS.includes(item.evidenceStrength)) errors.push('evidenceStrength');

    if(item?.type==='drill'){
      for(const key of ['objective','setup','steps','childExplanation','sayExactly','oneCue']){
        const value=item[key];
        if(value==null||value===''||(Array.isArray(value)&&value.length===0)) errors.push(key);
      }
      if((!item.ages||item.ages.length===0)&&(!item.grades||item.grades.length===0)) errors.push('ages|grades');
    }
    if(item?.sourceKind==='research'){
      for(const key of ['sourcePublisher','sourceTitle','sourceUrl','sourceClaim','science','sourceDate']){
        if(!item[key]) errors.push(key);
      }
    }
    if(item?.sourceUrl){
      if(!isValidHttpUrl(item.sourceUrl)) errors.push('sourceUrl');
      if(!item.sourceAccessedAt) errors.push('sourceAccessedAt');
    }
    return {valid:errors.length===0,errors:[...new Set(errors)]};
  }

  function validateData(items){
    const errors=[];
    const ids=new Set();
    for(const item of items||[]){
      const result=validateItem(item);
      if(!result.valid) errors.push({id:item?.id||null,errors:result.errors});
      if(ids.has(item?.id)) errors.push({id:item?.id||null,errors:['duplicate-id']});
      ids.add(item?.id);
    }
    return {valid:errors.length===0,errors};
  }

  return {normalizeText,isValidHttpUrl,validateItem,validateData};
});
