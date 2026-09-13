function buildInteractionPrompt(a,b,note=''){return `Suggest an interaction between ${a} and ${b}. ${note} Return a title, each character's goal, the interaction, sample dialogue, story placement, canon fit, and possible canon conflicts. The result is only a proposal.`;}
function relatedCharacters(data={},seedId=''){
  const chars=Array.isArray(data.characters)?data.characters:[];
  const seed=chars.find(c=>c.id===seedId);
  if(!seed)return chars.filter(c=>c.id!==seedId);
  const score=new Map(chars.filter(c=>c.id!==seedId).map(c=>[c.id,0]));
  const add=(id,n)=>{if(score.has(id))score.set(id,score.get(id)+n);};
  for(const scene of data.scenes||[]){const ids=scene.characters||[];if(ids.includes(seedId))for(const id of ids)if(id!==seedId)add(id,5);}
  for(const rel of data.relationships||[]){const ids=rel.characters||[];if(ids.includes(seedId))for(const id of ids)if(id!==seedId)add(id,7);}
  const seedTags=new Set(seed.tags||[]);
  for(const c of chars)if(c.id!==seedId)for(const tag of c.tags||[])if(seedTags.has(tag))add(c.id,1);
  return chars.filter(c=>c.id!==seedId).sort((a,b)=>(score.get(b.id)||0)-(score.get(a.id)||0)||String(a.title||'').localeCompare(String(b.title||''),'he'));
}
function buildSceneIdeaPrompt(mode,a='',b='',note=''){
  const instructions={
    related:'Suggest a scene that feels naturally motivated by the existing relationship or canon links between these characters.',
    relationship:'Suggest a scene that reveals or changes the relationship between these characters.',
    theme:'Suggest a scene that explores the requested theme through the characters choices, tension, or dialogue.',
    conflict:'Suggest a scene built around a meaningful conflict between these characters.',
    comedy:'Suggest a warm or character-driven comedic scene between these characters.',
    flashback:'Suggest a flashback scene that adds useful backstory without repeating an existing scene.',
    secret:'Suggest a scene involving a secret, discovery, withheld truth, or reveal that fits canon.',
    family:'Suggest a family scene that reveals affection, tension, routine, history, or a changing family dynamic.',
    surprise:'Surprise me with a strong scene idea using these characters and the existing Raika canon.'
  };
  const instruction=instructions[mode]||instructions.related;
  return `${instruction} Characters: ${a}${b?` and ${b}`:''}. ${note||''} Do not repeat an existing or developing scene. Return a title, premise, emotional turn, sample dialogue, placement, why it fits, and canon conflicts. The result is only a proposal.`;
}
const api={buildInteractionPrompt,relatedCharacters,buildSceneIdeaPrompt};
if(typeof window!=='undefined')Object.assign(window,api);
if(typeof module!=='undefined')module.exports=api;