(()=>{
  const SPRITE='assets/approved24.webp?v=19';
  const COLS=6, ROWS=4, TILE_W=240, TILE_H=180, SPRITE_W=1440, SPRITE_H=720, TOTAL=24;
  const INTERVAL=15000;
  let layers=[], active=0, current=0, timer=null, resizeTimer=null;

  function makeLayer(host, name){
    const layer=document.createElement('div');
    layer.className='approved-bg-layer';
    layer.dataset.slot=name;
    const img=document.createElement('img');
    img.src=SPRITE;
    img.alt='';
    img.decoding='async';
    img.draggable=false;
    layer.appendChild(img);
    host.insertBefore(layer, host.firstChild);
    return layer;
  }

  function place(layer, index){
    const rect=layer.getBoundingClientRect();
    if(!rect.width || !rect.height) return;
    const col=index % COLS;
    const row=Math.floor(index / COLS);
    const scale=Math.max(rect.width/TILE_W, rect.height/TILE_H);
    const tileW=TILE_W*scale;
    const tileH=TILE_H*scale;
    const x=-(col*tileW + (tileW-rect.width)/2);
    const y=-(row*tileH + (tileH-rect.height)/2);
    const img=layer.firstElementChild;
    img.style.width=(SPRITE_W*scale)+'px';
    img.style.height=(SPRITE_H*scale)+'px';
    img.style.transform='translate3d('+x+'px,'+y+'px,0)';
    layer.dataset.index=String(index);
  }

  function show(index, immediate){
    if(layers.length<2) return;
    const nextSlot=immediate ? active : 1-active;
    const next=layers[nextSlot];
    const prev=layers[active];
    place(next,index);
    if(immediate){
      layers.forEach((l,i)=>l.classList.toggle('active',i===nextSlot));
    }else{
      requestAnimationFrame(()=>{
        next.classList.add('active');
        prev.classList.remove('active');
      });
      active=nextSlot;
    }
    current=index;
  }

  function advance(){ show((current+1)%TOTAL,false); }

  function init(){
    const host=document.querySelector('.rotating-bg');
    if(!host) return;
    host.querySelectorAll('.bg-layer').forEach(el=>{el.style.display='none';});
    layers=[makeLayer(host,'A'),makeLayer(host,'B')];
    const imgs=layers.map(l=>l.firstElementChild);
    let ready=0;
    const done=()=>{
      ready++;
      if(ready<2) return;
      show(0,true);
      place(layers[1],1);
      timer=setInterval(advance,INTERVAL);
    };
    imgs.forEach(img=>{
      if(img.complete) done();
      else {img.addEventListener('load',done,{once:true}); img.addEventListener('error',done,{once:true});}
    });
    window.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        layers.forEach(l=>place(l,Number(l.dataset.index||current)));
      },120);
    },{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();