const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('crazy-family.html', 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} should exist`);
  const brace = html.indexOf('{', start);
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

const mapMatch = html.match(/const DAD_SONG_ABILITY_MAP=\[([^\]]+)\]/);
assert.ok(mapMatch, 'Dad song ability map should exist');
const songAbilities = mapMatch[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));
assert.strictEqual(songAbilities[1], 'echo', 'song 2 should trigger returning echo');

const aimedAngleSource = extractFunction('aimedAngle');
const echoSource = extractFunction('spawnReturningEchoAttack');

function spawnEcho(randomValue) {
  const math = Object.create(Math);
  math.random = () => randomValue;
  const run = new Function('dad', 'player', 'performance', 'Math', `
    ${aimedAngleSource}
    ${echoSource}
    const dadAttacks=[];
    const ok=spawnReturningEchoAttack({});
    return {ok, attacks:dadAttacks};
  `);
  return run(
    { scene: 'ground', x: 100, y: 100 },
    { scene: 'ground', x: 500, y: 100 },
    { now: () => 1000 },
    math
  );
}

for (const [randomValue, firstHeight, returnHeight] of [
  [0.25, 'low', 'high'],
  [0.75, 'high', 'low']
]) {
  const { ok, attacks } = spawnEcho(randomValue);
  assert.strictEqual(ok, true, 'echo should spawn successfully');
  assert.strictEqual(attacks.length, 2, 'echo should create exactly outbound and return waves');
  const [outbound, returning] = attacks;
  assert.strictEqual(outbound.type, 'wave');
  assert.strictEqual(returning.type, 'wave');
  assert.strictEqual(outbound.height, firstHeight, 'outbound height should follow the chosen pattern');
  assert.strictEqual(returning.height, returnHeight, 'return height should be the opposite of outbound');
  assert.ok(Math.abs(Math.abs(returning.angle - outbound.angle) - Math.PI) < 1e-9, 'return wave should travel in the opposite direction');
  assert.ok(returning.warningUntil > outbound.warningUntil, 'return wave should launch after outbound travel');
  assert.strictEqual(returning.originX, outbound.originX + Math.cos(outbound.angle) * outbound.maxDistance, 'return wave should start at outbound endpoint X');
  assert.strictEqual(returning.originY, outbound.originY + Math.sin(outbound.angle) * outbound.maxDistance, 'return wave should start at outbound endpoint Y');
}

const attackDefendedSource = extractFunction('attackDefended');
const runDefense = new Function('player', 'performance', 'a', `${attackDefendedSource}; return attackDefended(a);`);
const perf = { now: () => 1000 };

assert.strictEqual(
  runDefense({ z: 30, jumpUntil: 0, crouching: false, rollUntil: 0 }, perf, { type: 'wave', height: 'low' }),
  true,
  'jumping should defend the low leg of echo'
);
assert.strictEqual(
  runDefense({ z: 0, jumpUntil: 0, crouching: true, rollUntil: 0 }, perf, { type: 'wave', height: 'high' }),
  true,
  'crouching should defend the high leg of echo'
);
assert.strictEqual(
  runDefense({ z: 0, jumpUntil: 0, crouching: false, rollUntil: 0 }, perf, { type: 'wave', height: 'high' }),
  false,
  'standing should be vulnerable to the high leg of echo'
);

console.log('PASS: Dad ability 2 returning echo — outbound/return directions and opposite-height counters');
