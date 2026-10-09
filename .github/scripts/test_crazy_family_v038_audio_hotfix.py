from pathlib import Path

p = Path('crazy-family-v038.html')
assert p.exists(), 'crazy-family-v038.html is missing'
s = p.read_text(encoding='utf-8')

checks = {
    'pre voice disabled': 'DAD_PRE_AUDIO_DISABLED_V038',
    'house voice disabled': 'DAD_HOUSE_VOICE_DISABLED_V038',
    'full 24 song rotation': 'DAD_FULL_24_SONG_ROTATION_V038',
    'song cadence min': 'DAD_SONG_INTERVAL_MIN=8000',
    'song cadence max': 'DAD_SONG_INTERVAL_MAX=14000',
    'song minimum gap': 'DAD_SONG_MIN_GAP=4000',
}
missing = [name for name, marker in checks.items() if marker not in s]
assert not missing, 'missing audio hotfix markers: ' + ', '.join(missing)

# The live wrapper must continue to use the canonical base song assets rather than new dad voice files.
assert "dad-song-" not in s or "DAD_FULL_24_SONG_ROTATION_V038" in s

print('crazy-family v0.38 audio hotfix checks passed')
