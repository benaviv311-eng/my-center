export async function safePlay(clip){
  if(!clip?.play)return false;
  try{await Promise.resolve(clip.play());return true;}catch{return false;}
}

function distance3(a,b){return Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0),(a?.z||0)-(b?.z||0));}

let sharedContext=null;
function audioContext(){
  if(sharedContext)return sharedContext;
  const Ctx=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Ctx)return null;
  try{sharedContext=new Ctx();return sharedContext;}catch{return null;}
}

function surfaceProfile(kind){
  return ({
    rug:{frequency:92,duration:.07,volume:.032,type:'sine'},
    wood:{frequency:185,duration:.055,volume:.042,type:'triangle'},
    tile:{frequency:420,duration:.04,volume:.036,type:'square'},
    sofa:{frequency:74,duration:.085,volume:.025,type:'sine'},
  })[kind]||{frequency:185,duration:.055,volume:.035,type:'triangle'};
}

function synthSurfaceCue(kind){
  const ctx=audioContext();if(!ctx)return false;
  const p=surfaceProfile(kind),now=ctx.currentTime;
  try{if(ctx.state==='suspended')ctx.resume?.().catch?.(()=>{});const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=p.type;osc.frequency.setValueAtTime(p.frequency,now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,p.frequency*.58),now+p.duration);gain.gain.setValueAtTime(p.volume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+p.duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+p.duration+.01);return true;}catch{return false;}
}

export function createSpatialAudioAdapter({retainedAudio={}}={}){
  let last={gain:1,lowpassHz:18000,distance:0,roomRelation:'same'};
  return {
    update({listener,dad,roomRelation='same'}){
      const distance=distance3(listener,dad);
      let gain=1/(1+.09*distance*distance);
      let lowpassHz=18000;
      if(roomRelation==='adjacent'){gain*=.56;lowpassHz=1900;}
      else if(roomRelation==='distant'){gain*=.32;lowpassHz=1150;}
      gain=Math.max(0,Math.min(1,gain));
      last={gain,lowpassHz,distance,roomRelation};
      retainedAudio.setDadSpatial?.(last);
      return {...last};
    },
    playSurfaceCue(kind){return synthSurfaceCue(kind);},
    async play(clip){return safePlay(clip);},
    get state(){return {...last};},
  };
}
