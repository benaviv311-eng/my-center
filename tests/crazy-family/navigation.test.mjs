import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNavigationGrid, findPath } from '../../crazy-family/navigation.js';

const bounds={minX:-5,maxX:5,minZ:-4,maxZ:4};

test('A* routes around a blocking sofa instead of crossing it',()=>{
  const sofa={id:'sofa',x:0,z:0,width:3,depth:1.2};
  const grid=buildNavigationGrid({bounds,blockers:[sofa],cellSize:.4,clearance:.45});
  const path=findPath(grid,{x:-4,z:0},{x:4,z:0});
  assert.ok(path.length>2);
  for(const p of path) assert.equal(grid.isBlockedWorld(p.x,p.z),false);
  assert.ok(path.some(p=>Math.abs(p.z)>1));
});

test('navigation nodes never occupy inflated furniture blockers',()=>{
  const table={id:'coffee-table',x:0,z:0,width:2,depth:1};
  const grid=buildNavigationGrid({bounds,blockers:[table],cellSize:.5,clearance:.5});
  assert.equal(grid.isBlockedWorld(0,0),true);
  assert.equal(grid.isBlockedWorld(1.4,0),true);
  assert.equal(grid.isBlockedWorld(2,0),false);
});

test('Dad clearance rejects a gap that Libi-sized clearance can use',()=>{
  const blockers=[
    {id:'a',x:0,z:-1,width:4,depth:1},
    {id:'b',x:0,z:1,width:4,depth:1},
  ];
  const libi=buildNavigationGrid({bounds,blockers,cellSize:.2,clearance:.2});
  const dad=buildNavigationGrid({bounds,blockers,cellSize:.2,clearance:.55});
  assert.equal(libi.isBlockedWorld(0,0),false);
  assert.equal(dad.isBlockedWorld(0,0),true);
});
