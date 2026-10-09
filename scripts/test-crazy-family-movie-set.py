from pathlib import Path

root = Path('.')
html = (root / 'crazy-family.html').read_text(encoding='utf-8')
bootstrap = root / 'crazy-family' / 'bootstrap.js'
game = root / 'crazy-family' / 'game.js'
adapter = root / 'crazy-family' / 'legacy-adapter.js'
world = root / 'crazy-family' / 'world.js'
scene = root / 'crazy-family' / 'scene.js'
characters = root / 'crazy-family' / 'characters.js'

checks = {
    'three_import_map': 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js' in html,
    'module_bootstrap': 'crazy-family/bootstrap.js' in html,
    'movie_set_root': 'movieSetRoot' in html,
    'explicit_legacy': 'legacy=1' in html,
    'libi_asset_preserved': 'assets/libi-sprites-v025.png' in html,
    'dad_asset_preserved': 'assets/crazy-family/dad-sprites-v028.png' in html,
    'bootstrap_exists': bootstrap.exists(),
    'game_exists': game.exists(),
    'adapter_exists': adapter.exists(),
    'world_exists': world.exists(),
    'scene_exists': scene.exists(),
    'characters_exists': characters.exists(),
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('FAIL movie-set shell: ' + ', '.join(failed))

boot_text = bootstrap.read_text(encoding='utf-8')
adapter_text = adapter.read_text(encoding='utf-8')
for marker in ['shouldUseLegacy', 'bootCrazyFamily', 'renderUnsupported']:
    if marker not in boot_text:
        raise SystemExit(f'FAIL bootstrap export marker: {marker}')
for marker in ['getSnapshot', 'setWorldPose', 'collectItem', 'useItem', 'damagePlayer', 'setDadWorldDistance', 'tickRetainedSystems']:
    if marker not in adapter_text:
        raise SystemExit(f'FAIL legacy adapter method marker: {marker}')

world_text = world.read_text(encoding='utf-8')
scene_text = scene.read_text(encoding='utf-8')
characters_text = characters.read_text(encoding='utf-8')
for semantic_id in ['floor', 'sofa', 'coffee-table', 'rug', 'toy-ball', 'doorway', 'headphones']:
    if semantic_id not in world_text:
        raise SystemExit(f'FAIL world semantic id: {semantic_id}')
for marker in ['warm-window-light', 'warm-practical-light', 'shadowMap.enabled']:
    if marker not in scene_text:
        raise SystemExit(f'FAIL scene marker: {marker}')
for asset in ['assets/libi-sprites-v025.png', 'assets/crazy-family/dad-sprites-v028.png']:
    if asset not in characters_text:
        raise SystemExit(f'FAIL approved character asset: {asset}')
print('PASS: crazy-family movie-set runtime shell + living room scene')
