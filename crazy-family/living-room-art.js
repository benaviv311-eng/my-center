import { createRoundedBoxGeometry } from './stylized-geometry.js';

const ART_MODE='stylized-final-v1';
function cloneTransform(root){return{position:root.position.clone(),rotation:root.rotation.clone(),scale:root.scale.clone()};}
function mesh(THREE,geometry,material,name){const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;return m;}
function rounded(THREE,materials,name,w,h,d,materialName,radius=.06){return mesh(THREE,createRoundedBoxGeometry(THREE,{width:w,height:h,depth:d,radius,curveSegments:4}),materials.get(materialName),name);}
function group(THREE,name){const g=new THREE.Group();g.name=name;return g;}
function add(parent,node,x=0,y=0,z=0){node.position.set(x,y,z);parent.add(node);return node;}
function applyShadowConfig(root){root.traverse?.(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});}
function normalizeRoot(root,def){root.name=def.id;root.position.set(Number(def.x)||0,Number(def.y)||0,Number(def.z)||0);root.userData={...(root.userData||{}),semanticId:def.id,artMode:ART_MODE};applyShadowConfig(root);root.userData.baseTransform=cloneTransform(root);return root;}
function dims(def){return{w:Math.max(.02,Number(def.width)||.02),h:Math.max(.02,Number(def.height)||.02),d:Math.max(.02,Number(def.depth)||.02)};}

