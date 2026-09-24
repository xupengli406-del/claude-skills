import fs from 'node:fs';
import {validateCaptions} from '../src/caption-model.mjs';
import path from 'node:path';
const p=JSON.parse(fs.readFileSync('src/project.json','utf8'));
const fail=msg=>{throw new Error(msg)};
if(!(p.fps>0&&p.duration>0))fail('fps and duration must be positive');
let end=0;
validateCaptions(p.captions,p.duration);
const checkFile=f=>{
  if(!f)return;
  const root=path.resolve('public'),resolved=path.resolve(root,f);
  if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved))fail('Missing or outside public/: '+f);
};
checkFile(p.narration);
end=0;
for(const s of p.avatarSegments){
  checkFile(s.file);
  if(!(s.from>=end&&s.to>s.from&&s.to<=p.duration&&s.sourceFrom>=0&&(s.rate??1)>0))fail('Invalid avatar segment');
  end=s.to;
}
for(const s of p.sfx){checkFile(s.file);if(!(s.at>=0&&s.at<p.duration))fail('Invalid SFX time')}
for(const r of p.rules.rows)if(!(r.at>=0&&r.at<p.layers.from))fail('Rule reveal must precede layer scene');
const events=[p.layers.from,p.layers.spreadAt,...p.layers.focusAt,p.layers.assembleAt,p.duration];
if(events.some((x,i)=>i&&x<events[i-1]))fail('Layer events must be ordered');
console.log(JSON.stringify({valid:true,duration:p.duration,captions:p.captions.length,mode:p.narration?'media-configured':'silent-motion-demo',note:'Does not prove lip sync, source duration or visual quality'}));
