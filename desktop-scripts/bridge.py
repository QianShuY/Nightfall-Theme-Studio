"""Nightfall local-only control bridge. Python stdlib; no ChatGPT credentials or network upload.

Serves the visual editor on loopback, stores selected media as Base64 CHUNKS
for the optional ChatGPT++ renderer tweak. Nothing touches official app files.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import sys
from pathlib import Path
import shutil
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs
import tempfile
import threading
import webbrowser

ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[1]))
APPDATA = Path(os.environ.get('APPDATA') or Path.home() / '.nightfall')
RUNTIME = APPDATA / 'chatgpt-plusplus'
TWEAK_ID = 'com.nightfall.theme-studio'
DATA = RUNTIME / 'tweak-data' / TWEAK_ID
TWEAK_DEST = RUNTIME / 'tweaks' / 'nightfall-theme-studio'
CHUNK = 512 * 1024


def valid_theme(raw):
    if not isinstance(raw, dict) or len(json.dumps(raw)) > 2_000_000:
        raise ValueError('Invalid theme payload')
    # Do not accept arbitrary filesystem/network addresses. UI uses CSS tokens only.
    result = {k: v for k, v in raw.items() if k in (
        'schemaVersion', 'id', 'name', 'accent', 'base', 'surface', 'text', 'muted',
        'border', 'bgType', 'darkness', 'blur', 'glass', 'radius', 'fontSize',
        'sidebarWidth', 'chatWidth', 'particles', 'speed', 'animations',
        'glassEnabled', 'compact', 'introEnabled', 'introStyle', 'introDuration',
        'introName', 'introFrequency', 'mediaKey', 'mediaName', 'mediaMime')}
    # Media key is an SHA256 digest assigned by the bridge, never a user path.
    key = result.get('mediaKey')
    if key is not None and (not isinstance(key, str) or len(key) != 64 or any(c not in '0123456789abcdef' for c in key)):
        raise ValueError('Invalid media key')
    return result


def status():
    manifest = TWEAK_DEST / 'manifest.json'
    tweak = False
    try:
        tweak = json.loads(manifest.read_text(encoding='utf-8')).get('id') == TWEAK_ID
    except (FileNotFoundError, ValueError, OSError):
        pass
    return dict(bridge=True, runtimeDetected=RUNTIME.is_dir(), tweakInstalled=tweak,
                desktopVerified=False, mode='local', message=(
                '插件文件已安装；能否在官方客户端生效需实际检查' if tweak else
                '未检测到可用的 Nightfall 插件，请先安装第三方运行时'))


def install_tweak():
    # Never install arbitrary binaries, patch ChatGPT, or overwrite unknown tweaks.
    if not RUNTIME.is_dir():
        raise ValueError('找不到第三方 ChatGPT++ 运行时。无法直接修改 Windows 官方客户端，请先阅读使用说明。')
    source = ROOT / 'desktop-tweak'
    manifest = TWEAK_DEST / 'manifest.json'
    if manifest.exists():
        try:
            if json.loads(manifest.read_text(encoding='utf-8')).get('id') != TWEAK_ID:
                raise ValueError('目标位置已有其他插件，未覆盖')
        except json.JSONDecodeError as ex:
            raise ValueError('目标位置已有未知配置，未覆盖') from ex
    TWEAK_DEST.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / 'manifest.json', manifest)
    shutil.copy2(source / 'index.js', TWEAK_DEST / 'index.js')
    DATA.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _origin_ok(self):
        origin = self.headers.get('Origin')
        return origin == f'http://127.0.0.1:{self.server.server_port}' and self.headers.get('X-Nightfall-Client') == 'studio'

    def send_json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlsplit(self.path).path == '/api/status':
            self.send_json(200, status())
            return
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/studio/index.html')
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self):
        if not self._origin_ok():
            self.send_json(403, {'error': '本地来源校验失败'})
            return
        try:
            path = urlsplit(self.path).path
            length = int(self.headers.get('Content-Length', '-1'))
            if length < 0:
                raise ValueError('缺少有效文件长度')
            if path == '/api/install':
                install_tweak()
                self.send_json(200, {'ok': True, **status()})
            elif path == '/api/apply':
                if length > 2_000_000:
                    raise ValueError('主题配置过大，媒体请单独上传')
                data = valid_theme(json.loads(self.rfile.read(length)))
                # Never send ephemeral browser blob URLs or base64 into a 2 MB config.
                if data.get('mediaKey'):
                    meta = DATA / 'media' / (data['mediaKey'] + '.json')
                    if not meta.exists():
                        raise ValueError('媒体尚未保存到本地，请重新选择素材')
                if not status()['tweakInstalled']:
                    raise ValueError('桌面插件未安装，不能声称已应用。请先点击「连接客户端」。')
                DATA.mkdir(parents=True, exist_ok=True)
                temp = DATA / 'live.json.tmp'
                temp.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
                temp.replace(DATA / 'live.json')
                self.send_json(200, {'ok': True, 'message': '配置已送达插件目录。客户端渲染是否生效仍需实机验证。'})
            elif path == '/api/disable':
                if not status()['tweakInstalled']:
                    raise ValueError('尚未安装 Nightfall 插件')
                DATA.mkdir(parents=True, exist_ok=True)
                temp = DATA / 'live.json.tmp'
                temp.write_text('{"enabled":false}', encoding='utf-8')
                temp.replace(DATA / 'live.json')
                self.send_json(200, {'ok': True, 'message': '关闭指令已写入配置；请检查客户端是否恢复原状'})
            elif path == '/api/install-and-apply':
                if length > 2_000_000:
                    raise ValueError('主题配置过大')
                data = valid_theme(json.loads(self.rfile.read(length)))
                install_tweak()
                DATA.mkdir(parents=True, exist_ok=True)
                (DATA / 'live.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
                self.send_json(200, {'ok': True, **status()})
            elif path == '/api/media':
                if not status()['runtimeDetected']:
                    raise ValueError('桌面运行时未就绪。素材可在预览中使用，但不能传入官方客户端。')
                q = parse_qs(urlsplit(self.path).query)
                kind = (q.get('kind') or [''])[0]
                mime = self.headers.get('X-Nightfall-Mime', '')[:80].lower()
                if kind not in ('image', 'video') or not mime.startswith(kind + '/'):
                    raise ValueError('请选择图片或视频文件')
                if shutil.disk_usage(DATA.parent if DATA.parent.exists() else APPDATA).free < length * 1.55 + 1024 * 1024:
                    raise ValueError('磁盘空间不足，无法保存背景素材')
                media_dir = DATA / 'media'
                media_dir.mkdir(parents=True, exist_ok=True)
                h = hashlib.sha256()
                with tempfile.TemporaryDirectory(dir=media_dir) as tmp:
                    pending = length
                    chunks = 0
                    while pending:
                        block = self.rfile.read(min(CHUNK, pending))
                        if not block:
                            raise ValueError('文件没有完整传输')
                        h.update(block)
                        (Path(tmp) / f'{chunks:06d}.b64').write_text(base64.b64encode(block).decode('ascii'), encoding='ascii')
                        chunks += 1
                        pending -= len(block)
                    key = h.hexdigest()
                    # Never trust a path provided by the browser.
                    for i in range(chunks):
                        dst = media_dir / f'{key}-{i:06d}.b64'
                        src = Path(tmp) / f'{i:06d}.b64'
                        if not dst.exists():
                            src.replace(dst)
                    meta = {'mediaKey': key, 'kind': kind, 'mime': mime, 'chunks': chunks, 'size': length}
                    (media_dir / f'{key}.json').write_text(json.dumps(meta), encoding='utf-8')
                self.send_json(200, {'ok': True, 'mediaKey': key, 'size': length, 'chunks': chunks})
            else:
                self.send_json(404, {'error': 'Unknown command'})
        except (ValueError, OSError, json.JSONDecodeError) as ex:
            self.send_json(400, {'error': str(ex)})


def main():
    # Probe port dynamically: no admin or firewall rule is required.
    with ThreadingHTTPServer(('127.0.0.1', 0), Handler) as server:
        server.daemon_threads = True
        url = f'http://127.0.0.1:{server.server_port}/studio/index.html'
        print('Nightfall Studio · LOCAL ONLY')
        print(url)
        print('Press Ctrl+C to stop. This server accepts no remote connections.')
        # Browser startup can be disabled for headless tests.
        if os.environ.get('NIGHTFALL_NO_BROWSER') != '1':
            threading.Timer(.25, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
