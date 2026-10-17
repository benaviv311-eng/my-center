const fs = require('fs');

const charactersPath = 'crazy-family/characters.js';
const canonPath = 'crazy-family/character-canon.js';
const characters = fs.readFileSync(charactersPath, 'utf8');
const canonExists = fs.existsSync(canonPath);
const canon = canonExists ? fs.readFileSync(canonPath, 'utf8') : '';

const checks = [
  ['canonical source exists', canonExists],
  ['Libi canonical asset is locked', canon.includes("asset: 'assets/libi-sprites-v025.png'")],
  ['Dad canonical asset is locked', canon.includes("asset: 'assets/crazy-family/dad-sprites-v028.png'")],
  ['Libi canonical dimensions are locked', canon.includes('width: 0.9') && canon.includes('height: 1.34')],
  ['Dad canonical dimensions are locked', canon.includes('width: 1.18') && canon.includes('height: 1.9')],
  ['characters renderer imports canonical definitions', characters.includes("from './character-canon.js'")],
  ['runtime asset override is disabled', !characters.includes('approvedAssetUrl')],
  ['renderer resolves asset only from canon', characters.includes('getCanonicalCharacter(kind)')],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('FAIL:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}

console.log('PASS: Crazy Family canonical characters are locked against accidental runtime replacement');
