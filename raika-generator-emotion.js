function buildEmotionPrompt(character,emotion){return `Create a Raika scene for ${character} around ${emotion}. Return story beats and dialogue. Proposal only.`;}
if(typeof window!=='undefined')window.buildEmotionPrompt=buildEmotionPrompt;if(typeof module!=='undefined')module.exports={buildEmotionPrompt};
