from pathlib import Path

root = Path('.')
html = (root / 'crazy-family.html').read_text(encoding='utf-8')
module_paths = {
    'bootstrap': root / 'crazy-family' / 'bootstrap.js',
    'game': root / 'crazy-family' / 'game.js',
    'adapter': root / 'crazy-family' / 'legacy-adapter.js',
    'world': root / 'crazy-family' / 'world.js',
    'scene': root / 'crazy-family' / 'scene.js',
    'characters': root / 'crazy-family' / 'characters.js',
    'input': root / 'crazy-family' / 'input.js',
    'movement': root / 'crazy-family' / 'movement.js',
    'camera': root / 'crazy-family' / 'camera.js',
    'interaction': root / 'crazy-family' / 'interaction.js',
    'navigation': root / 'crazy-family' / 'navigation.js',
    'dad': root / 'crazy-family' / 'dad.js',
    'attacks': root / 'crazy-family' / 'attacks.js',
    'attack_visuals': root / 'crazy-family' / 'attack-visuals.js',
    'audio': root / 'crazy-family' / 'audio.js',
    'reactive_props': root / 'crazy-family' / 'reactive-props.js',
}

checks = {
    'three_import_map': 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js' in html,
    'module_bootstrap': 'crazy-family/bootstrap.js' in html,
    'movie_set_root': 'movieSetRoot' in html,
    'default_movie_set_mode': "document.body.classList.add('movie-set-mode')" in html,
    'legacy_is_explicit': "get('legacy')==='1'" in html and '?legacy=1' in html,
    'legacy_canvas_hidden_by_default': "legacyCanvas.hidden=true" in html,
    'legacy_runtime_guarded': 'if(__crazyFamilyLegacyMode){' in html,
    'hud_lives_preserved': 'id="lives"' in html,
    'hud_stamina_preserved': 'id="stamina"' in html,
    'hud_shield_preserved': 'id="shield"' in html,
    'hud_dizzy_preserved': 'id="dizzyMeter"' in html,
    'action_button_preserved': 'id="action"' in html,
    'run_button_preserved': 'id="run"' in html,
    'jump_button_preserved': 'id="jump"' in html,
    'crouch_button_preserved': 'id="crouch"' in html,
    'item_button_preserved': 'id="itemUse"' in html,
    'dpad_preserved': 'data-key="ArrowUp"' in html and 'data-key="ArrowDown"' in html,
    'libi_asset_preserved': 'assets/libi-sprites-v025.png' in html,
    'dad_asset_preserved': 'assets/crazy-family/dad-sprites-v028.png' in html,
    **{f'{name}_exists': path.exists() for name, path in module_paths.items()},
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('FAIL movie-set vertical slice: ' + ', '.join(failed))

texts = {name: path.read_text(encoding='utf-8') for name, path in module_paths.items()}
for marker in ['shouldUseLegacy', 'bootCrazyFamily', 'renderUnsupported']:
    if marker not in texts['bootstrap']:
        raise SystemExit(f'FAIL bootstrap export marker: {marker}')
for marker in ['getSnapshot', 'setWorldPose', 'collectItem', 'useItem', 'damagePlayer', 'setDadWorldDistance', 'setDadSpatial', 'applyDadSongExposure', 'tickRetainedSystems']:
    if marker not in texts['adapter']:
        raise SystemExit(f'FAIL legacy adapter method marker: {marker}')

for semantic_id in ['floor', 'sofa', 'coffee-table', 'rug', 'toy-ball', 'doorway', 'headphones']:
    if semantic_id not in texts['world']:
        raise SystemExit(f'FAIL world semantic id: {semantic_id}')
for marker in ['warm-window-light', 'warm-practical-light', 'shadowMap.enabled', 'applyReactiveTransforms', 'setOccluders']:
    if marker not in texts['scene']:
        raise SystemExit(f'FAIL scene marker: {marker}')
for asset in ['assets/libi-sprites-v025.png', 'assets/crazy-family/dad-sprites-v028.png']:
    if asset not in texts['characters']:
        raise SystemExit(f'FAIL approved character asset: {asset}')
for event in ['toy-kick', 'sofa-compress', 'dad-pant-near-furniture', 'sneeze-small', 'sneeze-mega']:
    if event not in texts['reactive_props']:
        raise SystemExit(f'FAIL room reaction: {event}')
for surface in ['rug', 'wood', 'tile', 'sofa']:
    if surface not in texts['reactive_props'] or surface not in texts['world']:
        raise SystemExit(f'FAIL surface cue mapping: {surface}')

# Default 3D runtime must bind the existing on-page control surface itself.
game_text = texts['game']
for control_marker in ["querySelectorAll('[data-key]')", "getElementById('run')", "getElementById('jump')", "getElementById('crouch')", "getElementById('itemUse')"]:
    if control_marker not in game_text:
        raise SystemExit(f'FAIL default 3D control binding: {control_marker}')

# The new runtime must own all spatial systems; legacy is only a retained-state/audio adapter.
for import_marker in ['./movement.js', './camera.js', './interaction.js', './dad.js', './attacks.js', './audio.js', './reactive-props.js']:
    if import_marker not in game_text:
        raise SystemExit(f'FAIL game module integration: {import_marker}')

print('PASS: crazy-family playable movie set vertical slice structural acceptance')
