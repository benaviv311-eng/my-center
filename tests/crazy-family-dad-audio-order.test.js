const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('crazy-family.html','utf8');

const songAudioRefs=[...html.matchAll(/dad-song-(\d{2})\.mp3/g)].map(m=>Number(m[1]));
const uniqueSongs=[...new Set(songAudioRefs)].sort((a,b)=>a-b);
assert.deepStrictEqual(uniqueSongs,[1,2,3,4,5,6,7,8,9,10],`Dad song audio must be 01-10 only; found ${uniqueSongs.join(',')}`);

const tiers=html.match(/const DAD_SONG_TIERS=([^;]+);/);
assert(tiers,'DAD_SONG_TIERS missing');
for(const n of [10,11,12,13,14,15,16,17,18,19,20,21,22,23]){
  assert(!new RegExp(`(?:songs:\\[[^\\]]*)\\b${n}\\b`).test(tiers[0]),`obsolete song index ${n} still selectable`);
}
for(const n of [0,1,2,3,4,5,6,7,8,9]){
  assert(new RegExp(`\\b${n}\\b`).test(tiers[0]),`song index ${n} must remain selectable`);
}

assert(/const dadPreClips=\[/.test(html),'Dad speech clips must remain');
assert(/const libiVoiceClips=\[/.test(html),'Libi speech clips must remain');
assert(/dad-pre-01\.mp3/.test(html),'Dad speech audio references must remain');
assert(/libi-/.test(html),'Libi audio references must remain');
console.log('Crazy Family Dad audio order: PASS');
