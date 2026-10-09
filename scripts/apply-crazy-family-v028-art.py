from pathlib import Path

p = Path('crazy-family.html')
s = p.read_text(encoding='utf-8')

s = s.replace('עולם הבית · שלב 1: מפגש אבא · v0.27', 'עולם הבית · שלב 1: מפגש אבא · v0.28')

old_dad = "const dad={scene:'ground',x:320,y:180,r:18,speed:70,targetX:320,targetY:180,targetAt:0,singing:false,phrase:'לה לה לה!',phase:0};"
new_dad = """const dad={scene:'ground',x:320,y:180,r:22,speed:70,targetX:320,targetY:180,targetAt:0,singing:false,phrase:'לה לה לה!',phase:0};

// DAD_SPRITE_RENDERER_V028 — high-quality animated father art.
const DAD_SPRITE_URL='assets/crazy-family/dad-sprites-v028.png';
const dadSprite=new Image();dadSprite.decoding='async';dadSprite.src=DAD_SPRITE_URL;
let dadFacing=1;

// COLLECTIBLE_SPRITE_RENDERER_V028 — rendered pickups instead of emoji-only tokens.
const COLLECTIBLE_SPRITE_URL='assets/crazy-family/collectibles-v028.png';
const collectibleSprite=new Image();collectibleSprite.decoding='async';collectibleSprite.src=COLLECTIBLE_SPRITE_URL;
const BALL_SPRITE_URL='assets/crazy-family/ball-v028.png';
const ballSprite=new Image();ballSprite.decoding='async';ballSprite.src=BALL_SPRITE_URL;
const collectibleFrames={headphones:0,radio:1,mirror:2,pan:3};
const collectiblePositions={headphones:'0% 0%',radio:'100% 0%',mirror:'0% 100%',pan:'100% 100%'};
function itemInventoryArt(it){
 if(it.id==='ball')return '<span class=\"ico item-art ball-art\"></span>';
 const pos=collectiblePositions[it.id];
 if(pos)return '<span class=\"ico item-art\" style=\"background-position:'+pos+'\"></span>';
 return '<span class=\"ico\">'+it.icon+'</span>';
}
"""
if old_dad not in s:
    raise SystemExit('dad definition marker not found')
s = s.replace(old_dad, new_dad, 1)

css_old = '.ico{font-size:26px}'
css_new = ".ico{font-size:26px}.item-art{display:block;width:44px;height:44px;background-image:url('assets/crazy-family/collectibles-v028.png');background-size:200% 200%;background-repeat:no-repeat;filter:drop-shadow(0 3px 5px rgba(65,34,28,.28))}.item-art.ball-art{background-image:url('assets/crazy-family/ball-v028.png');background-size:contain;background-position:center!important}"
if css_old not in s:
    raise SystemExit('icon css marker not found')
s = s.replace(css_old, css_new, 1)

a = s.index('function drawDad(){')
b = s.index('function drawDizzyFX', a)
dad_renderer = """function dadVisualFrame(){
 const moving=Math.hypot(dad.targetX-dad.x,dad.targetY-dad.y)>10;
 if(dad.singing)return (Math.floor(dad.phase*.55)%2)?4:5;
 if(dadPrePlaying())return 3;
 if(moving)return (Math.floor(dad.phase*.65)%2)?1:2;
 if(Math.sin(dad.phase*.22)<-.93)return 6;
 return 0;
}
function drawDad(){
 if(player.scene!==dad.scene)return;
 const bob=Math.sin(dad.phase)*1.8,frame=dadVisualFrame();
 if(dad.targetX<dad.x-4)dadFacing=-1;else if(dad.targetX>dad.x+4)dadFacing=1;
 ctx.save();ctx.translate(dad.x,dad.y+bob);ctx.scale(dadFacing,1);
 ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#2b1c25';ctx.beginPath();ctx.ellipse(0,31,31,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
 if(dadSprite.complete&&dadSprite.naturalWidth){
   const cols=5,rows=2,sw=dadSprite.naturalWidth/cols,sh=dadSprite.naturalHeight/rows,sx=(frame%cols)*sw,sy=Math.floor(frame/cols)*sh;
   const dh=dad.singing?126:116,dw=dh*(sw/sh);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(dad.singing){ctx.shadowColor='#ff5ca8';ctx.shadowBlur=18+8*Math.abs(Math.sin(dad.phase));}
   ctx.drawImage(dadSprite,sx,sy,sw,sh,-dw/2,-dh+35,dw,dh);ctx.shadowBlur=0;
 }else{ctx.font='64px system-ui';ctx.textAlign='center';ctx.fillText('👨',0,-10)}
 if(dad.singing){ctx.scale(dadFacing,1);ctx.textAlign='center';ctx.font='bold 27px Arial';ctx.shadowColor='#ff55b0';ctx.shadowBlur=16;ctx.fillStyle='#fff6ff';ctx.fillText('♪',-37,-82);ctx.fillStyle='#77e9ff';ctx.fillText('♫',35,-94);ctx.shadowBlur=0}
 ctx.restore();
}
"""
s = s[:a] + dad_renderer + s[b:]

