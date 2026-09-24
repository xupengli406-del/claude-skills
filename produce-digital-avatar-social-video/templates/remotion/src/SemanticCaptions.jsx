import React from 'react';

// Absolute time makes seeking, chunked export, and normal playback identical.
export const captionProgress = (time, at, duration=.18) => {
  const p=Math.max(0,Math.min(1,(time-at)/duration));
  return p*p*(3-2*p);
};
export function SemanticCaptions({time,cues,baseSize=53,color='#292B27',accent='#985B43',onVideo=false,top=1628,width=950}) {
  const cue=cues.find(c=>time>=c.start&&time<c.end);
  if(!cue||cue.display==='graphic')return null;
  const e=cue.emphasis;
  const focus=e?captionProgress(time,e.at):1;
  const shadow=onVideo?'0 2px 6px #000C,0 1px 2px #000A':'none';
  const ink=onVideo?'#FFFDF7':color, keyColor=onVideo?'#FFE28B':accent;
  const outer={position:'absolute',left:(1080-width)/2,top,width,height:205,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:11,textAlign:'center',lineHeight:1.3,color:ink,textShadow:shadow,fontWeight:650};
  if(!e)return <div data-caption style={{...outer,fontSize:baseSize,whiteSpace:'pre-line'}}>{cue.text}</div>;
  const ix=e.focus.indexOf(e.key), before=e.focus.slice(0,ix), after=e.focus.slice(ix+e.key.length);
  return <div data-caption style={outer}>
    {e.lead&&<div style={{fontSize:baseSize*.84,whiteSpace:'pre-line',fontWeight:550}}>{e.lead}</div>}
    <div data-focus style={{fontSize:baseSize*(e.ratio??1.28),whiteSpace:'pre-line',fontWeight:750,opacity:focus,transform:`translateY(${6*(1-focus)}px)`}}>
      {before}<span style={{color:keyColor}}>{e.key}</span>{after}
    </div>
  </div>;
}

