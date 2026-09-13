(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.BookOriginalContent=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function getOriginalTextSources(book){
    const content=book&&book.content?book.content:{};
    return Array.isArray(content.original_text_sources)?content.original_text_sources.filter(Boolean):[];
  }

  function getOriginalTextAsset(book){
    const content=book&&book.content?book.content:{};
    return typeof content.original_text_asset==='string'&&content.original_text_asset?content.original_text_asset:null;
  }

  function mergeOriginalParts(parts){
    const merged=[];
    for(const part of Array.isArray(parts)?parts:[]){
      if(!part||!Array.isArray(part.sections)||!part.sections.length)continue;
      const phaseTitle=part.phaseTitle||'';
      const last=merged[merged.length-1];
      if(last&&last.phaseTitle===phaseTitle){
        last.sections.push(...part.sections);
      }else{
        merged.push({phaseTitle,sections:[...part.sections]});
      }
    }
    return merged;
  }

  function parseOriginalBookMarkdown(markdown){
    const text=String(markdown||'').replace(/\r\n?/g,'\n').trim();
    const lines=text.split('\n');
    let phaseTitle='';
    const sections=[];
    let current=null;
    for(const line of lines){
      const phase=line.match(/^#\s+(.+)$/);
      if(phase&&!phaseTitle){phaseTitle=phase[1].trim();continue;}
      const section=line.match(/^##\s+(?:(\d+)\.\s+)?(.+)$/);
      if(section){
        if(current){current.body=current.body.join('\n').trim();sections.push(current);}
        current={number:section[1]?Number(section[1]):null,title:section[2].trim(),body:[]};
        continue;
      }
      if(current)current.body.push(line);
    }
    if(current){current.body=current.body.join('\n').trim();sections.push(current);}
    return {phaseTitle,sections};
  }

  return {getOriginalTextSources,getOriginalTextAsset,mergeOriginalParts,parseOriginalBookMarkdown};
});