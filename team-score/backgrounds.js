(()=>{
  const PLAYERS=[
    {name:'maya',  file:'assets/hd-sprites/maya.webp?v=30'},
    {name:'sofia', file:'assets/hd-sprites/sofia.webp?v=30'},
    {name:'nia',   file:'assets/hd-sprites/nia.webp?v=30'},
    {name:'lena',  file:'assets/hd-sprites/lena.webp?v=30'}
  ];
  const COLS=3, ROWS=2;
  const TILE_W=800, TILE_H=600;
  const SPRITE_W=2400, SPRITE_H=1200;
  const TOTAL=24, INTERVAL=15000;
  const spriteCache=new Map();
  let layers=[],active=0,current=0,timer=null,resizeTimer=null;

  function snap(v){
    const dpr=Math.max(1,Math.min(4,window.devicePixelRatio||1));
    return Math.round(v*dpr)/dpr;
  }

  async function getSprite(playerIdx){
    if(spriteCache.has(playerIdx)) return spriteCache.get(playerIdx);
    const src=PLAYERS[playerIdx].file;
    await new Promise((resolve,reject)=>{
      const im=new Image();
      im.decoding='sync';
      im.onload=()=>resolve();
      im.onerror=()=>reject(new Error('failed '+src));
      im.src=src;
    });
    spriteCache.set(playerIdx,src);
    return src;
  }

  function makeLayer(host,name){
    const layer=document.createElement('div');
    layer.className='approved-bg-layer';
    layer.dataset.slot=name;
    const img=document.createElement('img');
    img.alt='';
    img.decoding='sync';
    img.loading='eager';
    img.draggable=false;
    layer.appendChild(img);
    host.insertBefore(layer,host.firstChild);
    return layer;
  }

  function place(layer,index){
    const rect=layer.getBoundingClientRect();
    if(!rect.width||!rect.height) return;
    const local=index%6;
    const col=local%COLS;
    const row=Math.floor(local/COLS);
    const scale=Math.max(rect.width/TILE_W,rect.height/TILE_H);
    const tileW=TILE_W*scale, tileH=TILE_H*scale;
    const x=-(col*tileW+(tileW-rect.width)/2);
    const y=-(row*tileH+(tileH-rect.height)/2);
    const img=layer.firstElementChild;

    // Avoid fractional GPU transforms: they visibly soften the image on
    // high-DPI phones. Position the sprite on device-pixel boundaries.
    img.style.width=snap(SPRITE_W*scale)+'px';
    img.style.height=snap(SPRITE_H*scale)+'px';
    img.style.left=snap(x)+'px';
    img.style.top=snap(y)+'px';
    img.style.transform='none';
    layer.dataset.index=String(index);
  }

  async function prepare(layer,index){
    const playerIdx=Math.floor(index/6);
    const src=await getSprite(playerIdx);
    if(layer.dataset.player!==String(playerIdx)){
      const img=layer.firstElementChild;
      img.src=src;
      layer.dataset.player=String(playerIdx);
      if(img.decode){
        try{await img.decode();}catch(e){}
      }
    }
    place(layer,index);
  }

  async function show(index,immediate=false){
    if(layers.length<2) return;
    const nextSlot=immediate?active:1-active;
    const next=layers[nextSlot],prev=layers[active];
    await prepare(next,index);
    requestAnimationFrame(()=>{
      next.classList.add('active');
      if(!immediate) prev.classList.remove('active');
      if(immediate) layers.forEach((l,i)=>l.classList.toggle('active',i===nextSlot));
    });
    if(!immediate) active=nextSlot;
    current=index;
    getSprite(Math.floor(((index+1)%TOTAL)/6)).catch(()=>{});
  }

  async function init(){
    let host=null;
    for(let i=0;i<50&&!host;i++){
      host=document.querySelector('.rotating-bg');
      if(!host) await new Promise(r=>setTimeout(r,100));
    }
    if(!host) throw new Error('rotating-bg not found');

    host.querySelectorAll('.bg-layer,.approved-bg-layer').forEach(el=>el.remove());
    layers=[makeLayer(host,'A'),makeLayer(host,'B')];
    await show(0,true);
    host.style.backgroundImage='none';
    await prepare(layers[1],1);

    timer=setInterval(()=>show((current+1)%TOTAL,false).catch(()=>{}),INTERVAL);
    window.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        layers.forEach(l=>place(l,Number(l.dataset.index||current)));
      },80);
    },{passive:true});
  }

  setTimeout(()=>init().catch(e=>console.error('TeamScore backgrounds:',e)),0);
})();
