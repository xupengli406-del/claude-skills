import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceTime,rectAt,ease,frame} from './timing.mjs';
test('a front-loaded highlight keeps the original avatar source time',()=>{
  const teaser={from:0,to:3,sourceFrom:25.3,rate:1};
  const body={from:160,to:163,sourceFrom:25.3,rate:1};
  assert.equal(sourceTime(1,teaser),26.3);
  assert.equal(sourceTime(161,body),26.3);
  assert.equal(sourceTime(3,teaser),null);
});
test('retiming applies within each source clip, never to global time',()=>{
  assert.equal(sourceTime(11,{from:10,to:12,sourceFrom:30,rate:1.2}),31.2);
  assert.equal(frame(1.5,30),45);
});
test('persistent panel holds its readable completion state',()=>{
  const k=[{at:0,rect:[0,0,100,100]},{at:2,rect:[0,0,100,100]},{at:3,rect:[40,20,50,50]}];
  assert.deepEqual(rectAt(1,k),[0,0,100,100]);
  assert.deepEqual(rectAt(10,k),[40,20,50,50]);
  assert.equal(ease(-1,0),0); assert.equal(ease(10,0),1);
});
