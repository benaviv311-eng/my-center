import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInteraction, executeInteraction } from '../../crazy-family/interaction.js';

const player={position:{x:0,y:0,z:0}};

test('only enabled objects within maxDistance can become candidates',()=>{
  const candidate=resolveInteraction({player,interactables:[
    {id:'near',action:'talk',label:'near',x:.5,y:0,z:0,priority:1,enabled:true},
    {id:'far',action:'talk',label:'far',x:3,y:0,z:0,priority:99,enabled:true},
    {id:'disabled',action:'talk',label:'off',x:.1,y:0,z:0,priority:100,enabled:false},
  ],maxDistance:1});
  assert.equal(candidate.id,'near');
});

test('priority wins first and distance breaks equal-priority ties',()=>{
  const candidate=resolveInteraction({player,interactables:[
    {id:'close-low',action:'talk',label:'a',x:.2,y:0,z:0,priority:2,enabled:true},
    {id:'far-high',action:'talk',label:'b',x:.8,y:0,z:0,priority:5,enabled:true},
    {id:'closer-high',action:'talk',label:'c',x:.4,y:0,z:0,priority:5,enabled:true},
  ],maxDistance:1});
  assert.equal(candidate.id,'closer-high');
});

test('headphones take calls retained inventory exactly once and disables world object',()=>{
  let collected=0,disabled=0,hidden=0;
  const candidate={id:'headphones',action:'take',label:'לקחת אוזניות',distance:.3,priority:20};
  const context={
    legacyAdapter:{collectItem(id){assert.equal(id,'headphones');collected++;return true;}},
    world:{setInteractableEnabled(id,value){assert.equal(id,'headphones');assert.equal(value,false);disabled++;}},
    scene:{setObjectVisible(id,value){assert.equal(id,'headphones');assert.equal(value,false);hidden++;}},
  };
  assert.equal(executeInteraction(candidate,context).ok,true);
  assert.equal(collected,1);assert.equal(disabled,1);assert.equal(hidden,1);
});

test('distant headphones are not a candidate',()=>{
  const candidate=resolveInteraction({player,interactables:[{id:'headphones',action:'take',label:'לקחת',x:2,y:0,z:0,priority:20,enabled:true}],maxDistance:.9});
  assert.equal(candidate,null);
});

test('required contextual action types execute without inventing extra buttons',()=>{
  for(const action of ['climb','push','open','talk']){
    const events=[];
    const result=executeInteraction({id:'x',action,label:'x',distance:.2,priority:1},{onAction:(name,id)=>events.push([name,id])});
    assert.equal(result.ok,true);
    assert.deepEqual(events,[[action,'x']]);
  }
});