function buildFloor(THREE,materials,def){const{w,h,d}=dims(def),g=group(THREE,def.id);const m=rounded(THREE,materials,'floor-surface',w,h,d,'floorWood',.015);m.castShadow=false;add(g,m);return g;}
function buildRug(THREE,materials,def){const{w,h,d}=dims(def),g=group(THREE,def.id);const m=rounded(THREE,materials,'rug-textile',w,h,d,'rug',Math.min(.04,h*.45));m.castShadow=false;add(g,m);return g;}
function buildWall(THREE,materials,def){
  const{w,h,d}=dims(def),g=group(THREE,def.id);const wall=rounded(THREE,materials,'wall-plaster',w,h,d,'wall',.035);wall.castShadow=false;add(g,wall);
  const horizontal=w>d;const bw=horizontal?w*.985:Math.min(.11,w*.85),bd=horizontal?Math.min(.11,d*.85):d*.985;
  const trim=rounded(THREE,materials,'wall-baseboard',bw,.11,bd,'furnitureWood',.018);trim.castShadow=false;add(g,trim,0,-h/2+.065,0);
  const rail=rounded(THREE,materials,'wall-chair-rail',horizontal?w*.975:Math.min(.08,w*.8),.045,horizontal?Math.min(.07,d*.8):d*.975,'furnitureWood',.012);rail.castShadow=false;add(g,rail,0,-h*.08,0);
  return g;
}
function buildSofa(THREE,materials,def){
  const{w,h,d}=dims(def),g=group(THREE,def.id);
  add(g,rounded(THREE,materials,'sofa-base',w*.94,h*.33,d*.91,'sofaFabric',.11),0,-h*.29,0);
  add(g,rounded(THREE,materials,'sofa-back',w*.88,h*.50,d*.22,'sofaFabric',.1),0,h*.19,d*.33);
  for(const side of[-1,1])add(g,rounded(THREE,materials,`sofa-arm-${side<0?'left':'right'}`,w*.12,h*.58,d*.86,'sofaFabric',.1),side*w*.43,-h*.02,0);
  for(let i=0;i<3;i++)add(g,rounded(THREE,materials,`sofa-seat-${i+1}`,w*.255,h*.15,d*.63,'cushionWarm',.07),(i-1)*w*.285,-h*.08,-d*.08);
  for(let i=0;i<3;i++){const back=rounded(THREE,materials,`sofa-back-cushion-${i+1}`,w*.245,h*.34,d*.16,i===1?'cushionCool':'cushionWarm',.08);back.rotation.x=-.12;add(g,back,(i-1)*w*.28,h*.16,d*.23);}
  for(const sx of[-1,1])for(const sz of[-1,1])add(g,rounded(THREE,materials,'sofa-foot',.12,.13,.12,'furnitureWood',.025),sx*w*.36,-h*.47,sz*d*.29);
  return g;
}
function buildTable(THREE,materials,def,compact=false){
  const{w,h,d}=dims(def),g=group(THREE,def.id);add(g,rounded(THREE,materials,`${def.id}-top`,w*.96,h*.19,d*.94,'furnitureWood',.055),0,h*.36,0);
  const legW=Math.min(compact?.14:.18,w*.18),legD=Math.min(compact?.14:.18,d*.18),legH=h*.72;for(const sx of[-1,1])for(const sz of[-1,1])add(g,rounded(THREE,materials,`${def.id}-leg`,legW,legH,legD,'furnitureWood',.035),sx*w*.36,-h*.09,sz*d*.34);
  if(!compact)add(g,rounded(THREE,materials,`${def.id}-lower-shelf`,w*.68,h*.08,d*.62,'furnitureWood',.035),0,-h*.15,0);
  return g;
}
function buildLamp(THREE,materials,def){const{h}=dims(def),g=group(THREE,def.id);const base=mesh(THREE,new THREE.CylinderGeometry(.20,.24,.10,20),materials.get('metal'),'lamp-base');add(g,base,0,-h*.47,0);const stem=mesh(THREE,new THREE.CylinderGeometry(.035,.045,h*.63,14),materials.get('metal'),'lamp-stem');add(g,stem,0,-h*.12,0);const shade=mesh(THREE,new THREE.CylinderGeometry(.15,.28,h*.22,24,1,true),materials.get('lampShade'),'lamp-shade');add(g,shade,0,h*.30,0);const glow=mesh(THREE,new THREE.SphereGeometry(.095,18,12),materials.get('lampGlow'),'lamp-glow');glow.castShadow=false;add(g,glow,0,h*.27,0);return g;}
function buildDoorway(THREE,materials,def){
  const{w,h,d}=dims(def),g=group(THREE,def.id),postW=Math.min(.18,w*.16);
  const opening=rounded(THREE,materials,'doorway-shadow',w*.72,h*.76,d*.72,'tvScreen',.025);opening.castShadow=false;add(g,opening,0,-h*.08,-d*.10);
  for(const side of[-1,1])add(g,rounded(THREE,materials,`door-post-${side<0?'left':'right'}`,postW,h,d*1.35,'furnitureWood',.025),side*(w/2-postW/2),0,0);
  add(g,rounded(THREE,materials,'door-header',w,.18,d*1.35,'furnitureWood',.025),0,h/2-.09,0);
  const threshold=rounded(THREE,materials,'door-threshold',w*.92,.045,d*1.8,'furnitureWood',.012);threshold.castShadow=false;add(g,threshold,0,-h/2+.025,0);return g;
}
function buildCushion(THREE,materials,def){const{w,h,d}=dims(def),g=group(THREE,def.id),mat=def.id==='cushion-b'?'cushionCool':'cushionWarm';const c=rounded(THREE,materials,`${def.id}-fabric`,w,h,d,mat,.09);c.rotation.z=def.id==='cushion-a'?.08:-.06;c.rotation.x=-.08;add(g,c,0,.31,.08);return g;}
function buildToyBall(THREE,materials,def){const{w}=dims(def),g=group(THREE,def.id);add(g,mesh(THREE,new THREE.SphereGeometry(w*.5,24,18),materials.get('toyPlastic'),'toy-ball-sphere'));return g;}
function buildToyBlocks(THREE,materials,def){const{w,h,d}=dims(def),g=group(THREE,def.id),s=Math.min(w,d)*.27;const coords=[[-.25,-.22], [.05,-.18],[.27,.04],[-.08,.18],[.20,.22]];coords.forEach(([x,z],i)=>{const block=rounded(THREE,materials,`toy-block-${i+1}`,s,h*.72,s,'toyPlastic',.035);block.rotation.y=i*.31;add(g,block,x*w,0,z*d);});return g;}
function buildGeneric(THREE,materials,def){const{w,h,d}=dims(def),g=group(THREE,def.id);const mat=def.kind==='wall'?'wall':def.kind==='floor'?'floorWood':def.kind==='surface'?'rug':def.kind==='prop'?'toyPlastic':'furnitureWood';add(g,rounded(THREE,materials,`${def.id}-fallback`,w,h,d,mat,Math.min(.06,w*.15,h*.15,d*.15)));return g;}
function proceduralBuilder(THREE,materials,def){if(def.id==='floor'||def.material==='wood')return buildFloor(THREE,materials,def);if(def.id==='rug'||def.material==='rug')return buildRug(THREE,materials,def);if(def.kind==='wall')return buildWall(THREE,materials,def);if(def.id==='sofa')return buildSofa(THREE,materials,def);if(def.id==='coffee-table')return buildTable(THREE,materials,def,false);if(def.id==='side-table')return buildTable(THREE,materials,def,true);if(def.id==='lamp')return buildLamp(THREE,materials,def);if(def.id==='doorway')return buildDoorway(THREE,materials,def);if(def.id==='cushion-a'||def.id==='cushion-b')return buildCushion(THREE,materials,def);if(def.id==='toy-ball')return buildToyBall(THREE,materials,def);if(def.id==='toy-blocks')return buildToyBlocks(THREE,materials,def);return buildGeneric(THREE,materials,def);}
function addDressing(THREE,materials,dressingRoot){
  const bookStack=group(THREE,'dressing-books');for(let i=0;i<3;i++){const b=rounded(THREE,materials,`book-${i}`,0.46,.055,.31,i===1?'cushionCool':'cushionWarm',.018);b.rotation.y=(i-1)*.08;add(bookStack,b,0,i*.06,0);}bookStack.position.set(-5.05,.12,2.75);dressingRoot.add(bookStack);
  const basket=group(THREE,'dressing-basket');add(basket,rounded(THREE,materials,'basket-body',.68,.38,.52,'furnitureWood',.09));basket.position.set(4.75,.21,3.42);dressingRoot.add(basket);
  const frame=group(THREE,'dressing-frame');add(frame,rounded(THREE,materials,'frame-panel',.76,.56,.07,'furnitureWood',.025));add(frame,rounded(THREE,materials,'frame-inner',.58,.38,.075,'cushionCool',.018),0,0,-.01);frame.position.set(1.8,1.62,-4.53);dressingRoot.add(frame);

  const windowGroup=group(THREE,'dressing-window');
  const glass=rounded(THREE,materials,'window-glass',.045,1.42,2.28,'windowGlass',.018);glass.castShadow=false;add(windowGroup,glass);
  for(const y of[-.72,.72])add(windowGroup,rounded(THREE,materials,'window-rail',.09,.09,2.48,'furnitureWood',.016),0,y,0);
  for(const z of[-1.18,0,1.18])add(windowGroup,rounded(THREE,materials,'window-mullion',.09,1.52,.09,'furnitureWood',.016),0,0,z);
  for(const z of[-1.47,1.47]){const curtain=rounded(THREE,materials,'window-curtain',.12,1.58,.48,'curtainFabric',.045);curtain.rotation.x=z<0?-.03:.03;add(windowGroup,curtain,.08,0,z);}
  add(windowGroup,rounded(THREE,materials,'window-valance',.13,.15,3.18,'curtainFabric',.035),.08,.82,0);
  windowGroup.position.set(-5.88,1.78,-1.65);dressingRoot.add(windowGroup);

  const consoleGroup=group(THREE,'dressing-console');
  add(consoleGroup,rounded(THREE,materials,'console-body',2.15,.52,.34,'furnitureWood',.065),0,0,0);
  add(consoleGroup,rounded(THREE,materials,'console-top',2.28,.09,.42,'furnitureWood',.035),0,.30,.02);
  for(const x of[-.82,.82])add(consoleGroup,rounded(THREE,materials,'console-foot',.12,.22,.12,'metal',.025),x,-.34,0);
  for(const x of[-.52,.52])add(consoleGroup,rounded(THREE,materials,'console-handle',.18,.035,.045,'metal',.012),x,.03,.19);
  add(consoleGroup,rounded(THREE,materials,'tv-frame',1.72,.96,.10,'furnitureWood',.035),0,1.02,-.10);
  const screen=rounded(THREE,materials,'tv-screen',1.56,.80,.105,'tvScreen',.025);screen.castShadow=false;add(consoleGroup,screen,0,1.02,-.105);
  consoleGroup.position.set(1.25,.39,-4.40);dressingRoot.add(consoleGroup);

  const plantGroup=group(THREE,'dressing-plant');
  const pot=mesh(THREE,new THREE.CylinderGeometry(.27,.22,.42,20),materials.get('ceramic'),'plant-pot');add(plantGroup,pot,0,.21,0);
  const stem=mesh(THREE,new THREE.CylinderGeometry(.025,.035,.68,10),materials.get('furnitureWood'),'plant-stem');add(plantGroup,stem,0,.72,0);
  const leafPositions=[[-.18,.78,0],[.16,.86,.08],[-.08,1.02,-.08],[.22,1.08,-.02],[0,1.20,.08]];
  leafPositions.forEach(([x,y,z],i)=>{const leaf=mesh(THREE,new THREE.SphereGeometry(.20-(i%2)*.025,14,10),materials.get('plantLeaf'),`plant-leaf-${i+1}`);leaf.scale.set?.(1.15,.72,.82);add(plantGroup,leaf,x,y,z);});
  plantGroup.position.set(-5.10,0,-3.62);dressingRoot.add(plantGroup);
}

export async function createLivingRoomArt({THREE,world,materials,quality='high',resolveAsset=null}={}){
  if(!THREE?.Group||!world||!materials?.get)throw new Error('THREE, world and materials are required');
  const root=group(THREE,'living-room-final-art');root.userData.artMode=ART_MODE;root.userData.quality=quality;root.userData.assetFallbacks=[];
  const dressingRoot=group(THREE,'living-room-dressing');root.add(dressingRoot);const objectsById=new Map();const source=world.renderables||[...(world.objects||[]),...(world.roomShell||[])];
  for(const def of source){if(!def?.id||objectsById.has(def.id))continue;let object=null;if(resolveAsset){try{object=await resolveAsset(def.id,def);}catch(error){root.userData.assetFallbacks.push({id:def.id,message:error?.message||String(error)});}}
    if(!object)object=proceduralBuilder(THREE,materials,def);normalizeRoot(object,def);root.add(object);objectsById.set(def.id,object);
  }
  addDressing(THREE,materials,dressingRoot);
  let disposed=false;
  return{root,dressingRoot,objectsById,resolveArtObject(id){return objectsById.get(id)||null;},dispose(){if(disposed)return;disposed=true;root.traverse?.(node=>node.geometry?.dispose?.());}};
}
