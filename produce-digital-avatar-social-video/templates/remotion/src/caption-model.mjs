const clean = s => s.replace(/\s/g,'');
export function validateCaptions(cues,duration) {
 let end=0;
 for(const c of cues) {
  if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<end||c.end<=c.start||c.end>duration||typeof c.text!=='string'||!c.text.trim())throw Error('Invalid or overlapping caption');
  end=c.end;
  if(c.display==='graphic'&&(!c.graphicText||!clean(c.graphicText).includes(clean(c.text))))throw Error('Graphic must contain the spoken caption');
  const e=c.emphasis;
  if(!e)continue;
  if(typeof e.lead!=='string'||typeof e.focus!=='string'||!e.key||!e.focus.includes(e.key)||clean(e.lead+e.focus)!==clean(c.text))throw Error('Emphasis must preserve the spoken phrase');
  if(!Number.isFinite(e.at)||e.at<c.start-1e-6||e.at>=c.end||c.end-e.at<.65)throw Error('Emphasis anchor outside a readable interval');
  if((e.ratio??1.28)<1.25||(e.ratio??1.28)>1.5)throw Error('Use a readable emphasis ratio');
  if(!e.timingSource)throw Error('Record actual alignment or identify a silent demo');
 }
 return true;
}

