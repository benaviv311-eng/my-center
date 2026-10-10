from pathlib import Path

html = Path('crazy-family.html').read_text(encoding='utf-8')
scene = Path('crazy-family/scene.js').read_text(encoding='utf-8')
camera = Path('crazy-family/camera.js').read_text(encoding='utf-8')

assert 'v0.40' in html, 'page version must advance to v0.40'
assert 'REFERENCE_QUALITY_HOME_V040' in scene, 'reference-quality room marker missing'
assert 'function createProceduralTexture' in scene, 'room needs procedural material detail'
assert 'function createSoftSofa' in scene, 'room needs rounded/soft sofa geometry'
assert 'function createReferenceKitchenDepth' in scene, 'room needs visible kitchen/dining depth'
assert 'function createGoldenHourWindow' in scene, 'room needs cinematic window treatment'
assert 'function createFamilyLifeDetails' in scene, 'room needs lived-in family dressing'
assert "reference-kitchen-depth-v040" in scene, '3D dining/kitchen continuation must be authored from the reference'
assert "assets/crazy-family/reference-room-v040.webp" not in scene, 'reference image must not become a flat in-game background'
assert "renderer.toneMappingExposure = 1.16" in scene, 'reference lighting exposure contract missing'
assert 'renderer.shadowMap.type = THREE.PCFSoftShadowMap' in scene, 'soft shadow contract must remain'
assert "scene.background = new THREE.Color(0xb88668)" in scene, 'warm reference palette missing'
assert "objectsById.set('headphones', headphonesGroup)" in scene, 'canonical headphones interaction must remain'
assert "import * as THREE from 'three'" in scene, 'Three.js room renderer must remain'
assert "exploreOffset: { x: 1.35, y: 1.45, z: 2.75 }" in camera, 'camera must sit inside the living room, not outside the dollhouse'
assert "chaseOffset: { x: 1.7, y: 1.72, z: 3.4 }" in camera, 'chase camera must remain inside the room'
assert "targetHeight: 0.68" in camera, 'camera target height must stay child-scale'

print('PASS: Crazy Family v0.40 reference-quality living-room structural acceptance')
