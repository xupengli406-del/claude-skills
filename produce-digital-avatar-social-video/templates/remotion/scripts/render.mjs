import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia,renderStill} from '@remotion/renderer';
execFileSync(process.execPath,['scripts/check.mjs'],{stdio:'inherit'});
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE||undefined;
const serveUrl=await bundle({entryPoint:path.resolve('src/index.jsx'),outDir:path.resolve('.bundle')});
const browser=await openBrowser('chrome',{browserExecutable});
try {
  const composition=await selectComposition({serveUrl,id:'Explainer',browserExecutable,puppeteerInstance:browser});
  fs.mkdirSync('out',{recursive:true});
  if(process.argv[2]==='stills'){
    for(const s of [2,7,11,14,16.5,19,23.5,27,29])await renderStill({serveUrl,composition,browserExecutable,puppeteerInstance:browser,frame:Math.round(s*composition.fps),output:`out/frame-${s}.png`});
  }else{
    await renderMedia({serveUrl,composition,browserExecutable,puppeteerInstance:browser,codec:'h264',pixelFormat:'yuv420p',concurrency:1,offthreadVideoThreads:1,crf:19,scale:process.argv.includes('--draft')?.5:1,outputLocation:'out/explainer.mp4',onProgress:({renderedFrames})=>{if(renderedFrames%150===0)console.log('Rendered',renderedFrames)}});
  }
}finally{await browser.close({silent:true})}
