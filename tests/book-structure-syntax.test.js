const assert = require('assert');
const {execFileSync} = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
for (const file of ['book-structure.js', 'book-structure-ui.js']) {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ['--check', path.join(root, file)], {stdio:'pipe'});
  }, `${file} should have valid JavaScript syntax`);
}

console.log('universal book structure syntax tests: OK');
