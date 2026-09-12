function normalizeStatus(status){
  return ['canon','developing','idea','parked'].includes(status) ? status : 'idea';
}

function targetPageForType(type){
  const pages={character:'raika-characters.html',scene:'raika-scenes.html',plotline:'raika-plotlines.html',history:'raika-history.html',world:'raika-world.html',relationship:'raika-relationships.html'};
  return pages[type] || 'raika-writers-room.html';
}

function hashString(value){
  let total=7;
  for(const character of String(value)) total=(total*31+character.charCodeAt(0))%2147483647;
  return total;
}

function seededShuffle(items,seed){
  let state=(Number(seed)%2147483647)||1;
  const result=[...items];
  const random=()=>{state=(state*16807)%2147483647;return state/2147483647;};
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

function dailyFeed(items,dateKey,refreshSeed=0,count=16){
  return seededShuffle(items,hashString(`${dateKey}-${refreshSeed}`)).slice(0,Math.min(Number(count)||16,items.length));
}

function buildFeedCandidates(data={}){
  const cards=[];
  const push=(item,category,text,key)=>cards.push({key,itemId:item.id||'',type:item.type||'idea',category,title:item.title||'ללא כותרת',text:String(text||''),status:normalizeStatus(item.status),page:targetPageForType(item.type)});
  for(const item of data.characters||[]){
    if(item.summary)push(item,'דמות',item.summary,`character-${item.id}-summary`);
    const fields=[['traits','מאפיין'],['wants','רצון'],['fears','פחד'],['beliefs','אמונה'],['contradictions','סתירה פנימית']];
    for(const [field,label] of fields)(item[field]||[]).forEach((text,index)=>push(item,label,text,`character-${item.id}-${field}-${index}`));
    if(item.thinking)push(item,'צורת חשיבה',item.thinking,`character-${item.id}-thinking`);
  }
  for(const [collection,label] of [['scenes','סצנה'],['plotlines','קו עלילה'],['history','עבר והיסטוריה'],['world','עולם ואמונה'],['relationships','מערכת יחסים']]){
    for(const item of data[collection]||[]){const text=item.summary||item.role||item.placement||item.why||item.opens;if(text)push(item,label,text,`${collection}-${item.id}`);}
  }
  for(const item of data.ideas||[]){const text=item.summary||item.placement||item.why||item.opens;if(text)push(item,'חדר הכותבים',text,`idea-${item.id}`);}
  return cards;
}

if(typeof module!=='undefined') module.exports={normalizeStatus,targetPageForType,hashString,seededShuffle,dailyFeed,buildFeedCandidates};
