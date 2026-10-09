from pathlib import Path

# RED/GREEN contract for the full Stage 1 visual upgrade.
s = Path('crazy-family.html').read_text(encoding='utf-8')
required = [
    'DAD_SPRITE_RENDERER_V028',
    'COLLECTIBLE_SPRITE_RENDERER_V028',
    'SOUND_FX_RENDERER_V028',
    'dad-sprites-v028.png',
    'collectibles-v028.png',
    'ball-v028.png',
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('missing v0.28 visual markers: ' + ', '.join(missing))
if "ctx.roundRect(-14,-3,28,24,8)" in s:
    raise SystemExit('old primitive dad renderer still present')
if "ctx.fillText(p.icon,p.x,p.y+10)" in s:
    raise SystemExit('old emoji pickup renderer still present')
print('Crazy Family v0.28 visual checks passed')
