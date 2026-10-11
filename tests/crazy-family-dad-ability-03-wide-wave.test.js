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
assert.strictEqual(songAbilities[2], 'wideWave', 'song 3 should trigger wideWave');

const wideMatch = html.match(/wideWave:\{id:'wideWave',name:'גל רחב',cooldown:(\d+),kind:'wave',speed:(\d+),width:(\d+),thickness:(\d+),warning:(\d+),maxDistance:(\d+),height:'area'\}/);
assert.ok(wideMatch, 'wideWave definition should exist');
const [, cooldown, speed, width, thickness, warning, maxDistance] = wideMatch.map(Number);
assert.ok(cooldown > 0 && speed > 0 && thickness > 0 && warning > 0 && maxDistance > 0, 'wideWave should be a telegraphed travelling attack');
assert.ok(width >= 450, 'wideWave should cover a very broad lane');

const coverSource = extractFunction('wideWaveBlockedByFurniture');
const runCover = new Function('player', 'houseZone', 'pointInHouseZone', 'a', `${coverSource}; return wideWaveBlockedByFurniture(a);`);
const inRect = (z, x, y, pad=0) => x >= z.x-pad && x <= z.x+z.w+pad && y >= z.y-pad && y <= z.y+z.h+pad;
const attack = { name: 'גל רחב', originX: 100, originY: 100 };
const player = { scene: 'ground', x: 500, y: 100 };

const furnitureBetween = id => id === 'sofa' ? { x: 260, y: 60, w: 80, h: 80 } : null;
assert.strictEqual(runCover(player, furnitureBetween, inRect, attack), true, 'furniture between Dad and Libi should block wideWave');

const furnitureAway = id => id === 'sofa' ? { x: 260, y: 250, w: 80, h: 80 } : null;
assert.strictEqual(runCover(player, furnitureAway, inRect, attack), false, 'furniture outside the line of attack should not block wideWave');

assert.strictEqual(runCover(player, furnitureBetween, inRect, { ...attack, name: 'גל נמוך' }), false, 'cover rule should apply only to wideWave');

assert.match(
  html,
  /a\.type==='wave'.*waveHits\(a\)&&!attackDefended\(a\)&&!wideWaveBlockedByFurniture\(a\).*damageLibi\(1,a\.name\|\|'התקפה של אבא'\)/s,
  'wideWave collision should respect furniture cover before removing one life'
);

console.log('PASS: Dad ability 3 wideWave — broad hit lane and furniture cover');
