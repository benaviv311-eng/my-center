export async function safePlay(clip){
  if(!clip?.play)return false;
  try{await Promise.resolve(clip.play());return true;}catch{return false;}
}

function distance3(a,b){return Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0),(a?.z||0)-(b?.z||0));}

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
    async play(clip){return safePlay(clip);},
    get state(){return {...last};},
  };
}
