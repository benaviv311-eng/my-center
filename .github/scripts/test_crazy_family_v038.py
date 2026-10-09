from pathlib import Path

p = Path('crazy-family-v038.html')
assert p.exists(), 'crazy-family-v038.html is missing'
s = p.read_text(encoding='utf-8')

checks = {
    'version': 'v0.38',
    'min cadence': 'DAD_SONG_INTERVAL_MIN=8000',
    'max cadence': 'DAD_SONG_INTERVAL_MAX=14000',
    'min gap': 'DAD_SONG_MIN_GAP=4000',
    'sneeze disabled marker': 'SNEEZE_DISABLED_V038',
    'song-again memory': 'lastSongEndedAt<20000',
}

missing = [name for name, marker in checks.items() if marker not in s]
assert not missing, 'missing v0.38 markers: ' + ', '.join(missing)

print('crazy-family v0.38 static checks passed')
