import * as THREE from 'three';

export const APPROVED_LIBI_ASSET = 'assets/libi-sprites-v025.png';
export const APPROVED_DAD_ASSET = 'assets/crazy-family/dad-sprites-v028.png';

function assetFor(kind, approvedAssetUrl) {
  if (approvedAssetUrl) return approvedAssetUrl;
  return kind === 'dad' ? APPROVED_DAD_ASSET : APPROVED_LIBI_ASSET;
}

function createSpriteTexture(url) {
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / 5, 1 / 2);
  texture.offset.set(0, 1 / 2);
  return texture;
}

function createCanonicalMaterial(texture) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.8,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

function createCinematicSprite({ texture, width, height, kind, url }) {
  const geometry = new THREE.PlaneGeometry(width, height);
  geometry.translate(0, height / 2, 0);
  const material = createCanonicalMaterial(texture);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = kind === 'dad' ? 'dad-character' : 'libi-character';
  mesh.userData.semanticId = mesh.name;
  mesh.userData.approvedAssetUrl = url;
  mesh.userData.renderMode = 'canonical-sprite';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, geometries: [geometry], materials: [material], depth: 0 };
}

function createCanonical3DStack({ texture, width, height, kind, url }) {
  // Preserve the approved art pixel-for-pixel while giving it real world-space depth.
  // This is intentionally a canonical volumetric first pass, not a redesigned character model.
  const depth = kind === 'dad' ? 0.20 : 0.14;
  const layerCount = 7;
  const group = new THREE.Group();
  group.name = kind === 'dad' ? 'dad-character' : 'libi-character';
  group.userData.semanticId = group.name;
  group.userData.approvedAssetUrl = url;
  group.userData.renderMode = 'canonical-3d-stack';
  group.userData.depth = depth;

  const geometries = [];
  const materials = [];
  for (let index = 0; index < layerCount; index += 1) {
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.translate(0, height / 2, 0);
    const material = createCanonicalMaterial(texture);
    const layer = new THREE.Mesh(geometry, material);
    const t = layerCount === 1 ? 0.5 : index / (layerCount - 1);
    layer.position.z = THREE.MathUtils.lerp(-depth / 2, depth / 2, t);
    layer.name = `${group.name}-depth-${index + 1}`;
    layer.userData.canonicalDepthLayer = index;
    layer.castShadow = true;
    layer.receiveShadow = true;
    group.add(layer);
    geometries.push(geometry);
    materials.push(material);
  }

  // A non-rendered depth proxy makes the volumetric envelope explicit for diagnostics
  // without covering or recoloring the approved character artwork.
  const depthProxyGeometry = new THREE.BoxGeometry(width * 0.64, height * 0.86, depth);
  depthProxyGeometry.translate(0, height * 0.46, 0);
  const depthProxyMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const depthProxy = new THREE.Mesh(depthProxyGeometry, depthProxyMaterial);
  depthProxy.name = `${group.name}-depth-proxy`;
  depthProxy.userData.canonicalDepthProxy = true;
  group.add(depthProxy);
  geometries.push(depthProxyGeometry);
  materials.push(depthProxyMaterial);

  return { mesh: group, geometries, materials, depth };
}

export function createCharacterVisual({ scene, kind, approvedAssetUrl }) {
  const url = assetFor(kind, approvedAssetUrl);
  const texture = createSpriteTexture(url);
  const height = kind === 'dad' ? 1.9 : 1.34;
  const width = kind === 'dad' ? 1.18 : 0.9;
  const isWorld3D = scene?.name === 'world3d-stage';
  const visual = isWorld3D
    ? createCanonical3DStack({ texture, width, height, kind, url })
    : createCinematicSprite({ texture, width, height, kind, url });
  const mesh = visual.mesh;
  scene.add(mesh);

  let facing = 1;
  return {
    mesh,
    approvedAssetUrl: url,
    depth: visual.depth,
    setPose({ position, facing: nextFacing = facing, jumpHeight = 0, state = 'idle' }) {
      facing = nextFacing || facing || 1;
      mesh.position.set(position.x, position.y + jumpHeight, position.z);
      mesh.scale.x = Math.abs(mesh.scale.x) * (facing < 0 ? -1 : 1);
      mesh.userData.state = state;
    },
    faceCamera(cameraPosition) {
      if (isWorld3D || !cameraPosition) return;
      const target = new THREE.Vector3(cameraPosition.x, mesh.position.y + height * 0.45, cameraPosition.z);
      mesh.lookAt(target);
    },
    setVisible(value) { mesh.visible = Boolean(value); },
    setFrame(frame = 0) {
      const clamped = Math.max(0, Math.min(9, Math.floor(frame)));
      texture.offset.x = (clamped % 5) / 5;
      texture.offset.y = Math.floor(clamped / 5) === 0 ? 1 / 2 : 0;
    },
    dispose() {
      scene.remove(mesh);
      for (const geometry of visual.geometries) geometry.dispose();
      for (const material of visual.materials) material.dispose();
      texture.dispose();
    },
  };
}
