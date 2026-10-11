from pathlib import Path

html_path=Path('crazy-family.html')
game_path=Path('crazy-family/game.js')
html=html_path.read_text(encoding='utf-8')
game=game_path.read_text(encoding='utf-8')

if "from './scenario.js'" not in game:
    old="import { createLivingRoomWorld } from './world.js';\n"
    new=old+"import { createScenario, applyScenarioToWorld } from './scenario.js';\n"
    assert old in game, 'world import anchor missing'
    game=game.replace(old,new,1)

old_setup="""  const world = createLivingRoomWorld();
  const sceneHandle = createLivingRoomScene({ canvas, world });
"""
new_setup="""  const world = createLivingRoomWorld();
  // SCENARIO_SPAWNS_V041 — the house stays fixed; special items and Dad vary each run.
  const scenario=createScenario({world});
  applyScenarioToWorld(world,scenario);
  const sceneHandle = createLivingRoomScene({ canvas, world });
  const specialItemVisual=sceneHandle.objectsById.get(scenario.item.id);
  if(specialItemVisual){
    const {x,y,z}=scenario.item.position;
    specialItemVisual.position.set(x,y,z);
    specialItemVisual.rotation.y=scenario.item.rotationY||0;
    specialItemVisual.userData.scenarioSpawnId=scenario.item.spawnId;
  }
"""
if 'SCENARIO_SPAWNS_V041' not in game:
    assert old_setup in game, 'game setup anchor missing'
    game=game.replace(old_setup,new_setup,1)

old_dad="  const dadController=createDadController({position:{x:2.7,y:0,z:-0.35}});"
new_dad="  const dadController=createDadController({position:{...scenario.dad.position}});"
if old_dad in game:
    game=game.replace(old_dad,new_dad,1)
assert new_dad in game, 'scenario Dad start was not wired'

if 'v0.41' not in html:
    assert 'v0.40' in html, 'version anchor missing'
    html=html.replace('v0.40','v0.41',1)

html_path.write_text(html,encoding='utf-8')
game_path.write_text(game,encoding='utf-8')
print('applied Crazy Family v0.41 scenario spawning')
