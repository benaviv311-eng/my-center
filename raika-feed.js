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
    relationship:'raika-relationships.html'
  };
  return pages[type] || 'raika-writers-room.html';
}

if(typeof module!=='undefined') module.exports={normalizeStatus,targetPageForType};
