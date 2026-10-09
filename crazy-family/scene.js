import * as THREE from 'three';

function material(color, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
}

function createBoxMesh(def) {
  const geometry = new THREE.BoxGeometry(def.width, def.height, def.depth);
  const mesh = new THREE.Mesh(geometry, material(def.color ?? 0x9b765f));
  mesh.name = def.id;
  mesh.userData.semanticId = def.id;
  mesh.position.set(def.x, def.y, def.z);
  mesh.castShadow = def.id !== 'floor' && def.id !== 'rug';
  mesh.receiveShadow = true;
  return mesh;
}

function createRug(def) {
  const geometry = new THREE.BoxGeometry(def.width, def.height, def.depth);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.95 }));
  mesh.name = def.id;
  mesh.userData.semanticId = def.id;
  mesh.position.set(def.x, 0.02, def.z);
  mesh.receiveShadow = true;
  return mesh;
}

function addWalls(scene) {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0ddc4, roughness: 0.92 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(12.4, 3.7, 0.16), wallMat);
  back.position.set(0, 1.85, -4.62);
  back.receiveShadow = true;
  back.userData.semanticId = 'back-wall';
  back.userData.cameraBlocker = true;
  scene.add(back);

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.7, 9.2), wallMat);
  left.position.set(-6.08, 1.85, 0);
  left.receiveShadow = true;
  left.userData.semanticId = 'left-wall';
  left.userData.cameraBlocker = true;
  scene.add(left);

  const rightRear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.7, 3.6), wallMat);
  rightRear.position.set(6.08, 1.85, 2.7);
  rightRear.receiveShadow = true;
  rightRear.userData.semanticId = 'right-wall';
  rightRear.userData.cameraBlocker = true;
  scene.add(rightRear);
}

function addRoomDressing(scene) {
  const picture = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.05), material(0x8f654f));
  picture.position.set(-1.5, 2.35, -4.49);
  picture.userData.semanticId = 'family-photo-frame';
  scene.add(picture);

  const drawingMat = new THREE.MeshStandardMaterial({ color: 0xf5e7b6, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const drawing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.36, 0.025), drawingMat);
    drawing.position.set(0.3 + i * 0.55, 2.15 + (i % 2) * 0.14, -4.5);
    drawing.userData.semanticId = `child-drawing-${i + 1}`;
    scene.add(drawing);
  }
}

export function createLivingRoomScene({ canvas, world }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd7c2a8);
  scene.fog = new THREE.Fog(0xd7c2a8, 12, 24);

  const camera = new THREE.PerspectiveCamera(48, 16 / 10, 0.05, 60);
  camera.position.set(0, 4.3, 8.1);
  camera.lookAt(0, 0.9, 0);

  const hemi = new THREE.HemisphereLight(0xfff2d5, 0x5b6372, 1.2);
  scene.add(hemi);

  // warm-window-light: cinematic late-afternoon key shared by room and characters.
  const windowLight = new THREE.DirectionalLight(0xffc98f, 3.1);
  windowLight.name = 'warm-window-light';
  windowLight.userData.semanticId = 'warm-window-light';
  windowLight.position.set(-4.5, 6.4, 3.5);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(2048, 2048);
  windowLight.shadow.camera.left = -8;
  windowLight.shadow.camera.right = 8;
  windowLight.shadow.camera.top = 8;
  windowLight.shadow.camera.bottom = -8;
  scene.add(windowLight);

  // warm-practical-light: lamp glow creates the inhabited-home feel.
  const practical = new THREE.PointLight(0xffb565, 18, 7, 2);
  practical.name = 'warm-practical-light';
  practical.userData.semanticId = 'warm-practical-light';
  practical.position.set(-5.0, 1.75, 0.25);
  practical.castShadow = true;
  scene.add(practical);

  const objectsById = new Map();
  for (const def of world.objects) {
    if (def.id === 'floor') {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(def.width, def.height, def.depth), material(0x9b704c, 0.82));
      floor.name = def.id;
      floor.userData.semanticId = def.id;
      floor.position.set(def.x, -0.04, def.z);
      floor.receiveShadow = true;
      scene.add(floor);
      objectsById.set(def.id, floor);
      continue;
    }
    const mesh = def.id === 'rug' ? createRug(def) : createBoxMesh(def);
    scene.add(mesh);
    objectsById.set(def.id, mesh);
  }

  addWalls(scene);
  addRoomDressing(scene);

  const headphonesGroup = new THREE.Group();
  headphonesGroup.name = 'headphones';
  headphonesGroup.userData.semanticId = 'headphones';
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 24, Math.PI), material(0x30445a, 0.35));
  band.rotation.z = Math.PI;
  band.position.y = 0.09;
  const cupGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.08, 16);
  const cupMat = material(0x243343, 0.32);
  const cupL = new THREE.Mesh(cupGeo, cupMat);
  const cupR = new THREE.Mesh(cupGeo, cupMat);
  cupL.rotation.z = Math.PI / 2;
  cupR.rotation.z = Math.PI / 2;
  cupL.position.set(-0.18, 0, 0);
  cupR.position.set(0.18, 0, 0);
  headphonesGroup.add(band, cupL, cupR);
  headphonesGroup.position.set(-4.15, 1.02, 0.1);
  headphonesGroup.rotation.y = -0.35;
  headphonesGroup.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(headphonesGroup);
  objectsById.set('headphones', headphonesGroup);

  function resize(width, height) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function setObjectOpacity(id, value) {
    const object = objectsById.get(id) || scene.getObjectByName(id);
    if (!object) return false;
    const opacity = Math.max(0, Math.min(1, value));
    object.traverse(node => {
      if (!node.isMesh || !node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const mat of materials) {
        mat.transparent = opacity < 0.999;
        mat.opacity = opacity;
        mat.depthWrite = opacity >= 0.999;
      }
    });
    return true;
  }

  return {
    scene,
    renderer,
    camera,
    objectsById,
    render(cameraLike = camera) {
      if (cameraLike?.isCamera) renderer.render(scene, cameraLike);
      else renderer.render(scene, camera);
    },
    resize,
    setObjectOpacity,
    dispose() {
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose?.();
        const mats = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
        for (const mat of mats) mat.dispose?.();
      });
      renderer.dispose();
    },
  };
}
