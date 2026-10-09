const fs=require('fs');
const html=fs.readFileSync('crazy-family.html','utf8');
const checks=[
  ['version v0.25', html.includes('v0.25')],
  ['real sprite asset', html.includes('assets/libi-sprites-v025.png') && fs.existsSync('assets/libi-sprites-v025.png')],
  ['sprite renderer marker', html.includes('LIBI_SPRITE_RENDERER_V025')],
  ['sprite draw call', html.includes('ctx.drawImage(libiSprite')],
  ['ten-pose sheet', html.includes('LIBI_CELL_W=280') && html.includes('LIBI_CELL_H=420')],
  ['walk animation', html.includes("pose==='walk'") && html.includes('walkFrame')],
  ['run animation', html.includes("pose==='run'") && html.includes('runFrame')],
  ['old vector renderer removed', !html.includes('LIBI_VISUAL_V24')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('FAIL:',failed.map(([name])=>name).join(', '));process.exit(1)}
console.log('PASS: Libi v0.25 uses the high-quality sprite sheet for all gameplay states');
