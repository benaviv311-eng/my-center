#!/usr/bin/env python3
from __future__ import annotations
import io
import json
import os
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'crazy-family' / 'cinematic-home-v042'
MASTER_URL = os.environ.get('CRAZY_FAMILY_V042_MASTER_URL', '').strip()
TARGET = (1600, 1000)  # exact 16:10 gameplay canvas ratio


def fetch_master() -> Image.Image:
    if not MASTER_URL:
        raise SystemExit('CRAZY_FAMILY_V042_MASTER_URL is required')
    request = urllib.request.Request(MASTER_URL, headers={'User-Agent': 'CrazyFamilyAssetBuilder/1.0'})
    with urllib.request.urlopen(request, timeout=90) as response:
        data = response.read()
    image = Image.open(io.BytesIO(data)).convert('RGB')
    # The selected clean master is already almost exact 16:10. Fill by center crop only;
    # never letterbox it and never invent a different room composition here.
    src_ratio = image.width / image.height
    target_ratio = TARGET[0] / TARGET[1]
    if src_ratio > target_ratio:
        crop_w = int(image.height * target_ratio)
        left = (image.width - crop_w) // 2
        image = image.crop((left, 0, left + crop_w, image.height))
    elif src_ratio < target_ratio:
        crop_h = int(image.width / target_ratio)
        top = (image.height - crop_h) // 2
        image = image.crop((0, top, image.width, top + crop_h))
    return image.resize(TARGET, Image.Resampling.LANCZOS)


def feathered_mask(polygons: list[list[tuple[float,float]]], blur: int = 8) -> Image.Image:
    w, h = TARGET
    mask = Image.new('L', TARGET, 0)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon([(int(px*w), int(py*h)) for px,py in polygon], fill=255)
    return mask.filter(ImageFilter.GaussianBlur(blur)) if blur else mask


def layer_from(master: Image.Image, name: str, polygons: list[list[tuple[float,float]]], quality: int = 86, blur: int = 8) -> None:
    rgba = master.convert('RGBA')
    rgba.putalpha(feathered_mask(polygons, blur))
    rgba.save(OUT / name, 'WEBP', quality=quality, method=6)


def save_light_overlay() -> None:
    w,h = TARGET
    overlay = Image.new('RGBA', TARGET, (0,0,0,0))
    draw = ImageDraw.Draw(overlay)
    # Restrained golden window wash; the master already carries the primary lighting.
    for i in range(12):
        alpha = max(0, 18 - i)
        draw.polygon([(0,0),(int(.38*w),0),(int((.64+i*.005)*w),h),(int((.28+i*.005)*w),h)], fill=(255,184,105,alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(30))
    overlay.save(OUT / 'light-overlay.webp', 'WEBP', quality=80, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    master = fetch_master()
    master.save(OUT / 'background.webp', 'WEBP', quality=88, method=6)

    # Masks are authored against this exact clean master. Every layer remains full-frame
    # so it pixel-registers perfectly with the background when moved for occlusion.
    layer_from(master, 'floor-rug.webp', [[(0,.42),(.72,.42),(.98,1),(0,1)]], 84, 8)
    layer_from(master, 'sofa.webp', [[(0,.27),(.56,.27),(.57,.53),(.49,.57),(.36,.57),(.26,.55),(.02,.58),(0,.58)]], 88, 6)
    layer_from(master, 'coffee-table.webp', [[(.035,.34),(.39,.34),(.40,.58),(.02,.60)]], 88, 5)
    layer_from(master, 'dining-kitchen.webp', [[(.45,.06),(.90,.06),(.90,.53),(.47,.53)]], 86, 8)
    layer_from(master, 'foreground-left.webp', [[(0,.13),(.12,.13),(.18,1),(0,1)]], 86, 7)
    layer_from(master, 'foreground-right.webp', [[(.86,.12),(1,.10),(1,1),(.84,1)]], 86, 7)
    save_light_overlay()

    manifest = {
      'version': '0.42-reference-home',
      'visualEnvelope': {'minX': -5.8, 'maxX': 5.8, 'minY': 0.0, 'maxY': 4.2, 'minZ': -4.45, 'maxZ': 4.35},
      'layers': [
        {'id':'cinematic-background','src':'assets/crazy-family/cinematic-home-v042/background.webp','kind':'background','world':{'x':0,'y':2.2,'z':-4.5,'width':12.2,'height':6.86},'renderOrder':-20,'occluder':False,'required':True},
        {'id':'cinematic-floor-rug','src':'assets/crazy-family/cinematic-home-v042/floor-rug.webp','kind':'surface','anchorId':'rug','world':{'x':0,'y':0.012,'z':0,'width':11.8,'height':8.9},'renderOrder':-12,'occluder':False,'required':True,'orientation':'floor'},
        {'id':'cinematic-sofa','src':'assets/crazy-family/cinematic-home-v042/sofa.webp','kind':'furniture','anchorId':'sofa','world':{'x':0,'y':1.35,'z':0,'width':4.55,'height':2.55},'renderOrder':8,'occluder':True,'required':True,'proxy':{'width':3.15,'depth':1.25}},
        {'id':'cinematic-coffee-table','src':'assets/crazy-family/cinematic-home-v042/coffee-table.webp','kind':'furniture','anchorId':'coffee-table','world':{'x':0,'y':0.76,'z':0,'width':3.15,'height':1.75},'renderOrder':9,'occluder':True,'required':True,'proxy':{'width':2.15,'depth':1.2}},
        {'id':'cinematic-dining-kitchen','src':'assets/crazy-family/cinematic-home-v042/dining-kitchen.webp','kind':'furniture','world':{'x':3.5,'y':2.0,'z':-3.95,'width':6.2,'height':4.25},'renderOrder':-2,'occluder':False,'required':True},
        {'id':'cinematic-foreground-left','src':'assets/crazy-family/cinematic-home-v042/foreground-left.webp','kind':'foreground','world':{'x':-5.2,'y':1.65,'z':2.7,'width':2.7,'height':3.4},'renderOrder':30,'occluder':True,'required':True,'proxy':{'width':1.45,'depth':2.1}},
        {'id':'cinematic-foreground-right','src':'assets/crazy-family/cinematic-home-v042/foreground-right.webp','kind':'foreground','world':{'x':5.15,'y':1.65,'z':2.45,'width':2.85,'height':3.45},'renderOrder':30,'occluder':True,'required':True,'proxy':{'width':1.55,'depth':2.0}},
        {'id':'cinematic-light-overlay','src':'assets/crazy-family/cinematic-home-v042/light-overlay.webp','kind':'light','world':{'x':0,'y':2.15,'z':-4.32,'width':12.1,'height':6.8},'renderOrder':40,'occluder':False,'required':False},
      ],
    }
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Built Crazy Family cinematic-home-v042 reference-like asset pack')


if __name__ == '__main__':
    main()
