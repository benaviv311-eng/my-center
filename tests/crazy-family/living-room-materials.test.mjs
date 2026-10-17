import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoundedBoxGeometry } from '../../crazy-family/stylized-geometry.js';
import { createLivingRoomMaterialSystem } from '../../crazy-family/living-room-materials.js';

class FakePositionAttribute {
  constructor(points) { this.points = points; this.count = points.length; this.needsUpdate = false; }
  getX(i) { return this.points[i][0]; }
  getY(i) { return this.points[i][1]; }
  getZ(i) { return this.points[i][2]; }
  setXYZ(i, x, y, z) { this.points[i] = [x, y, z]; }
}
class FakeBoxGeometry {
  constructor(width, height, depth) {
    const xs=[-width/2,0,width/2], ys=[-height/2,0,height/2], zs=[-depth/2,0,depth/2];
    const points=[]; for(const x of xs) for(const y of ys) for(const z of zs) points.push([x,y,z]);
    this.isBufferGeometry=true; this.attributes={position:new FakePositionAttribute(points)}; this.disposed=false;
  }
  computeVertexNormals(){ this.normalsComputed=true; }
  computeBoundingBox(){
    const p=this.attributes.position.points;
    const xs=p.map(v=>v[0]),ys=p.map(v=>v[1]),zs=p.map(v=>v[2]);
    this.boundingBox={min:{x:Math.min(...xs),y:Math.min(...ys),z:Math.min(...zs)},max:{x:Math.max(...xs),y:Math.max(...ys),z:Math.max(...zs)}};
  }
  dispose(){ this.disposed=true; }
}
class FakeTexture {
  constructor(){ this.isTexture=true; this.repeat={set:(x,y)=>{this.repeatValue=[x,y];}}; this.disposed=false; }
  dispose(){ this.disposed=true; }
}
class FakeDataTexture extends FakeTexture { constructor(data,width,height){ super(); this.image={data,width,height}; } }
class FakeMaterial {
  constructor(options={}){ Object.assign(this,options); this.isMeshStandardMaterial=true; this.disposed=false; }
  dispose(){ this.disposed=true; }
}
const THREE={
  BoxGeometry:FakeBoxGeometry,
  DataTexture:FakeDataTexture,
  MeshStandardMaterial:FakeMaterial,
  RepeatWrapping:'repeat',
  SRGBColorSpace:'srgb',
  RGBAFormat:'rgba',
  UnsignedByteType:'ubyte',
};

function geometrySize(geometry){
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox;
  return {x:max.x-min.x,y:max.y-min.y,z:max.z-min.z};
}

test('rounded box helper returns bounded softened buffer geometry', () => {
  const geometry = createRoundedBoxGeometry(THREE, { width: 2, height: 1, depth: 0.6, radius: 0.12, bevel: 0.02, curveSegments: 4 });
  assert.ok(geometry.isBufferGeometry);
  const size=geometrySize(geometry);
  assert.ok(size.x <= 2.001 && size.y <= 1.001 && size.z <= 0.601);
  assert.ok(size.x > 1.9 && size.y > 0.9 && size.z > 0.5);
  assert.ok(geometry.attributes.position.count > 8);
  assert.equal(geometry.normalsComputed,true);
  geometry.dispose();
});

test('living room material system exposes shared stylized material families', () => {
  const materials = createLivingRoomMaterialSystem({ THREE, anisotropy: Number.NaN });
  const names = ['floorWood','furnitureWood','sofaFabric','cushionWarm','cushionCool','wall','rug','toyPlastic','metal','lampShade','lampGlow','windowGlass','curtainFabric','plantLeaf','ceramic','tvScreen'];
  for (const name of names) {
    const material = materials.get(name);
    assert.ok(material?.isMeshStandardMaterial, name);
    assert.equal(materials.get(name), material, `${name} should be shared`);
  }
  assert.ok(materials.get('sofaFabric').roughness > 0.75);
  assert.ok(materials.get('rug').roughness > 0.8);
  assert.ok(materials.get('metal').metalness > 0.2);
  assert.ok(materials.get('lampGlow').emissiveIntensity > 0);
  assert.ok(materials.get('tvScreen').emissiveIntensity > 0);
  assert.ok(materials.get('windowGlass').roughness < materials.get('wall').roughness);
  assert.deepEqual(materials.textures.floorWood.repeatValue,[4,3]);
  assert.doesNotThrow(() => materials.dispose());
  assert.doesNotThrow(() => materials.dispose());
});

test('material system tolerates omitted anisotropy in Node without DOM canvas', () => {
  const materials = createLivingRoomMaterialSystem({ THREE });
  assert.ok(materials.textures.floorWood?.isTexture);
  assert.ok(materials.textures.rug?.isTexture);
  materials.dispose();
});
