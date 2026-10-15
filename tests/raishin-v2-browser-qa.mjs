import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const out='artifacts/raishin-v2-visual';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));
page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});

async function shot(name){
  await page.locator('.game-frame').screenshot({path:`${out}/${name}.png`});
}
async function move(key,ms,name){
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(120);
  await shot(name);
}

try{
  await page.goto('http://127.0.0.1:4173/raishin-legacy/v2.html',{waitUntil:'networkidle',timeout:45000});
  await page.locator('#phaserGame canvas').waitFor({state:'visible',timeout:20000});
  const loadErrorVisible=await page.locator('#loadError').isVisible();
  if(loadErrorVisible)throw new Error('Movement Engine v2 load-error overlay is visible');
  await page.locator('#phaserGame canvas').click({position:{x:800,y:450}});
  await shot('01-spawn');
  await move('w',1100,'02-up-deeper');
  await move('s',650,'03-down-nearer');
  await move('a',850,'04-left');
  await page.keyboard.down('w');
  await page.keyboard.down('d');
  await page.waitForTimeout(700);
  await page.keyboard.up('d');
  await page.keyboard.up('w');
  await page.waitForTimeout(120);
  await shot('05-diagonal-up-right');
  if(errors.length)throw new Error(errors.join('\n'));
  await fs.writeFile(`${out}/qa.txt`,'PASS: v2 loaded in Chromium; spawn, UP, DOWN, LEFT and diagonal screenshots captured.\n');
  console.log('PASS: Raishin v2 Chromium visual QA capture');
}finally{
  await browser.close();
}
