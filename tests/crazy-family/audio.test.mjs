import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpatialAudioAdapter, safePlay } from '../../crazy-family/audio.js';

test('Dad volume attenuates smoothly with distance',()=>{
  const audio=createSpatialAudioAdapter({retainedAudio:{}});
  const near=audio.update({listener:{x:0,y:0,z:0},dad:{x:1,y:0,z:0},roomRelation:'same'});
  const far=audio.update({listener:{x:0,y:0,z:0},dad:{x:8,y:0,z:0},roomRelation:'same'});
  assert.ok(near.gain>far.gain);
  assert.ok(near.gain<=1&&far.gain>=0);
});

test('adjacent room sound is muffled as well as attenuated',()=>{
  const audio=createSpatialAudioAdapter({retainedAudio:{}});
  const same=audio.update({listener:{x:0,y:0,z:0},dad:{x:3,y:0,z:0},roomRelation:'same'});
  const adjacent=audio.update({listener:{x:0,y:0,z:0},dad:{x:3,y:0,z:0},roomRelation:'adjacent'});
  assert.ok(adjacent.gain<same.gain);
  assert.ok(adjacent.lowpassHz<same.lowpassHz);
});

test('safePlay turns rejected browser playback into a nonfatal false result',async()=>{
  const clip={play(){return Promise.reject(new Error('autoplay blocked'));}};
  assert.equal(await safePlay(clip),false);
});
