const fs = require('fs');
const assert = require('assert');
const test = require('node:test');

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

const attackDefendedSource = extractFunction('attackDefended');
const runDefense = new Function('player', 'performance', 'a', `${attackDefendedSource}; return attackDefended(a);`);
const perf = { now: () => 1000 };

test('ability 4 — highWave maps to song 4 and crouch is the counter', () => {
  assert.strictEqual(songAbilities[3], 'highWave');
  assert.match(html, /highWave:\{id:'highWave',name:'גל גבוה'.*height:'high'\}/s);
  assert.strictEqual(runDefense({ z:0, jumpUntil:0, crouching:true, rollUntil:0 }, perf, { type:'wave', height:'high' }), true);
  assert.strictEqual(runDefense({ z:0, jumpUntil:0, crouching:false, rollUntil:0 }, perf, { type:'wave', height:'high' }), false);
});

test('ability 5 — beam maps to song 5, telegraphs, and uses line collision', () => {
  assert.strictEqual(songAbilities[4], 'beam');
  assert.match(html, /beam:\{id:'beam',name:'קרן קול'.*warning:(\d+),duration:(\d+),height:'area'\}/s);
  assert.match(html, /if\(def\.kind==='beam'\)\{dadAttacks\.push\(\{type:'beam'.*warningUntil:now\+def\.warning,deadAt:now\+def\.warning\+def\.duration/s);
  const beamHitsSource = extractFunction('beamHits');
  const runBeamHit = new Function('player','a', `${beamHitsSource}; return beamHits(a);`);
  const beam = { x:100, y:100, angle:0, length:620, width:34 };
  assert.strictEqual(runBeamHit({ x:300, y:100, r:15 }, beam), true);
  assert.strictEqual(runBeamHit({ x:300, y:180, r:15 }, beam), false);
  assert.match(html, /a\.type==='beam'.*now>=a\.warningUntil.*beamHits\(a\).*damageLibi\(1/s);
});

test('ability 6 — homingNote maps to song 6 and a last-second roll breaks tracking', () => {
  assert.strictEqual(songAbilities[5], 'homingNote');
  assert.match(html, /homingNote:\{id:'homingNote',name:'תו רודף'.*homing:true/s);
  assert.match(html, /if\(id==='homingNote'\)\{addNote\(a,def\.speed,\{homing:true,name:def\.name\}\);return true\}/);
  assert.match(html, /if\(a\.homing&&now<player\.rollUntil&&Math\.hypot\(player\.x-a\.x,player\.y-a\.y\)<105\)\{a\.homing=false;a\.homingDodged=true\}/);
  assert.strictEqual(runDefense({ z:0, jumpUntil:0, crouching:false, rollUntil:1200 }, perf, { type:'note', homing:true }), true);
});

test('ability 7 — ring maps to song 7 and leaving the ground avoids it', () => {
  assert.strictEqual(songAbilities[6], 'ring');
  assert.match(html, /ring:\{id:'ring',name:'טבעת קול'.*kind:'ring'/s);
  const safeSource = extractFunction('playerSafeFromGroundRing');
  const runSafe = new Function('player','performance', `${safeSource}; return playerSafeFromGroundRing();`);
  assert.strictEqual(runSafe({ hanging:false, z:0, vaultUntil:0 }, perf), false);
  assert.strictEqual(runSafe({ hanging:false, z:25, vaultUntil:0 }, perf), true);
  assert.strictEqual(runSafe({ hanging:true, z:0, vaultUntil:0 }, perf), true);
  assert.strictEqual(runSafe({ hanging:false, z:0, vaultUntil:1200 }, perf), true);
  assert.match(html, /a\.type==='ring'.*playerSafeFromGroundRing\(\)/s);
});

test('ability 8 — chorusBoom maps to song 8 and becomes dangerous only after warning', () => {
  assert.strictEqual(songAbilities[7], 'chorusBoom');
  const m = html.match(/chorusBoom:\{id:'chorusBoom',name:'בום של פזמון',cooldown:(\d+),kind:'boom',warning:(\d+),radius:(\d+),height:'area'\}/);
  assert.ok(m);
  assert.ok(Number(m[2]) > 0, 'chorusBoom must telegraph');
  assert.ok(Number(m[3]) >= 150, 'chorusBoom must have a meaningful radial area');
  assert.match(html, /if\(def\.kind==='boom'\)\{dadAttacks\.push\(\{type:'boom'.*warningUntil:now\+def\.warning,deadAt:now\+def\.warning\+360/s);
  assert.match(html, /a\.type==='boom'.*now>=a\.warningUntil.*Math\.hypot\(player\.x-a\.x,player\.y-a\.y\)<=a\.radius\+player\.r.*damageLibi\(1/s);
});

test('ability 9 — midWave maps to song 9 and roll is the counter', () => {
  assert.strictEqual(songAbilities[8], 'midWave');
  assert.match(html, /midWave:\{id:'midWave',name:'גל אמצע'.*height:'mid'\}/s);
  assert.strictEqual(runDefense({ z:0, jumpUntil:0, crouching:false, rollUntil:1200 }, perf, { type:'wave', height:'mid' }), true);
  assert.strictEqual(runDefense({ z:0, jumpUntil:0, crouching:false, rollUntil:0 }, perf, { type:'wave', height:'mid' }), false);
});

test('ability 10 — bouncingNote maps to song 10 and bounces from arena bounds', () => {
  assert.strictEqual(songAbilities[9], 'bouncingNote');
  assert.match(html, /bouncingNote:\{id:'bouncingNote',name:'תו קופץ'.*bounce:true/s);
  assert.match(html, /if\(id==='bouncingNote'\)\{addNote\(a,def\.speed,\{bounce:true,name:def\.name\}\);return true\}/);
  assert.match(html, /if\(a\.bounce\)\{if\(a\.x<20\|\|a\.x>940\)a\.vx\*=-1;if\(a\.y<20\|\|a\.y>580\)a\.vy\*=-1;/);
  assert.match(html, /a\.x=clamp\(a\.x,20,940\);a\.y=clamp\(a\.y,20,580\)/);
});
