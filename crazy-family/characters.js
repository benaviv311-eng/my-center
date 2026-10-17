import * as THREE from 'three';
import { getCanonicalCharacter, APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET } from './character-canon.js';

export { APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET };

export function createCharacterVisual(options = {}) {
  if ('approvedAssetUrl' in options || 'assetUrl' in options || 'asset' in options) {
    throw new Error('Character canon is locked. Use an explicit canonical-character update instead of a runtime asset override.');
  }

  const { scene, kind } = options;
  const canonical = getCanonicalCharacter(kind);
  const url = canonical.asset;
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / canonical.spriteColumns, 1 / canonical.spriteRows);
  texture.offset.set(0, 1 / canonical.spriteRows);

  const height = canonical.height;
  const width = canonical.width;
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
  mesh.userData.canonicalAssetUrl = url;
  mesh.userData.characterCanonVersion = canonical.version;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  let facing = 1;
  return {
    mesh,
    canonicalAssetUrl: url,
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
      const frameCount = canonical.spriteColumns * canonical.spriteRows;
      const clamped = Math.max(0, Math.min(frameCount - 1, Math.floor(frame)));
      texture.offset.x = (clamped % canonical.spriteColumns) / canonical.spriteColumns;
      texture.offset.y = Math.floor(clamped / canonical.spriteColumns) === 0 ? 1 / canonical.spriteRows : 0;
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
