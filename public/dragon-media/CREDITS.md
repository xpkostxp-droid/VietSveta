# Dragon game media

- `poses.webp`, `board.webp`: generated and selected for VietSveta.
- `fire.mp3`: short edited excerpt from **fire-whoosh.wav**, hnhnh, Freesound sound 244926. CC0. https://freesound.org/people/hnhnh/sounds/244926/ . Trimmed to 0.65 seconds, softened attack/tail, low-pass filter, reduced volume.
- `cough.mp3`: supplied and selected by the project owner, source filename `a-child-coughs_aos02739.mp3`. Original retained by the owner; this game copy trims initial silence and ends after one second, with file amplitude 0.25 and additional playback gain 0.25 / 6, as approved in the prototype. No public-domain claim is made for the owner-supplied recording.

- `voice/0.mp3` through `voice/25.mp3`: Vietnamese text-to-speech clips generated from the selected vocabulary using Google Translate TTS (`tl=vi`), bundled locally for consistent mobile playback. `voice/words.json` maps clip index to text; regenerate with `scripts/build-verb-voice.py`. No runtime requests to the TTS service.
