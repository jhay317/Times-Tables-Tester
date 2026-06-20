import http.server
import json
import os
import argparse
import sys
import webbrowser
import socket

RESULTS_FILE = "results.json"


class MathGalaxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent caching for api calls and local dev resources
        if self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            results_path = os.path.join(os.getcwd(), RESULTS_FILE)
            data = {}
            if os.path.exists(results_path):
                try:
                    with open(results_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except Exception as e:
                    print(f"Error loading results.json: {e}", file=sys.stderr)
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/stats':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                new_data = json.loads(post_data.decode('utf-8'))
                results_path = os.path.join(os.getcwd(), RESULTS_FILE)
                
                # Load existing stats
                existing_data = {}
                if os.path.exists(results_path):
                    try:
                        with open(results_path, 'r', encoding='utf-8') as f:
                            existing_data = json.load(f)
                    except Exception:
                        pass
                
                # Merge incoming stats with existing
                for table_key, new_stats in new_data.items():
                    if table_key not in existing_data:
                        existing_data[table_key] = {
                            "attempts": 0,
                            "successes": 0,
                            "failures": 0,
                            "best_time": None
                        }
                    
                    stats = existing_data[table_key]
                    stats["attempts"] += new_stats.get("attempts", 0)
                    stats["successes"] += new_stats.get("successes", 0)
                    stats["failures"] += new_stats.get("failures", 0)
                    
                    # Update best time if a new best time is provided
                    incoming_best = new_stats.get("best_time")
                    if incoming_best is not None:
                        current_best = stats.get("best_time")
                        if current_best is None or incoming_best < current_best:
                            stats["best_time"] = incoming_best
                
                # Save merged stats
                with open(results_path, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, indent=2)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(existing_data).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")


def get_free_port(host, start_port):
    """Find an available port starting from start_port."""
    port = start_port
    while port < start_port + 100:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, port))
                return port
            except OSError:
                port += 1
    return start_port


def main():
    parser = argparse.ArgumentParser(description="Math Galaxy Explorer HTTP Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host address to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8080, help="Preferred port (default: 8080)")
    parser.add_argument("--no-browser", action="store_true", help="Do not open the web browser automatically")
    args = parser.parse_args()

    # If host is 0.0.0.0 or binding fails, we detect free ports
    port = get_free_port(args.host, args.port)
    
    server_address = (args.host, port)
    
    try:
        httpd = http.server.HTTPServer(server_address, MathGalaxyHandler)
        print(f"[OK] Math Galaxy Explorer server started at http://{args.host}:{port}")
        
        # Open web browser if not running in Docker / no-browser mode
        if not args.no_browser:
            url = f"http://localhost:{port}"
            # Run browser launch slightly deferred to ensure socket is listening
            print(f"[INFO] Opening {url} in your default browser...")
            webbrowser.open(url)
            
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] Error starting server: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
