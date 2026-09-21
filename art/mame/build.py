"""Original Mame artwork. Native 40x44 cells, fixed feet pivot, four shades.
Regenerate with the pinned MIT Pixel Art Studio helper; no image API needed.
"""
from pathlib import Path
import sys,json,hashlib
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from pixelstudio import Sprite
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'art/mame/generated';OUT.mkdir(parents=True,exist_ok=True)
(ROOT/'assets').mkdir(exist_ok=True)
PALETTE=['#33432b','#748658','#afc28b','#edf2ce']
I,S,M,L=PALETTE
BG='#bdcb9a';W,H=40,44
# Pixel centers are paired around x=19.5; never assign per-eye dimensions.
EYE_LEFT,EYE_RIGHT,EYE_WIDTH,EYE_HEIGHT,EYE_TOP=13,23,4,5,20
POSES=['idle','breathe','blink','glance','happy','ready','eat-a','eat-b','bow','sleep','sick','refuse','stretch','wave','step-a','step-b']
LOOKS=['neutral-0']+['good-'+str(n) for n in range(1,6)]+['bad-'+str(n) for n in range(1,6)]+['egg','departed']

def draw(s,key,pose):
    bad=key.startswith('bad');n=int(key[-1]) if '-' in key else 0
    bob=(3 if bad and n==5 else 1 if bad and n==2 else 0)+(1 if pose=='breathe' else -1 if pose in ['ready','happy','stretch'] else 0)
    def rect(x,y,w,h,c):s.rect(x,y,x+w-1,y+h-1,c)
    def oval(x0,y0,x1,y1,c):s.ellipse(x0,y0,x1,y1,c)
    def blob(points,c):s.polygon(points,c)
    def line(x0,y0,x1,y1,c):s.line(x0,y0,x1,y1,c)
    if key=='egg':
        b=1 if pose in ['breathe','eat-b','step-b'] else 0
        oval(10,11+b,29,38,I);oval(11,12+b,28,37,M);oval(12,12+b,26,33,L)
        rect(15,15+b,3,2,M);rect(24,23,2,3,M);rect(13,29,2,2,M)
        line(20,22,20,27,S);rect(17,22,3,2,S);rect(21,20,3,2,S)
        return
    if key=='departed':
        bob=1 if pose=='breathe' else 0
        oval(13,5,26,9,S);rect(16,6,8,2,L)
        blob([(10,24),(7,20),(4,20),(5,25),(8,29),(12,29)],I)
        blob([(29,24),(32,20),(35,20),(34,25),(31,29),(28,29)],I)
        blob([(9,24),(6,22),(7,26),(10,28),(12,27)],L)
        blob([(30,24),(33,22),(32,26),(29,28),(27,27)],L)
        oval(10,14+bob,29,34+bob,I);oval(11,15+bob,28,33+bob,M);oval(11,15+bob,27,31+bob,L)
        rect(12,31+bob,5,4,L);rect(20,32+bob,4,3,L);rect(25,30+bob,3,4,L)
        line(14,23+bob,17,24+bob,I);line(22,24+bob,25,23+bob,I)
        rect(18,28+bob,4,1,S);return
    leftdx=-1 if pose=='step-a' else 0;rightdx=1 if pose=='step-b' else 0
    oval(10+leftdx,36,17+leftdx,40,I);rect(12+leftdx,37,4,2,M)
    oval(22+rightdx,36,29+rightdx,40,I);rect(23+rightdx,37,4,2,M)
    if not bad and n>=3:
        blob([(29,30),(32,31),(34,29),(34,26),(36,26),(36,31),(33,34),(29,33)],I);line(31,32,34,30,M)
    if not bad and n==5:
        blob([(12,25),(7,33),(6,37),(13,36),(20,39),(28,36),(33,37),(31,32),(27,25)],I)
        blob([(12,27),(9,34),(13,34),(20,37),(27,34),(30,35),(27,27)],M)
    if not bad and n==4:oval(28,24,35,35,I);rect(30,25,4,7,S);rect(31,26,2,3,M)
    blob([(15,12+bob),(24,12+bob),(27,14+bob),(30,17+bob),(31,21+bob),(32,27+bob),(31,32),(28,36),(24,38),(15,38),(11,36),(8,32),(7,27+bob),(8,21+bob),(9,17+bob),(12,14+bob)],I)
    blob([(15,13+bob),(22,13+bob),(26,15+bob),(29,18+bob),(30,22+bob),(31,27+bob),(30,31),(27,35),(24,37),(15,37),(12,35),(9,31),(8,27+bob),(9,21+bob),(11,17+bob),(13,15+bob)],M)
    blob([(15,13+bob),(22,13+bob),(26,15+bob),(28,18+bob),(29,24+bob),(28,29+bob),(25,33),(20,35),(13,34),(10,31),(9,26+bob),(10,21+bob),(12,17+bob)],L)
    if not(bad and n>=4):
        if bad:
            line(19,13+bob,19,10+bob,I);line(19,10+bob,23,9+bob,I)
            blob([(23,9+bob),(27,10+bob),(28,13+bob),(26,15+bob),(24,13+bob)],I);rect(25,11+bob,2,2,S)
        elif key=='neutral-0':
            line(19,13+bob,19,10+bob,I)
            blob([(19,10+bob),(21,7+bob),(25,6+bob),(25,9+bob),(22,11+bob)],I);line(21,9+bob,23,8+bob,M)
        else:
            line(19,13+bob,19,8+bob,I)
            blob([(18,9+bob),(14,8+bob),(13,5+bob),(16,5+bob),(19,8+bob)],I)
            blob([(19,8+bob),(21,5+bob),(26,4+bob),(26,7+bob),(23,10+bob),(20,10+bob)],I);line(21,8+bob,24,6+bob,M)
    if pose in ['ready','happy','stretch','wave']:
        blob([(9,27+bob),(6,26+bob),(4,22+bob),(5,19+bob),(8,20+bob),(10,24+bob)],I);line(6,22+bob,8,25+bob,M)
        if pose=='wave':blob([(29,25),(30,19),(32,16),(35,17),(35,21),(32,24),(31,29)],I);rect(32,18,2,3,L)
        else:blob([(29,25+bob),(32,20+bob),(35,19+bob),(36,22+bob),(34,26+bob),(31,28+bob)],I);line(33,22+bob,31,26+bob,M)
    else:
        oval(5,25+bob,10,31+bob,I);oval(6,26+bob,9,29+bob,M)
        oval(29,25+bob,34,31+bob,I);oval(30,26+bob,33,29+bob,M)
    if not bad and n==2:
        blob([(10,30),(19,32),(29,30),(25,34),(19,35),(13,34)],S);rect(18,32,3,3,I);rect(20,35,3,2,S)
    if not bad and n==3:
        rect(12,29,2,6,S);rect(26,29,2,6,S);rect(13,33,15,4,S);rect(17,33,7,4,M);rect(19,33,3,2,I)
    if not bad and n==4:
        blob([(12,13+bob),(13,10+bob),(16,9+bob),(24,9+bob),(27,11+bob),(27,14+bob)],I)
        rect(14,11+bob,11,3,S);rect(13,14+bob,16,2,I);rect(14,14+bob,12,1,M)
        line(27,28,14,35,S);rect(22,32,6,5,I);rect(23,33,4,2,M)
    if not bad and n==5:blob([(19,32),(21,34),(20,36),(18,36),(17,34)],I);rect(19,33,1,2,L)
    # Both eyes use one template. The tiny tooth is centered, never a stray dot.
    ey=EYE_TOP+bob+(2 if pose=='bow' else 0)
    gaze=-1 if pose=='glance' else 1 if pose=='refuse' else 0
    for x in [EYE_LEFT,EYE_RIGHT]:
        if pose=='happy':
            line(x,ey+3,x+1,ey+2,I);line(x+2,ey+2,x+3,ey+3,I)
        elif pose in ['sleep','blink','bow']:
            rect(x,ey+3,EYE_WIDTH,1,I)
        elif pose=='sick' or bad:
            rect(x,ey+1,EYE_WIDTH,1,I);rect(x+1,ey+2,2,2,I)
        else:
            rect(x+gaze,ey,EYE_WIDTH,EYE_HEIGHT,I)
            rect(x+gaze+1,ey,1,1,L)
    if bad and n>=3:
        line(12,ey-2,16,ey-1,I);line(23,ey-1,27,ey-2,I)
    for x in [10,27]:rect(x,ey+6,3,2,M)
    if pose=='eat-a':
        oval(17,ey+6,22,ey+11,I);rect(19,ey+6,2,2,L);rect(19,ey+10,2,1,M)
        for x in [10,26]:rect(x,ey+6,4,3,M)
    elif pose=='eat-b':
        rect(17,ey+8,6,1,I);rect(19,ey+8,2,2,L)
        for x in [10,26]:rect(x,ey+6,4,3,M)
    elif pose=='ready':
        oval(18,ey+6,21,ey+10,I);rect(19,ey+6,2,2,L)
    elif pose=='happy':
        line(17,ey+7,19,ey+9,I);line(20,ey+9,22,ey+7,I);rect(19,ey+7,2,1,L)
    elif bad or pose in ['sick','refuse']:
        line(17,ey+9,19,ey+8,I);line(20,ey+8,22,ey+9,I)
    else:
        rect(17,ey+8,6,1,I);rect(19,ey+8,2,2,L)
    if bad and n==2:oval(5,36,12,39,S);rect(7,36,3,1,M)
    if bad and n==3:rect(13,33,13,4,S);rect(16,34,7,2,M);rect(25,34,3,4,I)
    if (bad and n>=4) or pose=='sleep':
        if pose=='sleep':
            s.clear();oval(5,25,34,40,I);oval(6,26,33,39,M);oval(7,25,29,37,L)
            rect(11,31,4,1,I);rect(25,31,4,1,I);rect(18,35,4,1,I)
            rect(19,22,2,5,I);blob([(19,23),(16,21),(15,18),(18,18),(21,21)],I)
            rect(6,37,5,3,I);rect(28,37,5,3,I);return
        if n==4:line(18,12,18,9,I);line(18,9,23,10,I);rect(23,10,2,3,S)
        oval(5,30,35,40,I);oval(6,31,34,39,S)
        blob([(8,34),(13,32),(17,33),(21,36),(27,34),(32,35),(33,38),(8,38)],M)
        if n==5:rect(10,29,20,2,M);rect(15,33,3,2,S);rect(25,37,4,1,L)
    if pose=='sick':rect(14,14+bob,13,3,S);rect(15,14+bob,10,2,L);rect(17,14+bob,2,2,M)

