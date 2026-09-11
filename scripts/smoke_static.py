#!/usr/bin/env python3
from __future__ import annotations
import contextlib, http.server, socketserver, threading, urllib.request, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FILES=['index.html','app.js','styles.css','manifest.webmanifest','sw.js','data/clinical-data.json','data/nag-topics.json','icons/icon-192.png']
errors=[]

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

class TCP(socketserver.TCPServer):
    allow_reuse_address=True

with contextlib.chdir(ROOT):
    with TCP(('127.0.0.1',0), Quiet) as srv:
        port=srv.server_address[1]
        t=threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            for rel in FILES:
                url=f'http://127.0.0.1:{port}/{rel}'
                try:
                    with urllib.request.urlopen(url, timeout=5) as r:
                        body=r.read()
                        if r.status != 200: errors.append(f'{rel}: HTTP {r.status}')
                        if not body: errors.append(f'{rel}: empty response')
                except Exception as e:
                    errors.append(f'{rel}: {e}')
        finally:
            srv.shutdown(); t.join(timeout=2)

print('AbxHub static HTTP smoke test')
print(f'Checked: {len(FILES)} core assets')
print(f'Errors: {len(errors)}')
for e in errors: print('ERROR:',e)
if errors: sys.exit(1)
