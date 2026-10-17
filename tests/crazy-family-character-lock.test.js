const fs = require('fs');

const charactersPath = 'crazy-family/characters.js';
const canonPath = 'crazy-family/character-canon.js';
const gamePath = 'crazy-family/game.js';
const characters = fs.readFileSync(charactersPath, 'utf8');
const game = fs.readFileSync(gamePath, 'utf8');
const canonExists = fs.existsSync(canonPath);
const canon = canonExists ? fs.readFileSync(canonPath, 'utf8') : '';

const checks = [
  ['canonical source exists', canonExists],
  ['Libi canonical asset is locked', canon.includes("asset: 'assets/libi-sprites-v025.png'")],
  ['Dad canonical asset is locked', canon.includes("asset: 'assets/crazy-family/dad-sprites-v028.png'")],
  ['Libi canonical dimensions are locked', canon.includes('width: 0.9') && canon.includes('height: 1.34')],
  ['Dad canonical dimensions are locked', canon.includes('width: 1.18') && canon.includes('height: 1.9')],
  ['characters renderer imports canonical definitions', characters.includes("from './character-canon.js'")],
  ['renderer resolves asset only from canon', characters.includes('getCanonicalCharacter(kind)')],
  ['renderer rejects non-canonical override', characters.includes('requestedAsset !== canonical.asset') && characters.includes('Character canon is locked')],
  ['legacy override keys are guarded', characters.includes('options.approvedAssetUrl') && characters.includes('options.assetUrl') && characters.includes('options.asset')),
  ['game uses canonical exports rather than literal replacement paths', game.includes('APPROVED_LIBI_ASSET') && game.includes('APPROVED_DAD_ASSET') && !game.includes("approvedAssetUrl:'assets/")],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('FAIL:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}

console.log('PASS: Crazy Family canonical characters are locked against accidental replacement');
