from pathlib import Path

# Task 1 green checkpoint: modular runtime shell + explicit legacy rollback.
root = Path('.')
html = (root / 'crazy-family.html').read_text(encoding='utf-8')
bootstrap = root / 'crazy-family' / 'bootstrap.js'
game = root / 'crazy-family' / 'game.js'
adapter = root / 'crazy-family' / 'legacy-adapter.js'

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
print('PASS: crazy-family movie-set runtime shell')
