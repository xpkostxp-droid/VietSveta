"""Render geography cards from public-domain Natural Earth country outlines.
Run manually; the game uses the checked-in WebP files, without network requests.
"""
from pathlib import Path
import json
import urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
CACHE = ROOT / 'tmp/travel-maps/countries-50m.geojson'
OUT = ROOT / 'public/travel'
CACHE.parent.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
if not CACHE.exists():
    CACHE.write_bytes(urllib.request.urlopen(SOURCE, timeout=30).read())
features = json.loads(CACHE.read_text())['features']

def rings(feature):
    g = feature['geometry']
    return [p[0] for p in (g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']])]

def mask_for(feature, size=(3600, 1800)):
    m = Image.new('L', size)
    d = ImageDraw.Draw(m)
    for ring in rings(feature):
        d.polygon([((lon+180)/360*size[0], (90-lat)/180*size[1]) for lon, lat in ring], fill=255)
    return np.asarray(m) > 0

W, H = 3600, 1800
land = np.zeros((H,W), bool)
continents = {c: np.zeros((H,W), bool) for c in ['Asia','Europe']}
latitude = 90 - np.arange(H)[:,None]/H*180
longitude = np.arange(W)[None,:]/W*360-180
# Conventional schematic Europe/Asia division within transcontinental Russia,
# following the Urals and Caucasus rather than assigning all Russia to Europe.
ural = np.interp(latitude, [40,45,50,55,60,65,90], [44,50,55,60,60,65,65])
for f in features:
    m = mask_for(f)
    land |= m
    continent = f['properties']['CONTINENT']
    if f['properties']['ADMIN'] == 'Russia':
        continents['Europe'] |= m & (longitude < ural)
        continents['Asia'] |= m & (longitude >= ural)
    elif continent in continents:
        continents[continent] |= m

S = 768
yy, xx = np.mgrid[:S,:S]
background = np.zeros((S,S,3), float)
tone = 1 - .045*((xx-250)**2+(yy-100)**2)/S**2
background[:] = np.array([250,240,219])[None,None,:]*tone[:,:,None]
# The two cards use exactly the same globe, scale, viewpoint and lighting.
x = (xx-384)/306
y = -(yy-325)/306
rho = np.sqrt(x*x+y*y)
inside = rho <= 1
r = np.maximum(rho, 1e-9)
c = np.arcsin(np.minimum(rho,1))
lat0, lon0 = np.deg2rad([30,65])
lat = np.arcsin(np.clip(np.cos(c)*np.sin(lat0)+y*np.sin(c)*np.cos(lat0)/r,-1,1))
lon = lon0 + np.arctan2(x*np.sin(c), r*np.cos(lat0)*np.cos(c)-y*np.sin(lat0)*np.sin(c))
lo = (np.rad2deg(lon)+180)%360-180
la = np.rad2deg(lat)
u = np.clip(((lo+180)/360*W).astype(int),0,W-1)
v = np.clip(((90-la)/180*H).astype(int),0,H-1)
land_visible = land[v,u]
light = np.clip(.69+.31*np.sqrt(np.maximum(0,1-rho*rho))-.13*x+.14*y,.48,1.12)
for key, continent in [('asia','Asia'),('europe','Europe')]:
    pixels = background.copy()
    globe = np.zeros_like(pixels)
    globe[:] = [100,158,163]
    globe[land_visible] = [219,213,185]
    globe[continents[continent][v,u]] = [225,167,73]
    meridian = np.minimum((lo+180)%30,30-(lo+180)%30) < .18
    parallel = np.minimum((la+90)%30,30-(la+90)%30) < .15
    globe[meridian|parallel] *= .90
    globe *= light[:,:,None]
    pixels[inside] = globe[inside]
    im = Image.fromarray(np.uint8(np.clip(pixels,0,255)))
    shadow = Image.new('RGBA',(S,S))
    d=ImageDraw.Draw(shadow)
    d.ellipse((145,636,623,678),fill=(97,69,37,60))
    shadow=shadow.filter(ImageFilter.GaussianBlur(13))
    im=Image.alpha_composite(im.convert('RGBA'),shadow)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((370,625,398,660),8,fill='#a78550')
    d.ellipse((307,650,461,670),fill='#b29668')
    im.convert('RGB').save(OUT/(key+'.webp'),'WEBP',quality=91,method=6)

# Country card: actual Vietnamese outline, neighboring countries muted.
im=Image.fromarray(np.uint8(np.clip(background,0,255)))
d=ImageDraw.Draw(im)
def point(lon,lat):
    return (384+(lon-106)*37,330-(lat-16)*39)
d.rounded_rectangle((28,22,740,668),32,fill='#b9d5d2')
for f in features:
    if f['properties']['CONTINENT']!='Asia':
        continue
    for ring in rings(f):
        if not any(94<lon<117 and 6<lat<28 for lon,lat in ring):
            continue
        pts=[point(lon,lat) for lon,lat in ring]
        d.polygon(pts,fill='#e2dccb',outline='#b5b5a3',width=2)
for f in features:
    if f['properties']['ADMIN']=='Vietnam':
        for ring in rings(f):
            pts=[point(lon,lat) for lon,lat in ring]
            d.polygon(pts,fill='#dfac56',outline='#956d34',width=3)
px,py=point(105.8,21.0)
d.line((px,py,px,py-85),fill='#705238',width=4)
d.rectangle((px,py-85,px+105,py-19),fill='#d93435')
star=[]
for i in range(10):
    angle=-np.pi/2+i*np.pi/5
    rad=23 if i%2==0 else 9
    star.append((px+52+rad*np.cos(angle),py-52+rad*np.sin(angle)))
d.polygon(star,fill='#ffe07c')
# Rounded map boundary and a lower cream strip for the game's label.
mask=Image.new('L',(S,S));ImageDraw.Draw(mask).rounded_rectangle((28,22,740,668),32,fill=255)
base=Image.fromarray(np.uint8(np.clip(background,0,255)))
base.paste(im,(0,0),mask)
base.save(OUT/'country.webp','WEBP',quality=91,method=6)
print('Rendered asia.webp, europe.webp, country.webp (768×768)')
