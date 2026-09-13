function prioritizeDrillTopics(topics){
  const list=Array.isArray(topics)?topics.slice():[];
  const drill=list.find(item=>item&&item.id==='drills');
  if(!drill)return list;
  return [drill,...list.filter(item=>item!==drill)];
}

function pinDrillTab(panel){
  if(!panel)return;
  const all=panel.querySelector('[data-topic="all"]');
  const drills=panel.querySelector('[data-topic="drills"]');
  if(!all||!drills)return;
  if(all.nextElementSibling===drills)return;
  panel.insertBefore(drills,all.nextSibling);
}

function installDrillTabPriority(){
  if(typeof document==='undefined')return;
  const panel=document.getElementById('volleyball-population-topics');
  if(!panel)return;
  pinDrillTab(panel);
  new MutationObserver(()=>pinDrillTab(panel)).observe(panel,{childList:true});
}

if(typeof window!=='undefined'){
  window.prioritizeDrillTopics=prioritizeDrillTopics;
  window.installDrillTabPriority=installDrillTabPriority;
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installDrillTabPriority);
    else installDrillTabPriority();
  }
}

if(typeof module!=='undefined'&&module.exports){
  module.exports={prioritizeDrillTopics,pinDrillTab,installDrillTabPriority};
}
