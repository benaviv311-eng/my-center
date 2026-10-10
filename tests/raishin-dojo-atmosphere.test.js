const assert=require('assert'),path=require('path');
const effects=require(path.join(__dirname,'..','raishin-legacy','dojo-effects.js'));
for(const name of ['createAtmosphereState','updateAtmosphere','lightPulse']) assert.strictEqual(typeof effects[name],'function',`${name} must exist`);
let normal=effects.createAtmosphereState(false);for(let i=0;i<20;i++)normal=effects.updateAtmosphere(normal,.05,{random:()=>.5,width:1600,height:900});assert.ok(normal.dust.length<=effects.ATMOSPHERE_LIMITS.dust);assert.ok(normal.petals.length<=effects.ATMOSPHERE_LIMITS.petals);
let reduced=effects.createAtmosphereState(true);for(let i=0;i<20;i++)reduced=effects.updateAtmosphere(reduced,.05,{random:()=>.5,width:1600,height:900});assert.strictEqual(reduced.petals.length,0,'reduced motion disables petals');assert.ok(reduced.dust.length<=effects.ATMOSPHERE_LIMITS.reducedDust);assert.ok(reduced.dust.length<normal.dust.length,'reduced motion materially lowers dust');
const dirty={reducedMotion:false,dust:[{x:-999,y:-999,vx:0,vy:0,life:3,size:2,alpha:.1}],petals:[{x:9999,y:9999,vx:0,vy:0,life:3,size:4,rotation:0,spin:0}]};const cleaned=effects.updateAtmosphere(dirty,.01,{random:()=>.5,width:1600,height:900,spawn:false});assert.strictEqual(cleaned.dust.length,0);assert.strictEqual(cleaned.petals.length,0);
for(const t of [0,500,1000,5000,10000]){const pulse=effects.lightPulse(t);assert.ok(pulse>=.04&&pulse<=.12,`light pulse restrained at ${t}`);}
console.log('PASS: premium dojo atmosphere');
