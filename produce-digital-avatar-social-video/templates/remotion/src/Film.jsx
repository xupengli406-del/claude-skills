import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Item, Text, Icon, Reveal, PersistentPanel, Avatar, Captions, Soundtrack, useTime} from './Primitives';
import {ease,mix} from './timing.mjs';

function Rules({project}) {
  const t=useTime(),c=project.theme,r=project.rules,p=ease(t,r.contractAt,1.3);
  return <>
    <Text x={80} y={140} size={62} style={{opacity:1-ease(t,project.layers.from-1,.35)}}>{r.title}</Text>
    <Text x={80} y={238} size={32} color={c.muted} style={{opacity:1-ease(t,project.layers.from-1,.35)}}>{r.subtitle}</Text>
    <PersistentPanel theme={c} keyframes={[{at:0,rect:[80,460,920,930]},{at:r.contractAt,rect:[80,460,920,930]},{at:r.contractAt+1.3,rect:[80,460,450,830]}]}>
      <Item style={{left:44,top:42}}><Icon name="file-text"/></Item>
      <Text x={44} y={143} size={mix(60,49,p)}>SKILL.md</Text>
      {r.rows.map((row,i)=><Reveal key={i} at={row.at}>
        <Text x={44} y={278+i*180} size={mix(42,35,p)}>{row.title}</Text>
        <Text x={44} y={343+i*180} size={30} color={c.muted} style={{opacity:1-p}}>{row.detail}</Text>
      </Reveal>)}
    </PersistentPanel>
    <Reveal at={r.inputsAt}>
      <Text x={600} y={495} size={42}>本期输入</Text>
      {['内容','授权照片','已选声音'].map((s,i)=><Item key={s} style={{left:600,top:635+i*190}}><Icon name={['file-text','image','mic'][i]} size={49}/><Text x={75} y={0} size={34}>{s}</Text></Item>)}
    </Reveal>
  </>;
}

// This generic stack is intentionally a visual demo, not a fake person's lip sync.
function LayerContent({index,project,active,assembled}) {
  const c=project.theme;
  if(index===0) return <Item style={{right:mix(22,40,assembled),top:mix(24,100,assembled),width:mix(210,820,assembled),height:mix(120,650,assembled),borderRadius:14,background:c.soft,overflow:'hidden'}}>
    {project.avatarSegments.length ? <Avatar segments={project.avatarSegments}/> : <><Item style={{left:mix(75,327,assembled),top:mix(17,170,assembled)}}><Icon name="video" size={mix(57,170,assembled)}/></Item><Text x={mix(34,286,assembled)} y={mix(83,390,assembled)} size={mix(23,40,assembled)}>人物素材示意</Text></>}
  </Item>;
  if(index===1)return <Text x={30} y={95} size={34}>字幕跟随当前讲解出现</Text>;
  if(index===2)return <><Item style={{left:30+assembled*130,top:93}}><Icon name="image" size={52}/></Item><Text x={115+assembled*100} y={95} size={33}>对象移动 → 形成关系</Text></>;
  return <svg width="760" height="70" style={{position:'absolute',left:30,top:94}}>{Array.from({length:84},(_,i)=>{
    const h=12+40*(.5+.5*Math.sin(i*1.77))*(.45+.55*Math.sin(i*.16)**2);
    return <rect key={i} x={i*9} y={(70-h)/2} width="4" height={h} rx="2" fill={i/84<active?c.accent:c.line}/>;
  })}</svg>;
}

export function Layers({project}) {
  const t=useTime(),c=project.theme,l=project.layers,spread=ease(t,l.spreadAt,1.3),merge=ease(t,l.assembleAt,1.3);
  return <>
    <Text x={80} y={140} size={61} style={{opacity:ease(t,l.from-.3,.5)}}>{l.title}</Text>
    <Text x={80} y={239} size={32} color={c.muted} style={{opacity:ease(t,l.from-.3,.5)}}>同一时间线 · 各自承担不同作用</Text>
    {[3,2,1,0].map(i=>{
      const y=mix(610+i*20,410+i*250,spread),after=[410,1190,970,1350][i];
      const focus=t>=l.focusAt[i] && t<(l.focusAt[i+1]??l.assembleAt);
      return <Item key={i} style={{zIndex:merge>.01?i:4-i,left:mix(90+i*7,90,spread),top:mix(y,after,merge),width:900,height:mix(220,[900,145,170,160][i],merge),borderRadius:20,background:i===0?c.paper:(i%2?c.soft:c.paper),border:`${focus?3:1}px solid ${focus?c.accent:c.line}`,boxShadow:`0 ${10*(1-merge)}px ${26*(1-merge)}px #292b2715`,overflow:'hidden'}}>
        <Text x={30} y={23} size={34} color={c.ink} style={{opacity:1-merge}}><span style={{color:c.accent}}>{String(i+1).padStart(2,'0')} </span>{l.labels[i]}</Text>
        {i===0&&<Text x={30} y={95} size={29} color={c.muted} style={{width:580,opacity:1-merge}}>{l.details[i]}</Text>}
        <LayerContent index={i} project={project} active={ease(t,l.focusAt[3],2)} assembled={merge}/>
      </Item>;
    })}
    <Text x={90} y={1565} size={34} color={c.accent} style={{opacity:merge}}>组合之后，回到完整画面</Text>
  </>;
}

export function Film({project}) {
  const t=useTime(),c=project.theme,start=project.layers.from,transition=ease(t,start-1,1.2);
  return <AbsoluteFill style={{background:c.bg,color:c.ink,fontFamily:project.fontFamily}}>
    {t<start+.2&&<Rules project={project}/>}
    {/* Outgoing content remains behind the arriving opaque canvas: no blank page. */}
    {t>=start-1&&<AbsoluteFill style={{background:c.bg,clipPath:`inset(${(1-transition)*100}% 0 0 0)`}}><Layers project={project}/></AbsoluteFill>}
    <Captions cues={project.captions} color={c.ink}/>
    <Soundtrack narration={project.narration} sfx={project.sfx}/>
  </AbsoluteFill>;
}
