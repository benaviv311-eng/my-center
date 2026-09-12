function normalizeStatus(status){
  return ['canon','developing','idea','parked'].includes(status) ? status : 'idea';
}

function targetPageForType(type){
  const pages={
    character:'raika-characters.html',
    scene:'raika-scenes.html',
    plotline:'raika-plotlines.html',
    history:'raika-history.html',
    world:'raika-world.html',
    relationship:'raika-relationships.html',
    idea:'raika-writers-room.html',
    conversation:'raika-writers-room.html',
    comedy:'raika-writers-room.html',
    flashback:'raika-writers-room.html',
    philosophy:'raika-writers-room.html',
    worldbuilding:'raika-writers-room.html',
    thought:'raika-writers-room.html',
    desire:'raika-writers-room.html',
    heritage:'raika-writers-room.html'
  };
  return pages[type] || 'raika-writers-room.html';
}

function hashString(value){
  let hash=0;
  const text=String(value);
  for(let i=0;i<text.length;i++) hash=((hash<<5)-hash+text.charCodeAt(i))|0;
  return hash>>>0;
}

function seededShuffle(items,seed){
  let state=(Number(seed)>>>0)||1;
  const result=[...items];
  const random=()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

function dailyFeed(items,dateKey,refreshSeed=0,count=16){
  const seed=hashString(`${dateKey}|${refreshSeed}`);
  return seededShuffle(items,seed).slice(0,Math.min(Number(count)||16,items.length));
}

if(typeof module!=='undefined') module.exports={normalizeStatus,targetPageForType,hashString,seededShuffle,dailyFeed};
