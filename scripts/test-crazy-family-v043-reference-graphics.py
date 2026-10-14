from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

def require(condition, message):
    if not condition:
        raise AssertionError(message)

html = (ROOT / 'crazy-family.html').read_text(encoding='utf-8')
scene = (ROOT / 'crazy-family' / 'scene.js').read_text(encoding='utf-8')
cinematic = (ROOT / 'crazy-family' / 'cinematic-set.js').read_text(encoding='utf-8')
game = (ROOT / 'crazy-family' / 'game.js').read_text(encoding='utf-8')
characters = (ROOT / 'crazy-family' / 'characters.js').read_text(encoding='utf-8')
scenario = (ROOT / 'crazy-family' / 'scenario.js').read_text(encoding='utf-8')
manifest_path = ROOT / 'assets' / 'crazy-family' / 'cinematic-home-v043' / 'manifest.json'
background_path = ROOT / 'assets' / 'crazy-family' / 'cinematic-home-v043' / 'background.webp'

require('v0.43' in html, 'v0.43 marker missing from game page')
require('REFERENCE_GRAPHICS_V043' in scene, 'v0.43 reference graphics marker missing from scene')
require('cinematic-home-v043/manifest.json' in scene, 'scene is not loading the v0.43 cinematic manifest')
require('cinematic-home-v043/manifest.json' in cinematic, 'cinematic set default is not v0.43')
require('reference-game-hud-v043' in html, 'reference-style in-game HUD is not mounted inside the stage')
require('mobile-game-controls-v043' in html, 'reference-style in-game controls are not mounted inside the stage')
require('createScenario' in game and 'applyScenarioToWorld' in game, 'dynamic scenario system is no longer wired')
require('SCENARIO_SPAWNS_V041' in game, 'dynamic scenario contract marker disappeared')
require("assets/libi-sprites-v025.png" in characters, 'canonical Libi asset changed')
require("assets/crazy-family/dad-sprites-v028.png" in characters, 'canonical Dad asset changed')
require('APPROVED_LIBI_ASSET' in game and 'APPROVED_DAD_ASSET' in game, 'canonical character assets are not used by the game')
require(manifest_path.exists(), 'v0.43 cinematic manifest missing')
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
require(manifest.get('version') == '0.43-reference-graphics', 'unexpected v0.43 manifest version')
required = {'cinematic-background','cinematic-sofa','cinematic-coffee-table'}
layer_ids = {layer.get('id') for layer in manifest.get('layers', [])}
require(required <= layer_ids, 'required cinematic layers are missing')
for layer in manifest.get('layers', []):
    require('cinematic-home-v043/background.webp' in layer.get('src',''), f"layer {layer.get('id')} is not derived from the approved v0.43 master")
require(background_path.exists(), 'approved v0.43 clean room master missing')
require(background_path.stat().st_size > 250_000, 'v0.43 room master is suspiciously small')
require('מרדף' not in html and 'chase' not in manifest_path.read_text(encoding='utf-8').lower(), 'a chase/reference composite was baked into production')

print('Crazy Family v0.43 reference graphics contract: PASS')
