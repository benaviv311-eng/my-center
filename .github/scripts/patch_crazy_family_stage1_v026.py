from pathlib import Path

p = Path('crazy-family.html')
s = p.read_text(encoding='utf-8')

s = s.replace('עולם הבית · חקירה חופשית · v0.25', 'עולם הבית · שלב 1: מפגש אבא · v0.26')
s = s.replace("ground:'assets/crazy-family/ground.webp'", "ground:'assets/crazy-family/stage1-home-v026.png'")

old = """function draw(){
 const img=art[player.scene];
 if(img&&img.complete&&img.naturalWidth){
   ctx.drawImage(img,0,0,W,H);
   const g=ctx.createLinearGradient(0,0,0,H);"""

new = """function drawStage1Panorama(img){
 const targetAspect=W/H,srcAspect=img.naturalWidth/img.naturalHeight;
 if(srcAspect>targetAspect){
   const sw=img.naturalHeight*targetAspect;
   const maxSx=Math.max(0,img.naturalWidth-sw);
   const camera=Math.max(0,Math.min(1,player.x/W));
   const sx=maxSx*camera;
   ctx.drawImage(img,sx,0,sw,img.naturalHeight,0,0,W,H);
 }else{
   const sh=img.naturalWidth/targetAspect;
   const sy=Math.max(0,(img.naturalHeight-sh)*.5);
   ctx.drawImage(img,0,sy,img.naturalWidth,sh,0,0,W,H);
 }
}
function draw(){
 const img=art[player.scene];
 if(img&&img.complete&&img.naturalWidth){
   if(player.scene==='ground')drawStage1Panorama(img);else ctx.drawImage(img,0,0,W,H);
   const g=ctx.createLinearGradient(0,0,0,H);"""

if old not in s:
    raise SystemExit('draw block not found')

s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('Patched crazy-family.html to Stage 1 v0.26 cinematic panorama')
