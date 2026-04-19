#!/usr/bin/env python3
"""Local server to serve files for browser-based Netlify deploy"""
import http.server, json, os, hashlib

PORT = 8765
BASE = os.path.dirname(os.path.abspath(__file__))
SKIP = {'.', '__pycache__', 'images_small', '.git', '.netlify'}
SKIP_FILES = {'deploy-page.html', 'deploy-server.py', 'deploy.py', 'bkl-home-standalone.html', 'bklhome.store'}

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/filelist.json':
            files = []
            for root, dirs, fnames in os.walk(BASE):
                dirs[:] = [d for d in dirs if d not in SKIP and not d.startswith('.')]
                for f in fnames:
                    if f.startswith('.') or f in SKIP_FILES: continue
                    fp = os.path.join(root, f)
                    rp = '/' + os.path.relpath(fp, BASE)
                    files.append({'path': rp, 'size': os.path.getsize(fp)})
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(files).encode())
        elif self.path.startswith('/files/'):
            fp = os.path.join(BASE, self.path[7:])
            if os.path.isfile(fp):
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                with open(fp, 'rb') as f: self.wfile.write(f.read())
            else:
                self.send_error(404)
        elif self.path == '/' or self.path == '/deploy-page.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            with open(os.path.join(BASE, 'deploy-page.html'), 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        print(f"[Server] {args[0]}")

print(f"🚀 Deploy server running at http://localhost:{PORT}")
print(f"📂 Serving from: {BASE}")
http.server.HTTPServer(('localhost', PORT), Handler).serve_forever()
