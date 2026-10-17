const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const rigPath=path.join(root,'raishin-legacy','src','systems','CameraRig.js');
assert.ok(fs.existsSync(rigPath),'CameraRig module must exist');
const CameraRig=require(rigPath);
assert.equal(typeof CameraRig.create,'function');

const bounds={x:0,y:0,width:3600,height:1800};
const rig=CameraRig.create({
  viewportWidth:1600,viewportHeight:900,worldBounds:bounds,zoom:1,
  deadZoneX:96,deadZoneY:54,smoothing:8,lookAheadX:120,lookAheadY:70
});
const spawn={x:1800,y:1200};
let state=rig.reset(spawn);
assert.deepStrictEqual(Object.keys(state).sort(),['scrollX','scrollY','targetX','targetY','zoom'].sort());
assert.equal(state.zoom,1);
assert.ok(state.scrollX>0&&state.scrollY>0,'reset in world center must produce real world scroll');
const resetX=state.scrollX,resetY=state.scrollY;

state=rig.update({groundProjection:spawn,velocity:{x:0,y:0},dt:.016});
assert.ok(Math.abs(state.scrollX-resetX)<1e-9&&Math.abs(state.scrollY-resetY)<1e-9,'idle target must be perfectly stable');
state=rig.update({groundProjection:{x:spawn.x+50,y:spawn.y+25},velocity:{x:0,y:0},dt:.016});
assert.ok(Math.abs(state.scrollX-resetX)<1e-9&&Math.abs(state.scrollY-resetY)<1e-9,'5-8% viewport dead zone must absorb small movement');

for(let i=0;i<180;i++)state=rig.update({groundProjection:{x:3000,y:1450},velocity:{x:220,y:80},dt:.016});
assert.ok(state.scrollX-resetX>500,'sustained movement must scroll hundreds of pixels, not a tiny camera offset');
assert.ok(state.scrollY-resetY>100,'sustained depth movement must create meaningful vertical scroll');
assert.ok(state.targetX>=3000&&state.targetX<=3120,'horizontal velocity look-ahead must be bounded');
assert.ok(state.targetY>=1450&&state.targetY<=1520,'vertical velocity look-ahead must be bounded');

for(let i=0;i<180;i++)state=rig.update({groundProjection:{x:99999,y:99999},velocity:{x:99999,y:99999},dt:.05});
assert.ok(state.scrollX<=2000+1e-6,'right edge clamp must account for viewport width');
assert.ok(state.scrollY<=900+1e-6,'bottom edge clamp must account for viewport height');
for(let i=0;i<180;i++)state=rig.update({groundProjection:{x:-99999,y:-99999},velocity:{x:-99999,y:-99999},dt:.05});
assert.ok(state.scrollX>=-1e-6&&state.scrollY>=-1e-6,'top/left clamp must never reveal empty world');

const before=rig.snapshot();
state=rig.update({groundProjection:{x:3000,y:1400},velocity:{x:0,y:0},dt:99});
assert.ok(state.scrollX>=0&&state.scrollX<=2000&&state.scrollY>=0&&state.scrollY<=900,'large dt must stay inside camera bounds');
assert.ok(Math.abs(state.scrollX-before.scrollX)<2000,'large dt is clamped and cannot teleport outside the world');

const zoomed=CameraRig.create({viewportWidth:1600,viewportHeight:900,worldBounds:bounds,zoom:1.25,deadZoneX:96,deadZoneY:54});
const z=zoomed.reset({x:3590,y:1790});
assert.ok(z.scrollX<=3600-1600/1.25+1e-6);
assert.ok(z.scrollY<=1800-900/1.25+1e-6);

const source=fs.readFileSync(rigPath,'utf8');
assert.doesNotMatch(source,/Phaser|sprite|canvas|getImageData/i,'CameraRig must remain pure camera math');
console.log('PASS: Raishin v2 real scrolling camera rig');
