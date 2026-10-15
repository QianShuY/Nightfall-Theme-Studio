"""Build one CommonJS renderer tweak, without third-party dependencies."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
engine=(root/'shared'/'engine.js').read_text(encoding='utf-8')
adapter=(root/'desktop-tweak'/'adapter.js').read_text(encoding='utf-8')
(root/'desktop-tweak'/'index.js').write_text(engine+'\n'+adapter,encoding='utf-8')
print('Built desktop-tweak/index.js',len(engine+adapter),'characters')
extension_adapter=(root/'extension'/'adapter.js').read_text(encoding='utf-8')
(root/'extension'/'content.js').write_text(engine+'\n'+extension_adapter,encoding='utf-8')
print('Built extension/content.js',len(engine+extension_adapter),'characters')
