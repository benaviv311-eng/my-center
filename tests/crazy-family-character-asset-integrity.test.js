const fs = require('fs');
const { execFileSync } = require('child_process');

const canon = fs.readFileSync('crazy-family/character-canon.js', 'utf8');
const expected = [
  {
    name: 'Libi',
    path: 'assets/libi-sprites-v025.png',
    blob: '90abb1012be33d39ce13094833a03ce16a91428c',
  },
  {
    name: 'Dad',
    path: 'assets/crazy-family/dad-sprites-v028.png',
    blob: '043b251d90ddde2ba24b917f2d9a3d75d97015d1',
  },
];

const missingCanonSignatures = expected.filter(({ blob }) => !canon.includes(`gitBlobSha: '${blob}'`));
if (missingCanonSignatures.length) {
  console.error('FAIL: canonical asset signatures are missing for', missingCanonSignatures.map(({ name }) => name).join(', '));
  process.exit(1);
}

const changed = expected.filter(({ path, blob }) => {
  if (!fs.existsSync(path)) return true;
  const actual = execFileSync('git', ['hash-object', path], { encoding: 'utf8' }).trim();
  return actual !== blob;
});

if (changed.length) {
  console.error('FAIL: canonical character asset bytes changed for', changed.map(({ name }) => name).join(', '));
  process.exit(1);
}

console.log('PASS: Libi and Dad canonical asset bytes match their locked Git blob signatures');
