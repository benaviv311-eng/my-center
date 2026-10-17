import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as rig from '../../crazy-family/character-rig.js';

test('segmented rig exports alpha silhouette row extraction', () => {
  assert.equal(typeof rig.extractRowSilhouetteBounds, 'function');
});

if (typeof rig.extractRowSilhouetteBounds === 'function') {
  test('alpha silhouette bounds follow opaque pixels instead of crop rectangles', () => {
    const width=6,height=4,data=new Uint8ClampedArray(width*height*4);
    const opaque=(x,y)=>{data[(y*width+x)*4+3]=255;};
    opaque(1,1); opaque(2,1); opaque(3,1);
    opaque(2,2); opaque(3,2); opaque(4,2);
    const rows=rig.extractRowSilhouetteBounds({data},width,height,32);
    assert.deepEqual(rows,[
      {y:1,left:1,right:3},
      {y:2,left:2,right:4},
    ]);
  });
}

test('visible rig parts use alpha-contour side geometry rather than rectangular BoxGeometry slabs', async () => {
  const source=await readFile(new URL('../../crazy-family/character-rig.js', import.meta.url),'utf8');
  assert.match(source,/buildSilhouetteSideGeometry/);
  assert.doesNotMatch(source,/new THREERef\.BoxGeometry\(/);
});
