#!/usr/bin/env python3
from __future__ import annotations
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / 'assets' / 'crazy-family' / 'cinematic-home-v042'
REQUIRED = [
    'background.webp',
    'floor-rug.webp',
    'sofa.webp',
    'coffee-table.webp',
    'dining-kitchen.webp',
    'foreground-left.webp',
    'foreground-right.webp',
    'light-overlay.webp',
    'manifest.json',
]
REQUIRED_IDS = {
    'cinematic-background',
    'cinematic-floor-rug',
    'cinematic-sofa',
    'cinematic-coffee-table',
    'cinematic-dining-kitchen',
    'cinematic-foreground-left',
    'cinematic-foreground-right',
}
FORBIDDEN_ID_FRAGMENTS = ('libi', 'dad', 'character', 'hud', 'button', 'headphone')


def webp_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if len(data) < 30 or data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise AssertionError(f'{path.name}: not a WebP RIFF file')
    chunk = data[12:16]
    if chunk == b'VP8X':
        width = 1 + int.from_bytes(data[24:27], 'little')
        height = 1 + int.from_bytes(data[27:30], 'little')
        return width, height
    if chunk == b'VP8 ':
        marker = data.find(b'\x9d\x01\x2a')
        if marker < 0 or marker + 7 > len(data):
            raise AssertionError(f'{path.name}: invalid VP8 header')
        width, height = struct.unpack_from('<HH', data, marker + 3)
        return width & 0x3FFF, height & 0x3FFF
    if chunk == b'VP8L':
        if len(data) < 25 or data[20] != 0x2F:
            raise AssertionError(f'{path.name}: invalid VP8L header')
        bits = int.from_bytes(data[21:25], 'little')
        width = (bits & 0x3FFF) + 1
        height = ((bits >> 14) & 0x3FFF) + 1
        return width, height
    raise AssertionError(f'{path.name}: unsupported WebP chunk {chunk!r}')


def main() -> None:
    missing = [name for name in REQUIRED if not (ASSET_DIR / name).exists()]
    assert not missing, f'missing v0.42 cinematic assets: {missing}'

    for name in REQUIRED:
        path = ASSET_DIR / name
        assert path.stat().st_size > 500 if path.suffix == '.json' else path.stat().st_size > 10_000, f'{name}: file too small'
        if path.suffix == '.webp':
            width, height = webp_dimensions(path)
            assert width >= 700 and height >= 350, f'{name}: resolution too small: {width}x{height}'

    manifest = json.loads((ASSET_DIR / 'manifest.json').read_text(encoding='utf-8'))
    layers = manifest.get('layers')
    assert isinstance(layers, list) and layers, 'manifest.layers must be a non-empty list'
    ids = [layer.get('id') for layer in layers]
    assert len(ids) == len(set(ids)), 'manifest layer ids must be unique'
    assert REQUIRED_IDS.issubset(ids), f'missing semantic layer ids: {sorted(REQUIRED_IDS.difference(ids))}'
    for layer_id in ids:
        lower = str(layer_id).lower()
        assert not any(fragment in lower for fragment in FORBIDDEN_ID_FRAGMENTS), f'forbidden character/UI layer id: {layer_id}'
    for layer in layers:
        for key in ('id', 'src', 'kind', 'world', 'renderOrder', 'occluder'):
            assert key in layer, f"{layer.get('id','<unknown>')}: missing {key}"
        world = layer['world']
        for key in ('x','y','z','width','height'):
            assert isinstance(world.get(key), (int, float)), f"{layer['id']}: world.{key} must be numeric"
        assert layer['kind'] in {'background','surface','furniture','foreground','light'}

    print(f'PASS: Crazy Family v0.42 cinematic asset pack ({len(layers)} layers)')


if __name__ == '__main__':
    main()
