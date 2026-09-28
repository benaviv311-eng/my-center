const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const seedPath=path.resolve(__dirname,'../supabase/seed/raika_idea_pool.json');

test('Raika idea pool contains at least 1300 diverse canonical-compatible proposal seeds',()=>{
  assert.equal(fs.existsSync(seedPath),true,'raika_idea_pool.json must exist');
  const ideas=JSON.parse(fs.readFileSync(seedPath,'utf8'));
  assert.ok(Array.isArray(ideas));
  assert.ok(ideas.length>=1300,`expected >=1300 ideas, got ${ideas.length}`);
  assert.equal(new Set(ideas.map(x=>x.idea_id)).size,ideas.length,'idea_id must be unique');
  assert.equal(new Set(ideas.map(x=>x.signature)).size,ideas.length,'signature must be unique');

  const required=['idea_id','title','body','card_type','plot_family','signature','semantic_fingerprint','source_type'];
  for(const idea of ideas){
    for(const key of required) assert.ok(String(idea[key]??'').trim(),`${idea.idea_id||'unknown'} missing ${key}`);
    assert.equal(idea.source_type,'base');
    assert.ok(Number(idea.novelty_score)>=0&&Number(idea.novelty_score)<=1);
  }

  const categoryCounts=ideas.reduce((m,x)=>(m[x.category]=(m[x.category]||0)+1,m),{});
  const minimums={
    plotline:200,character_conflict:150,relationship_dialogue:120,flashback_history:120,
    school:100,family_comedy:100,training_mission:100,world_legacy:100,
    antagonist_mystery:100,moral_philosophy:80,what_if_twist:80,scene_seed:50
  };
  for(const [category,min] of Object.entries(minimums)){
    assert.ok((categoryCounts[category]||0)>=min,`${category} needs >=${min}, got ${categoryCounts[category]||0}`);
  }

  assert.ok(new Set(ideas.map(x=>x.card_type)).size>=12,'need at least 12 distinct card types');
  const characterCounts={};
  for(const idea of ideas) for(const id of idea.characters||[]) characterCounts[id]=(characterCounts[id]||0)+1;
  const maxShare=Math.max(0,...Object.values(characterCounts))/ideas.length;
  assert.ok(maxShare<=0.35,`single character dominates pool: ${maxShare}`);
});
