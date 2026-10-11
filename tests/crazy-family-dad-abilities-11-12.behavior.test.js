const fs = require('fs');
const assert = require('assert');
const test = require('node:test');

const html = fs.readFileSync('crazy-family.html', 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} should exist`);
  const openParen = html.indexOf('(', start);
  let parenDepth = 0;
  let closeParen = -1;
  for (let i = openParen; i < html.length; i++) {
    if (html[i] === '(') parenDepth++;
    else if (html[i] === ')') {
      parenDepth--;
      if (parenDepth === 0) { closeParen = i; break; }
    }
  }
  assert.notStrictEqual(closeParen, -1, `${name} should have a complete parameter list`);
  const brace = html.indexOf('{', closeParen);
  assert.notStrictEqual(brace, -1, `${name} should have a body`);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

const ambientMatch = html.match(/const dadAmbientAbilityIds=\[([^\]]+)\]/);
assert.ok(ambientMatch, 'ambient Dad ability list should exist');
const ambientAbilities = ambientMatch[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));

const aimedAngleSource = extractFunction('aimedAngle');
const notePoseHeightSource = extractFunction('notePoseHeight');
const randomAttackNotePoseSource = extractFunction('randomAttackNotePose');
const addNoteSource = extractFunction('addNote');
const shuffledDadNoteLanesSource = extractFunction('shuffledDadNoteLanes');
const laneVolleySource = extractFunction('fireDadLaneVolley');
const laneBarrageSource = extractFunction('fireDadLaneBarrage');
const randomVolleySource = extractFunction('fireDadRandomAngleVolley');
const ambientTriggerSource = extractFunction('triggerDadAmbientAttack');
const attackDefendedSource = extractFunction('attackDefended');

test('ability 11 — note barrage is routed from Dad speech and uses 1-3 of three lanes', () => {
  assert.strictEqual(ambientAbilities[0], 'noteBarrage');
  assert.match(html, /const DAD_NOTE_LANES=\[-72,0,72\]/, 'ability 11 should use exactly three fixed lanes');
  assert.match(html, /function playDadPre\([^)]*\).*triggerDadAmbientAttack\('talk'\)/s, 'Dad speech should trigger ability 11');

  const math = Object.create(Math);
  math.random = () => 0.5;
  const runVolley = new Function('dad','player','performance','Math', `
    let dadAttacks=[];
    const dadSongPlaying=()=>false;
    const DAD_NOTE_LANES=[-72,0,72];
    ${aimedAngleSource}
    ${notePoseHeightSource}
    ${randomAttackNotePoseSource}
    ${addNoteSource}
    ${shuffledDadNoteLanesSource}
    ${laneVolleySource}
    const ok=fireDadLaneVolley();
    return {ok,dadAttacks};
  `);
  const result = runVolley(
    { scene:'ground', x:100, y:100 },
    { scene:'ground', x:500, y:100 },
    { now:()=>1000 },
    math
  );
  assert.strictEqual(result.ok, true);
  assert.ok(result.dadAttacks.length >= 1 && result.dadAttacks.length <= 3, 'one volley should occupy 1-3 lanes');
  assert.deepStrictEqual(result.dadAttacks.map(a => a.notePose), ['lying','lying'], 'deterministic volley should preserve note pose across its lanes');
  assert.deepStrictEqual(result.dadAttacks.map(a => a.y).sort((a,b)=>a-b), [28,172], 'two deterministic lanes should be the ±72 lanes around Dad');

  let volleys = 0;
  const delays = [];
  const mathBarrage = Object.create(Math);
  mathBarrage.random = () => 0.8;
  const runBarrage = new Function('dad','player','Math','setTimeout', `
    const dadSongPlaying=()=>false;
    let volleys=0;
    const fireDadLaneVolley=()=>{volleys++; return true};
    ${laneBarrageSource}
    const ok=fireDadLaneBarrage();
    return {ok,volleys};
  `);
  const fakeSetTimeout = (fn, delay) => { delays.push(delay); fn(); return 1; };
  const barrage = runBarrage({scene:'ground'}, {scene:'ground'}, mathBarrage, fakeSetTimeout);
  volleys = barrage.volleys;
  assert.strictEqual(barrage.ok, true);
  assert.strictEqual(volleys, 3, 'maximum barrage should fire three waves');
  assert.deepStrictEqual(delays, [0,430,860], 'three waves should be rhythmically spaced');
});

test('ability 12 — angled note volley is routed from pant/yawn and spawns 1-3 notes on one random lane', () => {
  assert.strictEqual(ambientAbilities[1], 'randomNoteVolley');
  assert.match(html, /state==='pant'.*triggerDadAmbientAttack\('breath'\)/s, 'pant should trigger ability 12');
  assert.match(html, /state==='yawn'.*triggerDadAmbientAttack\('breath'\)/s, 'yawn should trigger ability 12');

  const math = Object.create(Math);
  math.random = () => 0.5;
  const runRandomVolley = new Function('dad','player','performance','Math', `
    let dadAttacks=[];
    const dadSongPlaying=()=>false;
    const DAD_NOTE_LANES=[-72,0,72];
    ${aimedAngleSource}
    ${notePoseHeightSource}
    ${randomAttackNotePoseSource}
    ${addNoteSource}
    ${randomVolleySource}
    const ok=fireDadRandomAngleVolley();
    return {ok,dadAttacks};
  `);
  const result = runRandomVolley(
    { scene:'ground', x:100, y:100 },
    { scene:'ground', x:500, y:100 },
    { now:()=>1000 },
    math
  );
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.dadAttacks.length, 2, 'deterministic random volley should create two notes');
  assert.ok(result.dadAttacks.every(a => a.notePose === 'lying'), 'one volley should share one pose/counter');
  assert.ok(result.dadAttacks.every(a => a.y === 100), 'all notes in the deterministic volley should share one lane');
  assert.ok(result.dadAttacks[0].x > result.dadAttacks[1].x, 'notes should be staggered along the same angled lane');
});

test('ambient router blocks abilities 11-12 during songs and selects the correct source', () => {
  const runRouter = (songPlaying, kind) => new Function('kind', `
    const dadSongPlaying=()=>${songPlaying};
    const player={scene:'ground'},dad={scene:'ground'};
    const activeDadAbilities=new Set(['noteBarrage','randomNoteVolley']);
    let talk=0,breath=0;
    const fireDadLaneBarrage=()=>{talk++;return true};
    const fireDadRandomAngleVolley=()=>{breath++;return true};
    ${ambientTriggerSource}
    const ok=triggerDadAmbientAttack(kind);
    return {ok,talk,breath};
  `)(kind);

  assert.deepStrictEqual(runRouter(false,'talk'), {ok:true,talk:1,breath:0});
  assert.deepStrictEqual(runRouter(false,'breath'), {ok:true,talk:0,breath:1});
  assert.deepStrictEqual(runRouter(true,'talk'), {ok:false,talk:0,breath:0});
  assert.deepStrictEqual(runRouter(true,'breath'), {ok:false,talk:0,breath:0});
});

test('standing, lying and floating notes expose three distinct counters', () => {
  const runDefense = new Function('player','performance','a', `${attackDefendedSource}; return attackDefended(a);`);
  const perf = { now:()=>1000 };
  assert.strictEqual(runDefense({z:0,jumpUntil:0,crouching:false,rollUntil:0}, perf, {type:'note',notePose:'standing'}), false, 'standing note requires lane movement');
  assert.strictEqual(runDefense({z:30,jumpUntil:0,crouching:false,rollUntil:0}, perf, {type:'note',notePose:'lying'}), true, 'lying note is jumpable');
  assert.strictEqual(runDefense({z:0,jumpUntil:0,crouching:true,rollUntil:0}, perf, {type:'note',notePose:'floating'}), true, 'floating note is crouchable');
});
