from pathlib import Path
import re

html = Path('crazy-family.html').read_text(encoding='utf-8')
match = re.search(r'· v0\.(\d+)', html)
current_minor = int(match.group(1)) if match else -1

checks = {
    # v0.34 introduced the cinematic depth-diorama feature; later display versions
    # must keep the feature without being forced to keep the old version label.
    'version_at_least_v034': current_minor >= 34,
    'marker': 'CINEMATIC_HOME_DIORAMA_V034' in html,
    'depth_bounds': 'STAGE1_DEPTH_FAR=350' in html and 'STAGE1_DEPTH_NEAR=535' in html,
    'depth_scale': 'function stage1DepthScale' in html,
    'xy_kinematics': 'function updateStage1Kinematics(dx,dy,dt,sprint)' in html,
    'no_forced_floor_y': 'player.y=STAGE1_FLOOR_Y' not in html,
    'depth_scene': 'function drawStage1DepthScene' in html,
    'ground_draw_short_circuit': "if(player.scene==='ground'){drawStage1DepthScene();return}" in html,
    'home_pickups': 'HOME_PICKUPS_V034' in html,
    'immersive_exits': "if(player.scene==='ground')return;" in html,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('FAIL: ' + ', '.join(failed))
print(f'PASS: crazy-family v0.34 cinematic home diorama retained in display version v0.{current_minor}')
