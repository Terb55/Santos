import http.server
import socketserver
import urllib.request
import urllib.error
import sys
import os

PORT = 8080
BACKEND_URL = "http://localhost:8000"

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_proxy(self, method):
        if self.path.startswith("/api"):
            url = f"{BACKEND_URL}{self.path}"
            print(f"Proxying {method} {self.path} -> {url}")
            
            try:
                # Read Headers
                headers = {k: v for k, v in self.headers.items() if k.lower() != 'host'}
                
                # Read Body
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else None
                
                # Make Request
                req = urllib.request.Request(url, data=body, headers=headers, method=method)
                
                with urllib.request.urlopen(req) as response:
                    self.send_response(response.status)
                    for k, v in response.getheaders():
                        self.send_header(k, v)
                    self.end_headers()
                    self.wfile.write(response.read())
                    
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                for k, v in e.headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                self.send_error(500, f"Proxy Error: {e}")
        else:
            # Serve Static File
            super().do_GET()

    def do_GET(self):
        self.do_proxy("GET")

    def do_POST(self):
        self.do_proxy("POST")

    def do_OPTIONS(self):
        self.do_proxy("OPTIONS")

# Enable reuse address to avoid "Address already in use" errors during restarts
socketserver.TCPServer.allow_reuse_address = True

print(f"Starting Proxy Server at http://127.0.0.1:{PORT}")
print(f"Serving static files from {os.getcwd()}")
print(f"Proxying /api requests to {BACKEND_URL}")

with socketserver.TCPServer(("127.0.0.1", PORT), ProxyHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("Server stopped.")
