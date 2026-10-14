const fs = require('fs');
const assert = require('assert');

const game = fs.readFileSync('crazy-family/game.js','utf8');

assert.match(game,/let\s+pendingDadSongStart\s*=\s*false/,'cinematic runtime should track a blocked/pending Dad song start');
assert.match(game,/function\s+retryPendingDadSongOnGesture\s*\(/,'cinematic runtime should expose a gesture retry helper');
assert.match(game,/retryPendingDadSongOnGesture[\s\S]*dadSongIsPlaying[\s\S]*startDadSong/,'gesture retry should avoid restarting an already-playing song and start the real retained song when pending');
assert.match(game,/const\s+onKeyDown\s*=\s*\(event\)\s*=>\s*\{[\s\S]*retryPendingDadSongOnGesture\(\)/,'keyboard input should retry pending Dad audio inside the user gesture');
assert.match(game,/const\s+down=\(event\)=>\{[\s\S]*retryPendingDadSongOnGesture\(\)/,'pointer controls should retry pending Dad audio inside the user gesture');
assert.match(game,/startDadSong\?\.\(\)[\s\S]*pendingDadSongStart\s*=\s*!Boolean\(legacyAdapter\?\.dadSongIsPlaying\?\.\(\)\)/,'automatic encounter start should remember when playback did not actually begin');

console.log('PASS: cinematic Dad songs retry blocked playback on the next real user gesture');
