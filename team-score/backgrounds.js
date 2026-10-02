(()=>{
  const DESKTOP_PLAYERS=[
    {name:'maya',  file:'assets/hd-sprites/maya.webp?v=31'},
    {name:'sofia', file:'assets/hd-sprites/sofia.webp?v=31'},
    {name:'nia',   file:'assets/hd-sprites/nia.webp?v=31'},
    {name:'lena',  file:'assets/hd-sprites/lena.webp?v=31'}
  ];
  const MOBILE_IMAGES=[
    'assets/mobile/p1.webp?v=31',
    'assets/mobile/p2.webp?v=31',
    'assets/mobile/p3.webp?v=31',
    'assets/mobile/p4.webp?v=31'
  ];
  const COLS=3, TILE_W=800, TILE_H=600, SPRITE_W=2400, SPRITE_H=1200;
  const INTERVAL=15000;
  const cache=new Map();
  let layers=[],active=0,current=0,timer=null,resizeTimer=null,lastPortrait=null;

  function portraitMode(){
    return window.innerHeight > window.innerWidth * 1.25;
  }

  function snap(v){
    const dpr=Math.max(1,Math.min(4,window.devicePixelRatio||1));
    return Math.round(v*dpr)/dpr;
  }

  async function preload(src){
    if(cache.has(src)) return src;
    await new Promise((resolve,reject)=>{
      const im=new Image();
      im.decoding='sync';
      im.onload=resolve;
      im.onerror=()=>reject(new Error('failed '+src));
      im.src=src;
    });
    cache.set(src,true);
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

  function clearSizing(img){
    img.style.width='';
    img.style.height='';
    img.style.left='';
    img.style.top='';
    img.style.right='';
    img.style.bottom='';
    img.style.objectFit='';
    img.style.objectPosition='';
    img.style.transform='none';
  }

  function place(layer,index){
    const rect=layer.getBoundingClientRect();
    if(!rect.width||!rect.height) return;
    const img=layer.firstElementChild;
    clearSizing(img);

    if(portraitMode()){
      // Mobile: use a real portrait file close to the phone's aspect ratio.
      // It is normally downscaled, not enlarged, so details stay much sharper.
      img.style.inset='0';
      img.style.width='100%';
      img.style.height='100%';
      img.style.objectFit='cover';
      img.style.objectPosition='center center';
      layer.dataset.index=String(index);
      return;
    }

    img.style.inset='auto';
    const local=index%6;
    const col=local%COLS;
    const row=Math.floor(local/COLS);
    const scale=Math.max(rect.width/TILE_W,rect.height/TILE_H);
    const tileW=TILE_W*scale, tileH=TILE_H*scale;
    const x=-(col*tileW+(tileW-rect.width)/2);
    const y=-(row*tileH+(tileH-rect.height)/2);
    img.style.width=snap(SPRITE_W*scale)+'px';
    img.style.height=snap(SPRITE_H*scale)+'px';
    img.style.left=snap(x)+'px';
    img.style.top=snap(y)+'px';
    layer.dataset.index=String(index);
  }

  async function sourceFor(index){
    if(portraitMode()){
      const src=MOBILE_IMAGES[index%MOBILE_IMAGES.length];
      await preload(src);
      return {src,key:'m'+(index%MOBILE_IMAGES.length)};
    }
    const playerIdx=Math.floor((index%24)/6);
    const src=DESKTOP_PLAYERS[playerIdx].file;
    await preload(src);
    return {src,key:'d'+playerIdx};
  }

  async function prepare(layer,index){
    const source=await sourceFor(index);
    if(layer.dataset.sourceKey!==source.key){
      const img=layer.firstElementChild;
      img.src=source.src;
      layer.dataset.sourceKey=source.key;
      if(img.decode){try{await img.decode();}catch(e){}}
    }
    place(layer,index);
  }

  function total(){ return portraitMode()?MOBILE_IMAGES.length:24; }

  async function show(index,immediate=false){
    if(layers.length<2) return;
    index=((index%total())+total())%total();
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
    sourceFor((index+1)%total()).catch(()=>{});
  }

  async function resetForOrientation(){
    const now=portraitMode();
    if(now===lastPortrait) return;
    lastPortrait=now;
    layers.forEach(l=>{l.dataset.sourceKey='';});
    current=0;
    await show(0,true);
    await prepare(layers[1],1%total());
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
    lastPortrait=portraitMode();
    await show(0,true);
    host.style.backgroundImage='none';
    await prepare(layers[1],1%total());

    timer=setInterval(()=>show((current+1)%total(),false).catch(()=>{}),INTERVAL);
    window.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(async()=>{
        if(portraitMode()!==lastPortrait) await resetForOrientation();
        else layers.forEach(l=>place(l,Number(l.dataset.index||current)));
      },80);
    },{passive:true});
  }

  setTimeout(()=>init().catch(e=>console.error('TeamScore backgrounds:',e)),0);
})();