"""Generate the game's self-contained Vietnamese MP3 clips (no runtime TTS calls)."""
import concurrent.futures
import json
import re
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORDS = re.findall(r"\['([^']+)','[^']+'\]", (ROOT / 'src/content/verbGame.ts').read_text())
OUTPUT = ROOT / 'public/dragon-media/voice'
OUTPUT.mkdir(parents=True, exist_ok=True)

def generate(item):
    index, word = item
    target = OUTPUT / f'{index}.mp3'
    if target.exists() and target.stat().st_size > 500:
        return index, word, target.stat().st_size
    query = urllib.parse.urlencode({'ie': 'UTF-8', 'client': 'tw-ob', 'tl': 'vi', 'q': word})
    request = urllib.request.Request('https://translate.google.com/translate_tts?' + query, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=20) as response:
        if 'audio/' not in response.headers.get('Content-Type', ''):
            raise ValueError('Response is not audio')
        data = response.read()
    if len(data) < 500:
        raise ValueError('Empty voice clip')
    target.write_bytes(data)
    subprocess.run(['ffprobe', '-v', 'error', str(target)], check=True)
    return index, word, len(data)

if __name__ == '__main__':
    assert len(WORDS) == 26
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(generate, enumerate(WORDS)):
            print(*result, flush=True)
    (OUTPUT / 'words.json').write_text(json.dumps(WORDS, ensure_ascii=False, indent=2) + '\n')
