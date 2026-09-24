import React from 'react';
import {Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, frame, rectAt} from './timing.mjs';

export const useTime = () => useCurrentFrame() / useVideoConfig().fps;
export const Item = ({children, style={}}) => <div style={{position:'absolute', ...style}}>{children}</div>;
export const Text = ({children,x=0,y=0,size=42,color,style={}}) => <Item style={{left:x,top:y,fontSize:size,fontWeight:650,lineHeight:1.4,color,whiteSpace:'pre',...style}}>{children}</Item>;
export const Icon = ({name,size=64}) => <Img src={staticFile(`icons/${name}.svg`)} style={{width:size,height:size}}/>;
export function Reveal({at,duration=.8,children,style={}}) {
  const p = ease(useTime(), at, duration);
  return <Item style={{inset:0,opacity:p,transform:`translateY(${18*(1-p)}px)`,...style}}>{children}</Item>;
}
// The panel remains mounted; only its geometry changes between semantic states.
export function PersistentPanel({keyframes,children,theme,style={}}) {
  const [left,top,width,height] = rectAt(useTime(),keyframes);
  return <Item style={{left,top,width,height,borderRadius:22,background:theme.paper,overflow:'hidden',...style}}>{children}</Item>;
}
export function Avatar({segments}) {
  const {fps}=useVideoConfig();
  return segments.map((s,i)=><Sequence key={i} from={frame(s.from,fps)} durationInFrames={frame(s.to,fps)-frame(s.from,fps)} layout="none">
    <OffthreadVideo src={staticFile(s.file)} startFrom={frame(s.sourceFrom,fps)} playbackRate={s.rate??1} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>
  </Sequence>);
}
export function Captions({cues,color}) {
  const t=useTime(),cue=cues.find(c=>t>=c.start&&t<c.end);
  if(!cue)return null;
  return <Text x={80} y={1670} size={47} color={color} style={{width:920,textAlign:'center',fontWeight:650,whiteSpace:'pre-line'}}>{cue.text}</Text>;
}
export function Soundtrack({narration,sfx=[]}) {
  const {fps}=useVideoConfig();
  return <>{narration&&<Audio src={staticFile(narration)}/>}{sfx.map((s,i)=><Sequence key={i} from={frame(s.at,fps)} layout="none"><Audio src={staticFile(s.file)} volume={s.volume??.16}/></Sequence>)}</>;
}
