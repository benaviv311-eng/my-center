(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.DoubleMenuLobbyState=api;
})(typeof self!=='undefined'?self:this,function(){
  const diffMeta={easy:{icon:'🌱',label:'קל'},normal:{icon:'⚡',label:'בינוני'},hard:{icon:'🔥',label:'קשה'}};
  const voiceMeta={
    british:{flag:'🇬🇧',label:'British',lang:'en-GB',text:"Let's go!"},
    russian:{flag:'🇷🇺',label:'Русский',lang:'ru-RU',text:'Поехали!'},
    italian:{flag:'🇮🇹',label:'Italiano',lang:'it-IT',text:'Andiamo!'},
    american:{flag:'🇺🇸',label:'American Hype',lang:'en-US',text:'Game on!'},
    japanese:{flag:'🇯🇵',label:'日本語',lang:'ja-JP',text:'いくぞ！'},
    arcade:{flag:'🎮',label:'Arcade',lang:'en-US',text:'Ready? Go!'}
  };
  function createState(opts={}){
    return {screen:'players',players:1,difficulty:opts.difficulty||'normal',voice:opts.voice||'british',mode:'classic',variant:null,target:null,modeLabel:'קלאסי'};
  }
  function choosePlayers(s,players){return {...s,players:Number(players)===2?2:1,screen:'modes'};}
  function chooseMode(s,mode){return {...s,mode:mode.mode||'classic',variant:mode.variant||null,target:mode.target||null,modeLabel:mode.label||'קלאסי',screen:'difficulty'};}
  function chooseDifficulty(s,difficulty){return {...s,difficulty:diffMeta[difficulty]?difficulty:'normal',screen:'home'};}
  function openVoice(s){return {...s,screen:'voice'};}
  function chooseVoice(s,voice){return {...s,voice:voiceMeta[voice]?voice:'british'};}
  function loadoutLabel(s){const d=diffMeta[s.difficulty]||diffMeta.normal;return `${s.players===2?'👥 2 שחקנים':'🎮 1 שחקן'} · ${s.modeLabel||'קלאסי'} · ${d.icon} ${d.label}`;}
  function voiceSample(v){return voiceMeta[v]||voiceMeta.british;}
  return {createState,choosePlayers,chooseMode,chooseDifficulty,openVoice,chooseVoice,loadoutLabel,voiceSample,diffMeta,voiceMeta};
});
