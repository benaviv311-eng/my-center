from pathlib import Path

html = Path('crazy-family.html').read_text(encoding='utf-8')

required = [
    'v0.31',
    'STAGE1_SIDE_SCROLL_V031',
    'STAGE1_FLOOR_Y',
    'STAGE1_GRAVITY',
    'player.z',
    'player.vz',
    'player.vx',
    'dad.vx',
    'stage1HorizontalIntent',
    'updateStage1Kinematics',
    'drawGroundShadow',
    'drawStage1Foreground',
    'stage1Occluders',
]
for token in required:
    assert token in html, f'missing grounded side-scroll requirement: {token}'

# Ground-floor movement must no longer use free vertical roaming.
assert "if(player.scene==='ground')" in html and 'stage1HorizontalIntent' in html

# Preserve the already-approved Libi art while changing movement/grounding only.
assert "const LIBI_SPRITE_URL='assets/libi-sprites-v025.png'" in html

# Grounded jump physics should be velocity/gravity based, not only a timer sine lift.
assert 'player.vz+=STAGE1_GRAVITY*dt' in html
assert 'player.z=Math.max(0,player.z+player.vz*dt)' in html

# Visual grounding requires a floor shadow and foreground occlusion pass.
assert 'drawGroundShadow(player.x' in html
assert 'drawStage1Foreground()' in html

print('Crazy Family v0.31 grounded side-scroll requirements found')