a = s.index('function pickups(){')
b = s.index('function drawHangHint', a)
pickups_renderer = """function drawCollectibleArt(p,size=56){
 if(p.id==='ball'&&ballSprite.complete&&ballSprite.naturalWidth){ctx.drawImage(ballSprite,-size/2,-size/2,size,size);return true}
 const frame=collectibleFrames[p.id];if(frame===undefined||!collectibleSprite.complete||!collectibleSprite.naturalWidth)return false;
 const cols=2,rows=2,sw=collectibleSprite.naturalWidth/cols,sh=collectibleSprite.naturalHeight/rows,sx=(frame%cols)*sw,sy=Math.floor(frame/cols)*sh;
 ctx.drawImage(collectibleSprite,sx,sy,sw,sh,-size/2,-size/2,size,size);return true
}
function pickups(){
 const now=performance.now();
 for(const p of items[player.scene])if(!p.taken){
  const bob=Math.sin(now/260+p.x*.03)*5,pulse=.5+.5*Math.sin(now/330+p.y*.02);ctx.save();ctx.translate(p.x,p.y+bob);
  ctx.shadowColor=p.id==='headphones'?'#ff67b8':'#ffd45f';ctx.shadowBlur=22+10*pulse;
  const rg=ctx.createRadialGradient(0,0,4,0,0,34);rg.addColorStop(0,'rgba(255,255,255,.94)');rg.addColorStop(.55,'rgba(255,234,174,.42)');rg.addColorStop(1,'rgba(255,203,70,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);ctx.fill();
  ctx.rotate(Math.sin(now/620+p.x)*.045);if(!drawCollectibleArt(p,p.id==='ball'?52:60)){ctx.font='36px Arial';ctx.textAlign='center';ctx.fillText(p.icon,0,12)}ctx.restore()
 }
}
"""
s = s[:a] + pickups_renderer + s[b:]

old_inv = "function renderInv(){inventoryEl.innerHTML='';for(let i=0;i<player.capacity;i++){const it=player.inventory[i],d=document.createElement('div');d.className='slot '+(!it?'empty ':'')+(i===player.selected?'selected':'');d.innerHTML=it?'<span class=\"ico\">'+it.icon+'</span><span>'+it.name+'</span><small style=\"font-size:10px;color:#756a74\">'+((it.id==='headphones'||it.id==='radio')?'בחר ולחץ חפץ':'')+'</small><button></button>':'<span class=\"ico\">＋</span><span>כיס '+(i+1)+'</span><button></button>';d.querySelector('button').onclick=()=>{player.selected=i;renderInv()};inventoryEl.appendChild(d)}}"
new_inv = "function renderInv(){inventoryEl.innerHTML='';for(let i=0;i<player.capacity;i++){const it=player.inventory[i],d=document.createElement('div');d.className='slot '+(!it?'empty ':'')+(i===player.selected?'selected':'');d.innerHTML=it?itemInventoryArt(it)+'<span>'+it.name+'</span><small style=\"font-size:10px;color:#756a74\">'+((it.id==='headphones'||it.id==='radio')?'בחר ולחץ חפץ':'')+'</small><button></button>':'<span class=\"ico\">＋</span><span>כיס '+(i+1)+'</span><button></button>';d.querySelector('button').onclick=()=>{player.selected=i;renderInv()};inventoryEl.appendChild(d)}}"
if old_inv not in s:
    raise SystemExit('renderInv marker not found')
s = s.replace(old_inv, new_inv, 1)

p.write_text(s, encoding='utf-8')
