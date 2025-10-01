#!/usr/bin/env python3
import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Change to the directory containing the files
os.chdir(Path(__file__).parent)

PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler

print(f"🚌 Bus Tracker Demo Server")
print(f"📂 Serving files from: {os.getcwd()}")
print(f"🌐 Server starting on http://localhost:{PORT}")
print(f"📱 Open http://localhost:{PORT}/demo.html to view your Bus Tracker!")
print(f"🔗 API Documentation: http://localhost:{PORT}/README.md")
print(f"⚡ Press Ctrl+C to stop the server")

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"✅ Server running successfully!")
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}/demo.html')
            print(f"🎯 Browser opened automatically!")
        except:
            print(f"💡 Manually open: http://localhost:{PORT}/demo.html")
        
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print(f"\n🛑 Server stopped by user")
except OSError as e:
    if "Address already in use" in str(e):
        print(f"❌ Port {PORT} is already in use. Try a different port or stop the existing server.")
    else:
        print(f"❌ Error starting server: {e}")
