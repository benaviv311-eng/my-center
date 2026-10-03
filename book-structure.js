(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.BookStructure=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function normalizePoint(value,index){
    if(typeof value==='string')return {title:'',text:value,index:index+1};
    if(value&&typeof value==='object')return {
      title:String(value.title||value.heading||''),
      text:String(value.text||value.description||value.summary||''),
      index:index+1
    };
    return {title:'',text:'',index:index+1};
  }

  function pointKey(point){
    return `${point.title} ${point.text}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  }

  function dedupe(values){
    const seen=new Set(),result=[];
    (Array.isArray(values)?values:[]).forEach((value,index)=>{
      const point=normalizePoint(value,index);
      const key=pointKey(point);
      if(!key||seen.has(key))return;
      seen.add(key);result.push(point);
    });
    return result;
  }

  function fallbackPoints(content){
    return dedupe([
      ...(Array.isArray(content.ideas)?content.ideas:[]),
      ...(Array.isArray(content.feed_posts)?content.feed_posts:[])
    ]);
  }

  function buildBookStructure(book){
    const content=book&&book.content&&typeof book.content==='object'?book.content:{};
    const curated=dedupe(content.key_points);
    const expanded=dedupe(content.learning_points);
    const fallback=fallbackPoints(content);
    const keyPoints=(curated.length?curated:fallback).slice(0,12);
    const learningPoints=(expanded.length?expanded:(curated.length?curated:fallback)).slice(0,30);
    const keySet=new Set(keyPoints.map(pointKey));
    const hasExtendedLearning=learningPoints.length>keyPoints.length||learningPoints.some(point=>!keySet.has(pointKey(point)));
    return {
      summary:String(content.summary||''),
      keyPoints,
      learningPoints,
      hasExtendedLearning
    };
  }

  return {normalizePoint,dedupe,buildBookStructure};
});
