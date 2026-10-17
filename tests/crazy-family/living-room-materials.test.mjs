import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRoundedBoxGeometry } from '../../crazy-family/stylized-geometry.js';
import { createLivingRoomMaterialSystem } from '../../crazy-family/living-room-materials.js';

test('rounded box helper returns bounded softened buffer geometry', () => {
  const geometry = createRoundedBoxGeometry(THREE, { width: 2, height: 1, depth: 0.6, radius: 0.12, bevel: 0.02, curveSegments: 4 });
  assert.ok(geometry.isBufferGeometry);
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  assert.ok(size.x <= 2.001 && size.y <= 1.001 && size.z <= 0.601);
  assert.ok(size.x > 1.9 && size.y > 0.9 && size.z > 0.5);
  assert.ok(geometry.attributes.position.count > 8);
  geometry.dispose();
});

test('living room material system exposes shared stylized material families', () => {
  const materials = createLivingRoomMaterialSystem({ THREE, anisotropy: Number.NaN });
  const names = ['floorWood','furnitureWood','sofaFabric','cushionWarm','cushionCool','wall','rug','toyPlastic','metal','lampShade','lampGlow'];
  for (const name of names) {
    const material = materials.get(name);
    assert.ok(material?.isMeshStandardMaterial, name);
    assert.equal(materials.get(name), material, `${name} should be shared`);
  }
  assert.ok(materials.get('sofaFabric').roughness > 0.75);
  assert.ok(materials.get('rug').roughness > 0.8);
  assert.ok(materials.get('metal').metalness > 0.2);
  assert.ok(materials.get('lampGlow').emissiveIntensity > 0);
  assert.doesNotThrow(() => materials.dispose());
  assert.doesNotThrow(() => materials.dispose());
});

test('material system tolerates omitted anisotropy in Node without DOM canvas', () => {
  const materials = createLivingRoomMaterialSystem({ THREE });
  assert.ok(materials.textures.floorWood?.isTexture);
  assert.ok(materials.textures.rug?.isTexture);
  materials.dispose();
});
