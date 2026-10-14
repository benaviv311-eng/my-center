from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
html = (root / 'crazy-family.html').read_text(encoding='utf-8')
set_js = (root / 'crazy-family' / 'cinematic-set.js').read_text(encoding='utf-8')
projection_js = (root / 'crazy-family' / 'cinematic-projection.js').read_text(encoding='utf-8')
manifest_path = root / 'assets' / 'crazy-family' / 'cinematic-home-v043' / 'manifest.json'
background_path = root / 'assets' / 'crazy-family' / 'cinematic-home-v043' / 'background.webp'

assert 'v0.43' in html, 'v0.43 marker missing from crazy-family.html'
assert 'reference-game-hud' in html, 'reference HUD overlay missing'
assert 'reference-stage-controls' in html, 'stage controls are not embedded in the cinematic frame'
assert 'cinematic-home-v043/manifest.json' in set_js, 'cinematic set does not use the v0.43 manifest'
assert 'REFERENCE_FLOOR_V043' in projection_js, 'reference-floor projection marker missing'
assert manifest_path.exists(), 'v0.43 cinematic manifest missing'
assert background_path.exists(), 'v0.43 cinematic background missing'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
assert str(manifest.get('version', '')).startswith('0.43'), 'manifest version is not v0.43'
assert any(layer.get('src','').endswith('cinematic-home-v043/background.webp') for layer in manifest['layers']), 'manifest does not reference v0.43 background'
assert background_path.stat().st_size > 120_000, 'reference background asset is suspiciously small'
print('v0.43 reference-game contract OK')
