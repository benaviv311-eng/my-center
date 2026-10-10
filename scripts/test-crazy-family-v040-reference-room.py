from pathlib import Path

html = Path('crazy-family.html').read_text(encoding='utf-8')
scene = Path('crazy-family/scene.js').read_text(encoding='utf-8')
camera = Path('crazy-family/camera.js').read_text(encoding='utf-8')
asset = Path('assets/crazy-family/reference-room-v040.webp')

assert asset.exists(), 'clean environment-only reference asset missing'
assert asset.stat().st_size > 100_000, 'reference asset is unexpectedly small'
assert 'v0.40' in html, 'page version must advance to v0.40'
assert 'REFERENCE_QUALITY_HOME_V040' in scene, 'reference-quality room marker missing'
assert 'function createProceduralTexture' in scene, 'room needs procedural material detail'
assert 'function createSoftSofa' in scene, 'room needs rounded/soft sofa geometry'
assert 'function createReferenceKitchenDepth' in scene, 'room needs visible kitchen/dining depth'
assert 'function createGoldenHourWindow' in scene, 'room needs cinematic window treatment'
assert 'function createFamilyLifeDetails' in scene, 'room needs lived-in family dressing'
assert "assets/crazy-family/reference-room-v040.webp" in scene, 'clean reference matte must be wired into the room'
assert "renderer.toneMappingExposure = 1.16" in scene, 'reference lighting exposure contract missing'
assert 'renderer.shadowMap.type = THREE.PCFSoftShadowMap' in scene, 'soft shadow contract must remain'
assert "scene.background = new THREE.Color(0xb88668)" in scene, 'warm reference palette missing'
assert "objectsById.set('headphones', headphonesGroup)" in scene, 'canonical headphones interaction must remain'
assert "import * as THREE from 'three'" in scene, 'Three.js room renderer must remain'
assert "exploreOffset: { x: 1.9, y: 2.05, z: 4.5 }" in camera, 'camera must move down into the room'
assert "targetHeight: 0.72" in camera, 'camera target height must stay child-scale'

print('PASS: Crazy Family v0.40 reference-quality living-room structural acceptance')