def main():
    atlas=Image.new('RGBA',(W*len(POSES),H*len(LOOKS)),(0,0,0,0));infos={}
    contact=Image.new('RGB',(W*4*len(LOOKS),H*4),BG)
    for row,key in enumerate(LOOKS):
        sprite=Sprite(W,H,palette=PALETTE)
        for i,pose in enumerate(POSES):
            if i:sprite.add_frame(copy=False)
            draw(sprite,key,pose);sprite.set_duration(160 if pose=='blink' else 320)
            im=sprite.composite();atlas.alpha_composite(im,(W*i,H*row));b=im.getbbox()
            if key not in ['egg','departed'] and pose!='sleep':
                bob=(3 if key=='bad-5' else 1 if key=='bad-2' else 0)+(1 if pose=='breathe' else -1 if pose in ['ready','happy','stretch'] else 0)
                ey=EYE_TOP+bob+(2 if pose=='bow' else 0)
                dx=-1 if pose=='glance' and not key.startswith('bad') else 1 if pose=='refuse' and not key.startswith('bad') else 0
                eye_a=im.crop((EYE_LEFT+dx,ey,EYE_LEFT+dx+EYE_WIDTH,ey+EYE_HEIGHT))
                eye_b=im.crop((EYE_RIGHT+dx,ey,EYE_RIGHT+dx+EYE_WIDTH,ey+EYE_HEIGHT))
                assert eye_a.tobytes()==eye_b.tobytes(),('eyes do not match',key,pose)
            assert b and b[0]>0 and b[1]>0 and b[2]<W and b[3]<H,(key,pose,b)
        for name,a,b in [('idle',1,4),('eat',7,8),('sleep',10,10),('greeting',14,14)]:sprite.tag(name,a,b)
        sprite.save_spritesheet(str(OUT/(key+'.png')),layout='horizontal')
        sprite.save_project(str(OUT/(key+'.pixelstudio.json')))
        if key=='neutral-0':
            sprite.save_silhouette(str(OUT/'silhouette.png'),frame=1,scale=8)
            sprite.save_png(str(OUT/'mame.png'),frame=1,scale=1)
            sprite.save_gif(str(OUT/'eating.gif'),scale=6,tag='eat',bg=BG)
            sprite.preview(str(OUT/'expressions.png'),scale=6)
        stats=sprite.stats(print_=False);assert stats['colors_used']<=4 and stats['semi_alpha_px']==0
        infos[key]=stats
        im=sprite.composite(1).resize((W*4,H*4),Image.Resampling.NEAREST);contact.paste(im,(row*W*4,0),im)
    path=ROOT/'assets/mame-sheet.png'
    atlas.quantize(colors=5,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(path,optimize=True,bits=4)
    meta={'cell':{'width':W,'height':H},'poses':POSES,'looks':LOOKS,'palette':PALETTE,'anchor':[20,40],'sheet':{'width':atlas.width,'height':atlas.height},'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    (ROOT/'assets/mame-sheet.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
    (OUT/'stats.json').write_text(json.dumps(infos,ensure_ascii=False,indent=2));contact.save(OUT/'all-looks.png');print(meta)
if __name__=='__main__':main()
