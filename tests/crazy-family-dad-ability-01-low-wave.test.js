const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('crazy-family.html', 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `${name} should exist`);
  const brace = html.indexOf('{', start);
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

// 1. Song 1 must own ability 1.
const mapMatch = html.match(/const DAD_SONG_ABILITY_MAP=\[([^\]]+)\]/);
assert.ok(mapMatch, 'Dad song ability map should exist');
const songAbilities = mapMatch[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));
assert.strictEqual(songAbilities[0], 'lowWave', 'song 1 should trigger lowWave');

// 2. Ability 1 must be a low travelling wave with a warning window.
const lowWaveMatch = html.match(/lowWave:\{id:'lowWave',name:'גל נמוך',cooldown:(\d+),kind:'wave',speed:(\d+),width:(\d+),thickness:(\d+),warning:(\d+),maxDistance:(\d+),height:'low'\}/);
assert.ok(lowWaveMatch, 'lowWave definition should keep its approved low-wave shape');
const [, cooldown, speed, width, thickness, warning, maxDistance] = lowWaveMatch.map(Number);
assert.ok(cooldown > 0, 'lowWave should have cooldown');
assert.ok(speed > 0 && width > 0 && thickness > 0 && maxDistance > 0, 'lowWave should travel and have collision dimensions');
assert.ok(warning > 0, 'lowWave should telegraph before becoming dangerous');

// 3. The real defense function must treat jumping as the low-wave counter.
const attackDefendedSource = extractFunction('attackDefended');
const runDefense = new Function('player', 'performance', 'a', `${attackDefendedSource}; return attackDefended(a);`);
const perf = { now: () => 1000 };
const lowAttack = { type: 'wave', height: 'low' };

let player = { z: 0, jumpUntil: 0, crouching: false, rollUntil: 0 };
assert.strictEqual(runDefense(player, perf, lowAttack), false, 'standing on the ground should not defend lowWave');

player = { z: 30, jumpUntil: 0, crouching: false, rollUntil: 0 };
assert.strictEqual(runDefense(player, perf, lowAttack), true, 'being physically above the wave should defend lowWave');

player = { z: 0, jumpUntil: 1200, crouching: false, rollUntil: 0 };
assert.strictEqual(runDefense(player, perf, lowAttack), true, 'active jump timing should defend lowWave');

// 4. The real wave collision function must detect the lane and reject misses outside it.
const waveHitsSource = extractFunction('waveHits');
const runWaveHit = new Function('player', 'a', `${waveHitsSource}; return waveHits(a);`);
const wave = { x: 100, y: 100, angle: 0, width: Number(width), thickness: Number(thickness) };

player = { x: 100, y: 100, r: 15 };
assert.strictEqual(runWaveHit(player, wave), true, 'player in the low-wave body should collide');

player = { x: 100, y: 100 + Number(width), r: 15 };
assert.strictEqual(runWaveHit(player, wave), false, 'player outside the wave width should not collide');

// 5. A successful undefended wave collision must route through one-life damage.
assert.match(
  html,
  /a\.type==='wave'.*waveHits\(a\)&&!attackDefended\(a\).*damageLibi\(1,a\.name\|\|'התקפה של אבא'\)/s,
  'lowWave hit path should remove exactly one life when not defended'
);

console.log('PASS: Dad ability 1 lowWave — mapping, collision, and jump defense');
