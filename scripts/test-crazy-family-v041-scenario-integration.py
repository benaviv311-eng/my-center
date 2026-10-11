from pathlib import Path

html=Path('crazy-family.html').read_text(encoding='utf-8')
game=Path('crazy-family/game.js').read_text(encoding='utf-8')
world=Path('crazy-family/world.js').read_text(encoding='utf-8')

assert 'v0.41' in html, 'page version must advance to v0.41'
assert "from './scenario.js'" in game, 'game must import scenario spawning'
assert 'createScenario({world})' in game, 'game must create a fresh scenario per load'
assert 'applyScenarioToWorld(world,scenario)' in game, 'scenario must move the interactable with its visual'
assert 'scenario.item.position' in game, 'special item visual must follow scenario position'
assert 'scenario.dad.position' in game, 'Dad start must come from scenario state'
assert "createDadController({position:{x:2.7,y:0,z:-0.35}})" not in game, 'Dad must not retain the old fixed start'
assert 'scenarioSpawns' in world and "zone: 'kitchen'" in world and "zone: 'dining'" in world, 'world must expose several logical scenario zones'

print('PASS: Crazy Family v0.41 scenario integration contract')
