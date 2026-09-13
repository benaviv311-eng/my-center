const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));
const topicPages=[
  'coach-sport-psychology.html',
  'coach-coaching-psychology.html',
  'coach-movement-psychology.html',
  'coach-explosive-power.html',
  'coach-coaching-language.html',
  'coach-volleyball-approaches.html'
];

function loadModules(){
  delete require.cache[require.resolve('../coach-feed-data.js')];
  delete require.cache[require.resolve('../coach-feed.js')];
  return {...require('../coach-feed-data.js'),...require('../coach-feed.js')};
}

test('coach home exposes the approved performance-hub sections',()=>{
  const html=read('coach.html');
  assert.match(html,/coach-hero/);
  assert.match(html,/ללמוד\. לראות\. להוביל\./);
  assert.match(html,/href=["']#coach-worlds["']/);
  assert.match(html,/href=["']volleyball\.html["']/);
  assert.match(html,/id=["']coach-worlds["']/);
  assert.match(html,/id=["']coach-today["']/);
  assert.match(html,/id=["']coach-next-practice["']/);
});

test('coach home has six visual coaching-world cards with accessible lazy images',()=>{
  const html=read('coach.html');
  assert.equal((html.match(/coach-world-card/g)||[]).length,6);
  for(const page of topicPages){
    assert.match(html,new RegExp(`href=["']${page.replace('.','\\.')}["']`));
  }
  const images=html.match(/<img[^>]+>/g)||[];
  const worldImages=images.filter(tag=>/coach-world-image/.test(tag));
  assert.equal(worldImages.length,6);
  for(const tag of worldImages){
    assert.match(tag,/loading=["']lazy["']/);
    assert.match(tag,/alt=["'][^"']+["']/);
  }
});

test('coach hub home script exists, is wired, and has valid syntax',()=>{
  const html=read('coach.html');
  assert.match(html,/coach-hub\.js/);
  assert.equal(exists('coach-hub.js'),true);
  if(!exists('coach-hub.js')) return;
  const result=spawnSync(process.execPath,['--check','coach-hub.js'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});

test('selected feed cards render contextual lazy images',()=>{
  const {COACH_FEED_CARDS,COACH_TOPICS,renderCard}=loadModules();
  const card=COACH_FEED_CARDS.find(item=>item.image&&item.imageAlt);
  assert.ok(card,'expected at least one feed card with image metadata');
  const html=renderCard(card,COACH_TOPICS);
  assert.match(html,/coach-card-image/);
  assert.match(html,/loading=["']lazy["']/);
  assert.match(html,/alt=["'][^"']+["']/);
});

test('coach challenge reuses question behavior with distinct presentation',()=>{
  const {COACH_FEED_CARDS,COACH_TOPICS,renderCard}=loadModules();
  const card=COACH_FEED_CARDS.find(item=>item.type==='question'&&item.challenge===true);
  assert.ok(card,'expected at least one challenge question');
  const html=renderCard(card,COACH_TOPICS);
  assert.match(html,/coach-challenge-card/);
  assert.match(html,/Coach Challenge/);
});
