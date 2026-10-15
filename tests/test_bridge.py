"""Integration tests for the local UI bridge, including a file larger than old 5 MB cap."""
import importlib.util
import json
import hashlib
from pathlib import Path
import tempfile
import threading
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
import unittest

FILE = Path(__file__).resolve().parents[1] / 'desktop-scripts' / 'bridge.py'
spec = importlib.util.spec_from_file_location('nightfall_bridge', FILE)
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class BridgeTests(unittest.TestCase):
    def test_endpoints_and_12mb_media(self):
        with tempfile.TemporaryDirectory() as tmp:
            runtime = Path(tmp) / 'chatgpt-plusplus'
            bridge.RUNTIME = runtime
            bridge.DATA = runtime / 'tweak-data' / bridge.TWEAK_ID
            bridge.TWEAK_DEST = runtime / 'tweaks' / 'nightfall-theme-studio'
            with ThreadingHTTPServer(('127.0.0.1', 0), bridge.Handler) as server:
                thread = threading.Thread(target=server.serve_forever, daemon=True)
                thread.start()
                port = server.server_port
                base = f'http://127.0.0.1:{port}'
                def post(path, body=b'', mime='application/json', headers=None):
                    req = Request(base+path, data=body, method='POST', headers={
                        'Origin':base, 'X-Nightfall-Client':'studio', 'Content-Type':mime, **(headers or {})})
                    with urlopen(req) as response:
                        return json.load(response)
                try:
                    with urlopen(base+'/api/status') as response:
                        self.assertFalse(json.load(response)['runtimeDetected'])
                    runtime.mkdir()
                    self.assertTrue(post('/api/install')['tweakInstalled'])
                    sample = b'FAKE-VIDEO-TEST' * (1024 * 1024)  # > 5MB limit from v0.3
                    upload = post('/api/media?kind=video', sample, 'application/octet-stream', {'X-Nightfall-Mime':'video/mp4'})
                    self.assertEqual(upload['mediaKey'], hashlib.sha256(sample).hexdigest())
                    self.assertGreater(upload['chunks'], 8)
                    meta = json.loads((bridge.DATA/'media'/f"{upload['mediaKey']}.json").read_text())
                    self.assertEqual(meta['size'], len(sample))
                    import base64
                    reconstructed = b''.join(base64.b64decode((bridge.DATA/'media'/f"{upload['mediaKey']}-{i:06d}.b64").read_text()) for i in range(meta['chunks']))
                    self.assertEqual(reconstructed, sample)
                    theme = {'id':'grimoire','name':'Anti-Magic Grimoire','bgType':'video','mediaKey':upload['mediaKey']}
                    self.assertTrue(post('/api/apply', json.dumps(theme).encode())['ok'])
                    saved = json.loads((bridge.DATA/'live.json').read_text())
                    self.assertEqual(saved['mediaKey'], upload['mediaKey'])
                    self.assertTrue(post('/api/disable')['ok'])
                    self.assertEqual(json.loads((bridge.DATA/'live.json').read_text()), {'enabled': False})
                finally:
                    server.shutdown()
                    thread.join(2)

if __name__ == '__main__':
    unittest.main()
