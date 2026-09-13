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
    mentor:'Suggest a mentor-student scene where teaching, resistance, trust, or a lesson changes the relationship.',
    rivalry:'Suggest a rivalry scene driven by comparison, pride, competition, respect, jealousy, or a challenge.',
    dilemma:'Suggest a moral dilemma scene where the character must choose between two meaningful values or loyalties.',
    quiet:'Suggest a quiet intimate scene with little external action but a meaningful emotional or relational shift.',
    training:'Suggest a training scene where something goes wrong, exposes a weakness, or creates a lesson that matters later.',
    aftermath:'Suggest an aftermath scene following a victory, defeat, rescue, fight, or major event, focused on consequences and emotion.',
    misunderstanding:'Suggest a character-driven misunderstanding that creates tension or comedy without making anyone act stupidly.',
    promise:'Suggest a scene centered on a promise, vow, responsibility, or commitment that can matter later in the story.',
    foreshadow:'Suggest a foreshadowing scene that plants a subtle future clue without revealing the answer too early.',
    school:'Suggest a school or ordinary-life scene that deepens character, friendship, embarrassment, belonging, or contrast with the larger adventure.',
    journey:'Suggest a travel or journey scene where the road itself creates conversation, discovery, danger, humor, or bonding.',
    villain:'Suggest a scene from an antagonist or opposing character perspective that deepens motive without spoiling hidden canon.',
    legacy:'Suggest a scene about family history, inheritance, memory, tradition, reputation, or what one generation leaves to the next.',
    surprise:'Surprise me with a strong scene idea using these characters and the existing Raika canon.'
  };
  const instruction=instructions[mode]||instructions.related;
  return `${instruction} Characters: ${a}${b?` and ${b}`:''}. ${note||''} Do not repeat an existing or developing scene. Return a title, premise, emotional turn, sample dialogue, placement, why it fits, and canon conflicts. The result is only a proposal.`;
}
const api={buildInteractionPrompt,relatedCharacters,buildSceneIdeaPrompt};
if(typeof window!=='undefined')Object.assign(window,api);
if(typeof module!=='undefined')module.exports=api;