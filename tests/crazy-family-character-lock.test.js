const fs = require('fs');

const charactersPath = 'crazy-family/characters.js';
const canonPath = 'crazy-family/character-canon.js';
const canon3dPath = 'crazy-family/character-3d-canon.js';
const characters3dPath = 'crazy-family/characters-3d.js';
const gamePath = 'crazy-family/game.js';
const characters = fs.readFileSync(charactersPath, 'utf8');
const game = fs.readFileSync(gamePath, 'utf8');
const canonExists = fs.existsSync(canonPath);
const canon = canonExists ? fs.readFileSync(canonPath, 'utf8') : '';
const canon3dExists = fs.existsSync(canon3dPath);
const characters3dExists = fs.existsSync(characters3dPath);
const canon3d = canon3dExists ? fs.readFileSync(canon3dPath, 'utf8') : '';
const characters3d = characters3dExists ? fs.readFileSync(characters3dPath, 'utf8') : '';

const checks = [
  ['canonical source exists', canonExists],
  ['Libi canonical asset is locked', canon.includes("asset: 'assets/libi-sprites-v025.png'")],
  ['Dad canonical asset is locked', canon.includes("asset: 'assets/crazy-family/dad-sprites-v028.png'")],
  ['Libi canonical dimensions are locked', canon.includes('width: 0.9') && canon.includes('height: 1.34')],
  ['Dad canonical dimensions are locked', canon.includes('width: 1.18') && canon.includes('height: 1.9')],
  ['characters renderer imports canonical definitions', characters.includes("from './character-canon.js'")],
  ['renderer resolves asset only from canon', characters.includes('getCanonicalCharacter(kind)')],
  ['renderer rejects non-canonical override', characters.includes('requestedAsset !== canonical.asset') && characters.includes('Character canon is locked')],
  ['legacy override keys are guarded', characters.includes('options.approvedAssetUrl') && characters.includes('options.assetUrl') && characters.includes('options.asset')],
  ['3d canonical source exists', canon3dExists],
  ['3d renderer exists', characters3dExists],
  ['Libi 3d height is locked', canon3d.includes('height: 1.18')],
  ['Dad 3d height is locked', canon3d.includes('height: 1.78')],
  ['Libi 3d identity colors are locked', canon3d.includes('hair: 0x5a3828') && canon3d.includes('flower: 0xff78ad') && canon3d.includes('overalls: 0x2d9ba7')],
  ['Dad 3d identity colors are locked', canon3d.includes('hair: 0x3a251d') && canon3d.includes('overshirt: 0x2f7f7c') && canon3d.includes('slippers: 0x7b5037')],
  ['3d renderer imports 3d canon', characters3d.includes("from './character-3d-canon.js'") && characters3d.includes('getCharacter3DCanon(kind)')],
  ['3d renderer remains volumetric', !characters3d.includes('PlaneGeometry') && !characters3d.includes('faceCamera') && characters3d.includes("renderMode = 'volumetric-3d'")],
  ['game uses canonical exports rather than literal replacement paths', game.includes('APPROVED_LIBI_ASSET') && game.includes('APPROVED_DAD_ASSET') && !game.includes("approvedAssetUrl:'assets/")],
  ['game uses native 3d character factory', game.includes("from './characters-3d.js'") && game.includes('createCharacter3D')],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('FAIL:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}

console.log('PASS: Crazy Family canonical 2d and 3d characters are locked against accidental replacement');
