function clampByte(value){return Math.max(0,Math.min(255,Math.round(value)));}
function finiteAnisotropy(value){const n=Number(value);return Number.isFinite(n)&&n>0?Math.min(16,n):4;}
function rgbaTexture(THREE,size,painter,anisotropy){
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const [r,g,b,a=255]=painter(x,y,size);
    const i=(y*size+x)*4;data[i]=clampByte(r);data[i+1]=clampByte(g);data[i+2]=clampByte(b);data[i+3]=clampByte(a);
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=finiteAnisotropy(anisotropy);texture.needsUpdate=true;return texture;
}
function makeTextures(THREE,anisotropy){
  const wood=rgbaTexture(THREE,64,(x,y)=>{
    const board=Math.floor(x/16),grain=Math.sin((y+board*13)*.20)*3+Math.sin((y+x)*.075)*1.5;
    const bases=[[194,154,121],[186,143,108],[201,162,128],[190,149,114]];const base=bases[board%bases.length];
    const seam=x%16===0?-8:0;return[base[0]+grain+seam,base[1]+grain*.7+seam,base[2]+grain*.5+seam,255];
  },anisotropy);wood.name='final-art-wood';wood.repeat.set?.(4,3);
  const rug=rgbaTexture(THREE,64,(x,y)=>{
    const border=x<5||y<5||x>58||y>58;const weave=((x+y)%5===0)?4:0;const diamond=Math.abs((x%16)-8)+Math.abs((y%16)-8)<5;
    return border?[234+weave,194+weave,164,255]:diamond?[196+weave,112,99,255]:[181+weave,91,85,255];
  },anisotropy);rug.name='final-art-rug';rug.repeat.set?.(2,1.15);
  const fabric=rgbaTexture(THREE,32,(x,y)=>{const weave=(x%4===0?4:0)+(y%5===0?3:0);const base=222+weave;return[base,base,base,255];},anisotropy);fabric.name='final-art-fabric';fabric.repeat.set?.(4,4);
  const wall=rgbaTexture(THREE,32,(x,y)=>{const noise=((x*17+y*29)%7)-3;return[248+noise,242+noise,234+noise,255];},anisotropy);wall.name='final-art-wall';wall.repeat.set?.(4,3);
  return{floorWood:wood,rug,fabric,wall};
}
export function createLivingRoomMaterialSystem({THREE,anisotropy=4}={}){
  if(!THREE?.MeshStandardMaterial||!THREE?.DataTexture)throw new Error('THREE material primitives are required');
  const textures=makeTextures(THREE,anisotropy);
  const make=(options)=>new THREE.MeshStandardMaterial(options);
  const materials=new Map([
    ['floorWood',make({map:textures.floorWood,color:0xfff3e5,roughness:.76,metalness:0})],
    ['furnitureWood',make({map:textures.floorWood,color:0x8b6049,roughness:.67,metalness:0})],
    ['sofaFabric',make({map:textures.fabric,color:0xc96f68,roughness:.91,metalness:0})],
    ['cushionWarm',make({map:textures.fabric,color:0xf0b58f,roughness:.92,metalness:0})],
    ['cushionCool',make({map:textures.fabric,color:0x78aaa5,roughness:.91,metalness:0})],
    ['wall',make({map:textures.wall,color:0xfff7ed,roughness:.95,metalness:0})],
    ['rug',make({map:textures.rug,color:0xfff5ed,roughness:.96,metalness:0})],
    ['toyPlastic',make({color:0xf3ba50,roughness:.48,metalness:.02})],
    ['metal',make({color:0x66717a,roughness:.37,metalness:.5})],
    ['lampShade',make({color:0xf2d19a,roughness:.84,metalness:0})],
    ['lampGlow',make({color:0xffd89a,emissive:0xffb45d,emissiveIntensity:1.35,roughness:.45,metalness:0})],
    ['windowGlass',make({color:0x9fc9d4,roughness:.18,metalness:.03,transparent:true,opacity:.62})],
    ['curtainFabric',make({map:textures.fabric,color:0xe8c3ad,roughness:.95,metalness:0})],
    ['plantLeaf',make({color:0x668d68,roughness:.88,metalness:0})],
    ['ceramic',make({color:0xd99570,roughness:.8,metalness:.02})],
    ['tvScreen',make({color:0x17242a,emissive:0x15313c,emissiveIntensity:.5,roughness:.25,metalness:.08})],
  ]);
  let disposed=false;
  return{
    textures,
    get(name){const material=materials.get(name);if(!material)throw new Error(`Unknown living room material: ${name}`);return material;},
    dispose(){if(disposed)return;disposed=true;for(const material of materials.values())material.dispose?.();for(const texture of Object.values(textures))texture.dispose?.();},
  };
}
