from pathlib import Path

html = Path('crazy-family.html').read_text(encoding='utf-8')

required = [
    'v0.30',
    'HOUSE_PHYSICS_V030',
    'const houseZones=',
    'function houseSurfaceFactor(',
    'function resolveHouseInteraction(',
    'function updateHouseObjects(',
    'function drawHouseLife(',
    'function updateDadHouseBehavior(',
    "id:'rug'",
    "id:'sofa'",
    "id:'coffeeTable'",
    "id:'toys'",
    "id:'diningTable'",
    "id:'diningChairs'",
    "id:'doorway'",
    "id:'kitchenTile'",
]

for token in required:
    assert token in html, f'missing house interaction requirement: {token}'

# Libi's approved visual stays untouched by this house pass.
assert "const LIBI_SPRITE_URL='assets/libi-sprites-v025.png'" in html

# Movement must actually use the house surface model, either directly in move()
# (v0.30) or through the grounded stage-1 kinematics helper (v0.31+).
move_start = html.index('function move(')
move_end = html.index('function collect(', move_start)
move_body = html[move_start:move_end]
if 'updateStage1Kinematics' in move_body:
    kin_start = html.index('function updateStage1Kinematics(')
    kin_end = html.index('function drawGroundShadow(', kin_start)
    movement_body = html[kin_start:kin_end]
else:
    movement_body = move_body
assert 'houseSurfaceFactor' in movement_body, 'movement is not affected by house surfaces'
assert 'resolveHouseInteraction' in movement_body, 'movement does not resolve furniture interactions'

# The runtime loop must update responsive objects and Dad's house-specific behavior.
update_start = html.index('function update(dt)')
update_end = html.index('function hasItem(', update_start)
update_body = html[update_start:update_end]
assert 'updateHouseObjects(dt)' in update_body, 'responsive house objects are not updated'

# Drawing must include the responsive house-life overlay even when panoramic art is loaded.
draw_start = html.index('function draw(){')
draw_end = html.index('function renderInv(', draw_start)
draw_body = html[draw_start:draw_end]
assert 'drawHouseLife()' in draw_body, 'house interaction visuals are not rendered'

# Dad must be able to pant, yawn and sneeze as environmental behaviors.
for state in ["'pant'", "'yawn'", "'sneeze'"]:
    assert state in html, f'missing Dad house state: {state}'

print('crazy-family v0.30 house interaction checks passed')
