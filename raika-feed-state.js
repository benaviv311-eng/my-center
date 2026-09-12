function raikaFeedDateKey(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function raikaFeedRefreshKey(dateKey){return `raika-feed-refresh-v1:${dateKey}`;}

function prepareRaikaDailyFeed(data){
  const dateKey=raikaFeedDateKey();
  let refreshSeed=0;
  if(typeof localStorage!=='undefined')refreshSeed=Number(localStorage.getItem(raikaFeedRefreshKey(dateKey))||0)||0;
  const selected=dailyFeed(buildFeedCandidates(data),dateKey,refreshSeed,16);
  data.ideas=selected.map(card=>({
    id:`feed-${card.key}`,
    title:`${card.category} · ${card.title}`,
    summary:card.text,
    status:card.status,
    type:card.type,
    tags:[card.category],
    feedPage:card.page
  }));
  return data;
}

function refreshRaikaFeed(){
  const dateKey=raikaFeedDateKey();
  if(typeof localStorage!=='undefined'){
    const key=raikaFeedRefreshKey(dateKey);
    const current=Number(localStorage.getItem(key)||0)||0;
    localStorage.setItem(key,String(current+1));
  }
  if(typeof location!=='undefined')location.reload();
}

if(typeof window!=='undefined'&&window.RAIKA_DATA)prepareRaikaDailyFeed(window.RAIKA_DATA);
if(typeof module!=='undefined')module.exports={raikaFeedDateKey,raikaFeedRefreshKey,prepareRaikaDailyFeed};
