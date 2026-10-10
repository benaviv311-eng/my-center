const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('crazy-family.html', 'utf8');

assert.match(html, /DAD_ABILITIES_V039/, 'v0.39 Dad ability-system marker should exist');
assert.match(
  html,
  /const DAD_SONG_ABILITY_MAP=\['lowWave','echo','wideWave','highWave','beam','homingNote','ring','chorusBoom','midWave','bouncingNote'\]/,
  'songs 1-10 should map one-to-one to the approved Dad abilities'
);
assert.match(html, /const DAD_SONG_ATTACK_PHASES=\[\.12,\.5,\.86\]/, 'each mapped song should fire three timed attacks');
assert.match(html, /function updateDadSongAbilitySchedule\(/, 'song attacks should be driven by the current song schedule');
assert.match(html, /noteBarrage:\{id:'noteBarrage'/, 'ability 11 should exist');
assert.match(html, /randomNoteVolley:\{id:'randomNoteVolley'/, 'ability 12 should exist');
assert.match(html, /function fireDadLaneBarrage\(/, 'Dad talking should have a three-lane note barrage implementation');
assert.match(html, /function fireDadRandomAngleVolley\(/, 'Dad sigh\/yawn should have a random-angle note volley implementation');
assert.match(html, /triggerDadAmbientAttack\('talk'\)/, 'Dad speech should trigger ability 11');
assert.match(html, /triggerDadAmbientAttack\('breath'\)/, 'Dad pant\/yawn should trigger ability 12');
assert.match(html, /notePose==='lying'.*player\.z>24/s, 'lying notes should be jumpable');
assert.match(html, /notePose==='floating'.*player\.crouching/s, 'floating notes should be crouchable');
assert.match(html, /notePose==='standing'/, 'standing notes should have a distinct pose that requires lane movement');
assert.match(html, /function playerSafeFromGroundRing\(/, 'sound ring should support off-ground avoidance');
assert.match(html, /function wideWaveBlockedByFurniture\(/, 'wide wave should support furniture cover');
assert.match(html, /a\.homing&&now<player\.rollUntil/, 'homing note should be dodgeable by a last-second roll');
assert.match(html, /function spawnReturningEchoAttack\(/, 'echo should implement outgoing and returning opposite-height waves');

console.log('crazy-family Dad abilities v0.39 checks passed');
