import os, base64
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.abspath(os.getcwd())  # текущая папка = корень
TOKEN = os.environ.get("BRIDGE_TOKEN", "CHANGE_ME")

class H(BaseHTTPRequestHandler):
    def _send(self, code, body=b""):
        self.send_response(code)
        self.end_headers()
        self.wfile.write(body)
    
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        if q.get("token", [""])[0] != TOKEN:
            return self._send(403, b"forbidden")
        
        if self.path.startswith("/write"):
            rel = q.get("path", [""])[0]
            data = q.get("data", [""])[0]
            if not rel:
                return self._send(400, b"missing path")
            
            try:
                content = base64.urlsafe_b64decode(data.encode()) if data else b""
                full = os.path.abspath(os.path.join(ROOT, rel))
                if not full.startswith(ROOT):
                    return self._send(400, b"bad path")
                
                os.makedirs(os.path.dirname(full), exist_ok=True)
                with open(full, "wb") as f:
                    f.write(content)
                return self._send(200, b"ok")
            except Exception as e:
                return self._send(500, str(e).encode())
        
        return self._send(404, b"not found")

if __name__ == "__main__":
    print(f"Bridge server starting on 127.0.0.1:8077")
    print(f"Root directory: {ROOT}")
    print(f"Token: {TOKEN}")
    HTTPServer(("127.0.0.1", 8077), H).serve_forever()