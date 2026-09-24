import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateCaptions} from './caption-model.mjs';
const cue={start:2,end:5,text:'先锁声音，再排画面',emphasis:{lead:'先锁声音，',focus:'再排画面',key:'画面',at:3,ratio:1.28,timingSource:'reviewed-word-alignment'}};
test('aligned emphasis keeps original words and the plain-caption fallback',()=>{
 assert.equal(validateCaptions([cue,{start:5,end:7,text:'普通一句'}],7),true);
});
test('future or too-late word anchors cannot silently render',()=>{
 for(const at of [1.9,4.9,6,NaN])assert.throws(()=>validateCaptions([{...cue,emphasis:{...cue.emphasis,at}}],7));
});
test('emphasis cannot rewrite speech or invent a keyword',()=>{
 for(const edit of [{key:'另一个词'},{focus:'改写过的画面'}])assert.throws(()=>validateCaptions([{...cue,emphasis:{...cue.emphasis,...edit}}],7));
});
test('graphic-only captions need an actual matching graphic phrase',()=>{
 assert.throws(()=>validateCaptions([{start:0,end:2,text:'原话',display:'graphic'}],2));
 assert.equal(validateCaptions([{start:0,end:2,text:'原话',display:'graphic',graphicText:'这段原话'}],2),true);
});

