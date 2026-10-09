const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('crazy-family.html', 'utf8');

assert.match(html, /חקירה חופשית · v0\.24/, 'crazy-family version should be v0.24');
assert.match(html, /LIBI_VISUAL_V24/, 'new Libi visual renderer marker should exist');
assert.match(html, /function libiPose\(/, 'Libi pose resolver should exist');
assert.match(html, /'idle'|'walk'|'run'/, 'renderer should expose locomotion states');
assert.match(html, /jumping\?'jump'/, 'jump state should be rendered');
assert.match(html, /rolling\?'roll'/, 'roll state should be rendered');
assert.match(html, /player\.crouching\?'crouch'/, 'crouch state should be rendered');
assert.match(html, /player\.hanging\?'hang'/, 'hang state should be rendered');
assert.match(html, /vaulting\?'vault'/, 'vault state should be rendered');
assert.match(html, /#22bfc5/, 'turquoise overall palette should be present');
assert.match(html, /#ff6f7f/, 'coral shirt palette should be present');
assert.match(html, /#ff5c91/, 'pink shoe\/accent palette should be present');

console.log('crazy-family Libi v0.24 visual checks passed');
