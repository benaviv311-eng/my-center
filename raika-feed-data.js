const rfCore=typeof module!=='undefined'?require('./raika-feed.js'):{normalizeStatus,targetPageForType};

function buildFeedCandidates(data={}){
  const cards=[];
  const push=(item,category,text,key)=>cards.push({
    key,
    itemId:item.id||'',
    type:item.type||'idea',
    category,
    title:item.title||'ללא כותרת',
    text:String(text||''),
    status:rfCore.normalizeStatus(item.status),
    page:rfCore.targetPageForType(item.type)
  });

  for(const item of data.characters||[]){
    if(item.summary)push(item,'דמות',item.summary,`character-${item.id}-summary`);
    const fields=[['traits','מאפיין'],['wants','רצון'],['fears','פחד'],['beliefs','אמונה'],['contradictions','סתירה פנימית']];
    for(const [field,label] of fields){
      (item[field]||[]).forEach((text,index)=>push(item,label,text,`character-${item.id}-${field}-${index}`));
    }
    if(item.thinking)push(item,'צורת חשיבה',item.thinking,`character-${item.id}-thinking`);
  }

  const collections=[['scenes','סצנה'],['plotlines','קו עלילה'],['history','עבר והיסטוריה'],['world','עולם ואמונה'],['relationships','מערכת יחסים']];
  for(const [collection,label] of collections){
    for(const item of data[collection]||[]){
      const text=item.summary||item.role||item.placement||item.why||item.opens;
      if(text)push(item,label,text,`${collection}-${item.id}`);
    }
  }

  for(const item of data.ideas||[]){
    const text=item.summary||item.placement||item.why||item.opens;
    if(text)push(item,'חדר הכותבים',text,`idea-${item.id}`);
  }
  return cards;
}

if(typeof module!=='undefined')module.exports={buildFeedCandidates};
