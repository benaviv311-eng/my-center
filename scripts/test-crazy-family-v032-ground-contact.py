from pathlib import Path

html = Path('crazy-family.html').read_text(encoding='utf-8')

required = [
    'PLANTED_FEET_V032',
    'const STAGE1_FOOT_CONTACT_Y=535;',
    'const LIBI_OPAQUE_BOTTOM=408;',
    'const DAD_OPAQUE_BOTTOM=[396,396,396,396,396,383,383,382,383,378];',
    "const groundedBob=player.scene==='ground'?0:",
    "const bob=dad.scene==='ground'?0:Math.sin(dad.phase)*1.8",
]
for token in required:
    assert token in html, f'missing planted-feet requirement: {token}'

# Ground shadows must still use the visible contact plane in the legacy renderer.
draw_start = html.index('function draw(){')
draw_end = html.index('function renderInv(', draw_start)
draw_body = html[draw_start:draw_end]
assert 'drawGroundShadow(dad.x,STAGE1_FOOT_CONTACT_Y' in draw_body
assert 'drawGroundShadow(player.x,STAGE1_FOOT_CONTACT_Y' in draw_body

# v0.32 used a fixed screen contact Y; v0.34 later moved the legacy ground scene
# onto a depth floor. Both are valid as long as alpha-bottom compensation remains.
libi_start = html.index('function libi(){')
libi_end = html.index('function drawStage1Panorama', libi_start)
libi_body = html[libi_start:libi_end]
assert 'groundDy=-(LIBI_OPAQUE_BOTTOM/LIBI_CELL_H)*dh' in libi_body
assert ('STAGE1_FOOT_CONTACT_Y-lift' in libi_body) or ('player.y-lift' in libi_body)

# Dad frames have different transparent bottoms; v0.34 may anchor them to dad.y
# rather than the old fixed screen contact Y, but compensation must stay per-frame.
dad_start = html.index('function drawDad(){')
dad_end = html.index('function drawDizzyFX', dad_start)
dad_body = html[dad_start:dad_end]
assert 'DAD_OPAQUE_BOTTOM[frame]' in dad_body
assert ('STAGE1_FOOT_CONTACT_Y' in dad_body) or ('dad.y' in dad_body)

print('crazy-family v0.32 planted feet/depth-floor compatibility checks passed')
