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
    const board=Math.floor(x/8),grain=Math.sin((y+board*11)*.34)*7+Math.sin((y+x)*.11)*3;
    const bases=[[184,137,103],[168,118,86],[193,146,109],[176,126,91]];const base=bases[board%bases.length];
    const seam=x%8===0?-18:0;return[base[0]+grain+seam,base[1]+grain*.65+seam,base[2]+grain*.45+seam,255];
  },anisotropy);wood.name='final-art-wood';wood.repeat.set?.(7,5);
  const rug=rgbaTexture(THREE,64,(x,y)=>{
    const border=x<5||y<5||x>58||y>58;const weave=((x+y)%4===0)?6:0;const diamond=Math.abs((x%16)-8)+Math.abs((y%16)-8)<5;
    return border?[229+weave,182+weave,150,255]:diamond?[190+weave,103,92,255]:[174+weave,83,78,255];
  },anisotropy);rug.name='final-art-rug';rug.repeat.set?.(2.2,1.25);
  const fabric=rgbaTexture(THREE,32,(x,y)=>{const weave=(x%3===0?7:0)+(y%4===0?5:0);return[196+weave,118+weave*.35,116+weave*.2,255];},anisotropy);fabric.name='final-art-fabric';fabric.repeat.set?.(5,5);
  const wall=rgbaTexture(THREE,32,(x,y)=>{const noise=((x*17+y*29)%11)-5;return[239+noise,222+noise,205+noise,255];},anisotropy);wall.name='final-art-wall';wall.repeat.set?.(5,4);
  return{floorWood:wood,rug,fabric,wall};
}
export function createLivingRoomMaterialSystem({THREE,anisotropy=4}={}){
  if(!THREE?.MeshStandardMaterial||!THREE?.DataTexture)throw new Error('THREE material primitives are required');
  const textures=makeTextures(THREE,anisotropy);
  const make=(options)=>new THREE.MeshStandardMaterial(options);
  const materials=new Map([
    ['floorWood',make({map:textures.floorWood,color:0xffffff,roughness:.72,metalness:0})],
    ['furnitureWood',make({map:textures.floorWood,color:0x8d624b,roughness:.64,metalness:0})],
    ['sofaFabric',make({map:textures.fabric,color:0xc77e79,roughness:.9,metalness:0})],
    ['cushionWarm',make({map:textures.fabric,color:0xe6ad8e,roughness:.91,metalness:0})],
    ['cushionCool',make({map:textures.fabric,color:0x82aaa6,roughness:.9,metalness:0})],
    ['wall',make({map:textures.wall,color:0xf0dfcf,roughness:.94,metalness:0})],
    ['rug',make({map:textures.rug,color:0xffffff,roughness:.95,metalness:0})],
    ['toyPlastic',make({color:0xf2b94c,roughness:.46,metalness:.02})],
    ['metal',make({color:0x66717a,roughness:.35,metalness:.5})],
    ['lampShade',make({color:0xf0c982,roughness:.82,metalness:0})],
    ['lampGlow',make({color:0xffcf83,emissive:0xffa94f,emissiveIntensity:1.7,roughness:.45,metalness:0})],
  ]);
  let disposed=false;
  return{
    textures,
    get(name){const material=materials.get(name);if(!material)throw new Error(`Unknown living room material: ${name}`);return material;},
    dispose(){if(disposed)return;disposed=true;for(const material of materials.values())material.dispose?.();for(const texture of Object.values(textures))texture.dispose?.();},
  };
}
