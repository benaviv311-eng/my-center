from pathlib import Path

root = Path('.')
html = (root / 'crazy-family.html').read_text(encoding='utf-8')
scene = (root / 'crazy-family' / 'scene.js').read_text(encoding='utf-8')
characters = (root / 'crazy-family' / 'characters.js').read_text(encoding='utf-8')

checks = {
    'version_v038': 'v0.38' in html,
    'dad_24_songs_preserved': '24 שירי שטות' in html,
    'cinematic_room_marker': 'CINEMATIC_LIVING_ROOM_V038' in scene,
    'wood_floor_builder': 'createWoodFloor' in scene,
    'sofa_builder': 'createSofaSet' in scene,
    'coffee_table_builder': 'createCoffeeTableSet' in scene,
    'window_builder': 'createWindowSet' in scene,
    'lamp_builder': 'createLampSet' in scene,
    'room_detail_builder': 'createRoomDetails' in scene,
    'window_frame': 'window-frame' in scene,
    'window_glass': 'window-glass' in scene,
    'curtains': 'curtain-left' in scene and 'curtain-right' in scene,
    'baseboards': 'baseboard-back' in scene and 'baseboard-left' in scene,
    'plant': 'plant-pot' in scene and 'plant-leaves' in scene,
    'books': 'books-stack' in scene,
    'blanket': 'sofa-blanket' in scene,
    'coffee_table_parts': 'coffee-table-top' in scene and 'coffee-table-leg' in scene,
    'approved_libi_unchanged': 'assets/libi-sprites-v025.png' in characters,
    'approved_dad_unchanged': 'assets/crazy-family/dad-sprites-v028.png' in characters,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('FAIL v0.38 cinematic room: ' + ', '.join(failed))

print('PASS: Crazy Family v0.38 cinematic living-room acceptance')
