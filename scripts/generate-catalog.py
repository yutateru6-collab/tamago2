"""Create load-efficient catalog copies from the six ORIGINAL shipped PNGs.
The original images stay available for inspection and fallback, never replaced.
Run node preview-build.mjs first. Only assets/catalog is written.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib
root=Path(__file__).resolve().parents[1]
out=root/'assets/catalog';out.mkdir(parents=True,exist_ok=True)
manifest=[]
for number in (2,3,5,7,10,12):
    source=root/f'dist/creatures/{number}.png'
    with Image.open(source) as im:
        im.load(); im=ImageOps.exif_transpose(im).convert('RGB')
        entry={'id':f'{number:03}','originalSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalBytes':source.stat().st_size,'files':[]}
        for suffix,limit,quality in [('-thumb',(320,480),84),('',(800,1200),88)]:
            copy=im.copy();copy.thumbnail(limit,Image.Resampling.LANCZOS)
            target=out/f'{number:03}{suffix}.webp';copy.save(target,'WEBP',quality=quality,method=6)
            with Image.open(target) as check:
                check.load();assert check.size==copy.size
            entry['files'].append({'name':target.name,'width':copy.width,'height':copy.height,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
        manifest.append(entry)
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps(manifest,ensure_ascii=False,indent=2))
