import * as THREE from 'three';

export const APPROVED_LIBI_ASSET = 'assets/libi-sprites-v025.png';
export const APPROVED_DAD_ASSET = 'assets/crazy-family/dad-sprites-v028.png';

function assetFor(kind, approvedAssetUrl) {
  if (approvedAssetUrl) return approvedAssetUrl;
  return kind === 'dad' ? APPROVED_DAD_ASSET : APPROVED_LIBI_ASSET;
}

export function createCharacterVisual({ scene, kind, approvedAssetUrl }) {
  const url = assetFor(kind, approvedAssetUrl);
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / 5, 1 / 2);
  texture.offset.set(0, 1 / 2);

  const height = kind === 'dad' ? 1.9 : 1.34;
  const width = kind === 'dad' ? 1.18 : 0.9;
  const geometry = new THREE.PlaneGeometry(width, height);
  geometry.translate(0, height / 2, 0);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.8,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = kind === 'dad' ? 'dad-character' : 'libi-character';
  mesh.userData.semanticId = mesh.name;
  mesh.userData.approvedAssetUrl = url;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  let facing = 1;
  return {
    mesh,
    approvedAssetUrl: url,
    setPose({ position, facing: nextFacing = facing, jumpHeight = 0, state = 'idle' }) {
      facing = nextFacing || facing || 1;
      mesh.position.set(position.x, position.y + jumpHeight, position.z);
      mesh.scale.x = Math.abs(mesh.scale.x) * (facing < 0 ? -1 : 1);
      mesh.userData.state = state;
    },
    faceCamera(cameraPosition) {
      if (!cameraPosition) return;
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
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
