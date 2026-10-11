const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const game=fs.readFileSync(path.join(root,'raishin-legacy','game.js'),'utf8');

assert.match(game,/let\s+upSpriteReady\s*=\s*false/,'Walk UP must track optional readiness separately');
assert.match(game,/upSprite\.onerror\s*=\s*\(\)\s*=>\s*\{?\s*upSpriteReady\s*=\s*false/,'Walk UP failure must degrade gracefully');
assert.match(game,/state\.direction\s*===\s*['"]up['"]\s*&&\s*upSpriteReady/,'UP renderer must use the dedicated strip only when it is ready');
assert.doesNotMatch(game,/Promise\.all\(\[[^\]]*upSprite\.decode/s,'optional Walk UP decode must not gate the entire game boot');
assert.match(game,/raika-walk-up-v2\.png\?v=/,'Walk UP asset must be cache-busted after deployment');
console.log('PASS: Raishin optional Walk UP asset fallback contract');
