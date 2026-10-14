const REQUIRED_LAYER_IDS = new Set([
  'cinematic-background',
  'cinematic-sofa',
  'cinematic-coffee-table',
]);

const SCREEN_STAGE=Object.freeze({width:16,height:10});

function worldById(world){return new Map((world?.objects||[]).map(object=>[object.id,object]));}
function cloneEnvelope(value){return value?{...value}:null;}

export function validateCinematicManifest(manifest){
  if(!manifest || !Array.isArray(manifest.layers))throw new Error('cinematic manifest requires layers');
  const ids=new Set();let hasBackground=false;
  for(const layer of manifest.layers){
    if(!layer?.id || !layer?.src || !layer?.kind || !layer?.world)throw new Error('cinematic manifest layer is incomplete');
    if(ids.has(layer.id))throw new Error(`duplicate cinematic layer id: ${layer.id}`);
    if(layer.mask){
      if(!Array.isArray(layer.mask)||layer.mask.length<3)throw new Error(`invalid cinematic mask: ${layer.id}`);
      for(const point of layer.mask)if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite))throw new Error(`invalid cinematic mask point: ${layer.id}`);
    }
    ids.add(layer.id);if(layer.kind==='background'&&layer.required!==false)hasBackground=true;
  }
  if(!hasBackground)throw new Error('required background layer is missing');
  for(const id of REQUIRED_LAYER_IDS)if(!ids.has(id))throw new Error(`required cinematic layer is missing: ${id}`);
  return true;
}

export function prepareCinematicDefinitions(manifest,world){
  validateCinematicManifest(manifest);
  const lookup=worldById(world);
  const layers=manifest.layers.map(layer=>{
    const anchor=layer.anchorId?lookup.get(layer.anchorId):null;
    if(layer.anchorId&&!anchor)throw new Error(`missing world anchor: ${layer.anchorId}`);
    const worldPlacement=layer.world||{};
    const position={x:(anchor?.x||0)+(Number(worldPlacement.x)||0),y:Number(worldPlacement.y)||0,z:(anchor?.z||0)+(Number(worldPlacement.z)||0)};
    const proxy=layer.proxy?{x:anchor?.x??position.x,z:anchor?.z??position.z,width:Number(layer.proxy.width)||Number(worldPlacement.width)||0,depth:Number(layer.proxy.depth)||Number(worldPlacement.depth)||0}:null;
    return {...layer,world:{...worldPlacement},position,proxy,mask:layer.mask?.map(point=>[...point])||null};
  });
  return {layers,visualEnvelope:cloneEnvelope(manifest.visualEnvelope)};
}

function loadTexture(loader,url){return new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));}

function maskedTexture(THREE,source,mask){
  if(!mask)return source;
  const image=source.image;
  if(!image?.width||!image?.height)throw new Error('cinematic master image has no dimensions');
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d');ctx.save();ctx.beginPath();
  mask.forEach(([nx,ny],index)=>{const x=nx*canvas.width,y=ny*canvas.height;if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
  ctx.closePath();ctx.clip();ctx.drawImage(image,0,0,canvas.width,canvas.height);ctx.restore();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}

function makeMaterial(THREE,texture){
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;
  return new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.006,opacity:1,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false});
}

function screenDepth(layer){if(layer.kind==='background')return -9;if(layer.kind==='surface')return -8.8;return -8.55;}

function makeLayerObject(THREE,layer,texture){
  const geometry=new THREE.PlaneGeometry(SCREEN_STAGE.width,SCREEN_STAGE.height);const material=makeMaterial(THREE,texture);const mesh=new THREE.Mesh(geometry,material);
  mesh.name=layer.id;mesh.userData.semanticId=layer.id;mesh.userData.cinematicKind=layer.kind;mesh.userData.anchorId=layer.anchorId||null;
  mesh.userData.baseRenderOrder=Number(layer.renderOrder)||0;mesh.userData.required=layer.required!==false;mesh.userData.screenLayer=true;
  mesh.userData.inactiveZ=screenDepth(layer);mesh.userData.activeOccluderZ=-2.35;
  mesh.userData.cinematicBase={position:{x:0,y:0,z:mesh.userData.inactiveZ},rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}};
  mesh.position.set(0,0,mesh.userData.inactiveZ);mesh.renderOrder=mesh.userData.baseRenderOrder;mesh.frustumCulled=false;return mesh;
}

export async function createCinematicSet({scene,parent=scene,world,THREE,manifestUrl='assets/crazy-family/cinematic-home-v043/manifest.json',fetchImpl=globalThis.fetch?.bind(globalThis),textureLoader=null}={}){
  if(!scene)throw new Error('cinematic set requires a scene');if(!parent)throw new Error('cinematic set requires a parent');if(!THREE)throw new Error('cinematic set requires THREE');if(!fetchImpl)throw new Error('cinematic set requires fetch');
  const response=await fetchImpl(manifestUrl,{cache:'no-store'});if(!response?.ok)throw new Error(`cinematic manifest failed to load: ${response?.status??'unknown'}`);
  const manifest=await response.json();const prepared=prepareCinematicDefinitions(manifest,world);const loader=textureLoader||new THREE.TextureLoader();
  const sourceCache=new Map();const sourceFor=async url=>{if(!sourceCache.has(url))sourceCache.set(url,loadTexture(loader,url));return sourceCache.get(url);};
  const layersById=new Map(),anchorsByWorldId=new Map(),occluders=[],warnings=[];
  for(const layer of prepared.layers){
    try{
      const source=await sourceFor(layer.src);const texture=maskedTexture(THREE,source,layer.mask);const object=makeLayerObject(THREE,layer,texture);parent.add(object);layersById.set(layer.id,object);
      if(layer.anchorId){if(!anchorsByWorldId.has(layer.anchorId))anchorsByWorldId.set(layer.anchorId,[]);anchorsByWorldId.get(layer.anchorId).push(object);}
      if(layer.occluder){const proxy=layer.proxy||{x:layer.position.x,z:layer.position.z,width:layer.world.width,depth:.7};occluders.push({id:layer.id,...proxy,object,anchorId:layer.anchorId||null,kind:layer.kind});}
    }catch(error){if(layer.required!==false)throw new Error(`required cinematic layer failed: ${layer.id} — ${error?.message||error}`);warnings.push({id:layer.id,error:String(error?.message||error)});}
  }
  for(const id of REQUIRED_LAYER_IDS)if(!layersById.has(id))throw new Error(`required cinematic layer failed to initialize: ${id}`);
  return {layersById,anchorsByWorldId,occluders,warnings,visualEnvelope:prepared.visualEnvelope,manifest,screenStage:{...SCREEN_STAGE},screenLayered:true,setDebugVisible(value){for(const object of layersById.values())object.visible=Boolean(value);},dispose(){for(const object of layersById.values()){parent.remove(object);object.geometry?.dispose?.();const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){if(material?.map!==undefined&&material.map!==sourceCache.get(material.map))material?.map?.dispose?.();material?.dispose?.();}}for(const promise of sourceCache.values())promise.then(texture=>texture.dispose?.()).catch(()=>{});layersById.clear();anchorsByWorldId.clear();occluders.length=0;}};
}
