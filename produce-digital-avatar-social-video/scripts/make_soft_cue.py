#!/usr/bin/env python3
"""Generate an original quiet confirmation cue; no third-party audio samples."""
import argparse, math, struct, wave
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('output',type=Path)
a=p.parse_args()
if a.output.exists():p.error('Output exists; choose a new path')
a.output.parent.mkdir(parents=True,exist_ok=True)
sr=48000;n=int(.22*sr)
with wave.open(str(a.output),'wb') as f:
 f.setparams((1,2,sr,n,'NONE','not compressed'))
 frames=[]
 for i in range(n):
  t=i/sr;env=min(1,t/.009)*math.exp(-t*23)*(1-i/n)
  v=.13*env*(math.sin(2*math.pi*660*t)+.23*math.sin(2*math.pi*990*t))
  frames.append(struct.pack('<h',int(max(-1,min(1,v))*32767)))
 f.writeframes(b''.join(frames))
print(str(a.output))
