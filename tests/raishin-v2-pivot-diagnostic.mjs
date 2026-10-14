import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out='artifacts/raishin-v2-visual';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
try{
  await page.goto('http://127.0.0.1:4173/raishin-legacy/v2.html',{waitUntil:'networkidle',timeout:45000});
  const metrics=await page.evaluate(async()=>{
    const image=new Image();
    image.src='./assets/player/raika-walk-4dir-8f.png';
    await image.decode();
    const frames=8,rows=4,sw=Math.floor(image.naturalWidth/frames),sh=Math.floor(image.naturalHeight/rows);
    const canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const alphaThreshold=96,minRowPixels=Math.max(4,Math.round(sw*.055)),minRunPixels=Math.max(3,Math.round(sw*.035));
    const result={image:{width:image.naturalWidth,height:image.naturalHeight},frame:{width:sw,height:sh},rows:{down:[],up:[],left:[],right:[]}};
    const names=['down','up','left','right'];
    for(let row=0;row<rows;row+=1){
      for(let frame=0;frame<frames;frame+=1){
        ctx.clearRect(0,0,sw,sh);
        ctx.drawImage(image,frame*sw,row*sh,sw,sh,0,0,sw,sh);
        const pixels=ctx.getImageData(0,0,sw,sh).data;
        let supportY=-1;
        for(let y=sh-1;y>=Math.floor(sh*.5);y-=1){
          let count=0,run=0,maxRun=0;
          for(let x=0;x<sw;x+=1){
            if(pixels[(y*sw+x)*4+3]>=alphaThreshold){count+=1;run+=1;if(run>maxRun)maxRun=run;}else run=0;
          }
          if(count>=minRowPixels&&maxRun>=minRunPixels){supportY=y;break;}
        }
        result.rows[names[row]].push({frame,supportY,supportNorm:supportY>=0?(supportY+.5)/sh:null,bottomPadding:supportY>=0?sh-1-supportY:null});
      }
    }
    return result;
  });
  await fs.writeFile(`${out}/pivot-diagnostic.json`,JSON.stringify(metrics,null,2));
  console.log(JSON.stringify(metrics));
}finally{await browser.close();}
