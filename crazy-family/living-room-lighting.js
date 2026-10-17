export function createLivingRoomLighting({THREE,scene,world,quality='high'}={}){
  if(!THREE?.Group||!THREE?.HemisphereLight||!THREE?.DirectionalLight||!THREE?.PointLight)throw new Error('THREE lighting primitives are required');
  if(!scene?.add)throw new Error('scene is required');
  if(!world)throw new Error('world is required');

  const root=new THREE.Group();
  root.name='living-room-lighting';
  root.userData.quality=quality;

  const fill=new THREE.HemisphereLight(0xfff2e6,0x5a5361,1.35);
  fill.name='living-room-hemisphere';

  const keyLight=new THREE.DirectionalLight(0xffc88d,2.0);
  keyLight.name='living-room-key';
  keyLight.position.set(-4.2,7.4,5.1);
  keyLight.castShadow=true;
  const shadowSize=quality==='medium'?512:1024;
  keyLight.shadow.mapSize.set(shadowSize,shadowSize);
  keyLight.shadow.camera.near=.1;
  keyLight.shadow.camera.far=24;
  keyLight.shadow.camera.left=-7;
  keyLight.shadow.camera.right=7;
  keyLight.shadow.camera.top=6;
  keyLight.shadow.camera.bottom=-6;
  keyLight.shadow.bias=-.00035;
  keyLight.shadow.normalBias=.025;

  const lampDef=(world.objects||[]).find(object=>object.id==='lamp');
  const lampLight=new THREE.PointLight(0xffb56b,5.2,4.4,2);
  lampLight.name='living-room-lamp-light';
  lampLight.position.set(Number(lampDef?.x)??-5.05,(Number(lampDef?.y)||.875)+.42,Number(lampDef?.z)??.25);
  lampLight.castShadow=false;

  root.add(fill,keyLight,lampLight);
  scene.add(root);

  let disposed=false;
  return{
    root,
    keyLight,
    lampLight,
    dispose(){if(disposed)return;disposed=true;scene.remove?.(root);},
  };
}
