import http.server
import json
import os
import argparse
import sys
import webbrowser
import socket
import hashlib
import hmac
import base64
import time
import secrets
from urllib.parse import urlparse

RESULTS_FILE = "results.json"
USERS_FILE = "users.json"
SECRET_KEY = "math-galaxy-explorer-secret-key-salt-2026".encode("utf-8")


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def b64url_decode(s: str) -> bytes:
    pad = len(s) % 4
    if pad:
        s += '=' * (4 - pad)
    return base64.urlsafe_b64decode(s.encode('utf-8'))


def hash_pin(pin: str, salt_hex: str) -> str:
    salt_bytes = bytes.fromhex(salt_hex)
    key = hashlib.pbkdf2_hmac('sha256', pin.encode('utf-8'), salt_bytes, 50000)
    return key.hex()


def create_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    exp = int(time.time()) + (30 * 24 * 60 * 60)
    full_payload = dict(payload)
    full_payload["exp"] = exp

    enc_header = b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    enc_payload = b64url_encode(json.dumps(full_payload, separators=(',', ':')).encode('utf-8'))
    data_to_sign = f"{enc_header}.{enc_payload}".encode('utf-8')

    sig = hmac.new(SECRET_KEY, data_to_sign, hashlib.sha256).digest()
    enc_sig = b64url_encode(sig)
    return f"{enc_header}.{enc_payload}.{enc_sig}"


def verify_token(token: str) -> dict:
    if not token or not isinstance(token, str):
        return None
    parts = token.split('.')
    if len(parts) != 3:
        return None
    enc_header, enc_payload, enc_sig = parts
    data_to_sign = f"{enc_header}.{enc_payload}".encode('utf-8')
    expected_sig = hmac.new(SECRET_KEY, data_to_sign, hashlib.sha256).digest()
    try:
        actual_sig = b64url_decode(enc_sig)
        if not hmac.compare_digest(actual_sig, expected_sig):
            return None
        payload = json.loads(b64url_decode(enc_payload).decode('utf-8'))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def load_user_db() -> dict:
    users_path = os.path.join(os.getcwd(), USERS_FILE)
    if os.path.exists(users_path):
        try:
            with open(users_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {USERS_FILE}: {e}", file=sys.stderr)
    return {"users": {}, "stats": {}}


def save_user_db(db: dict) -> None:
    users_path = os.path.join(os.getcwd(), USERS_FILE)
    try:
        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=2)
    except Exception as e:
        print(f"Error saving {USERS_FILE}: {e}", file=sys.stderr)


class MathGalaxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent caching for api calls and local dev resources
        if self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id')
        super().end_headers()

    def do_OPTIONS(self):
        if self.path.startswith('/api/'):
            self.send_response(204)
            self.end_headers()
        else:
            super().do_OPTIONS()

    def get_authenticated_user(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            payload = verify_token(token)
            if payload and payload.get('userId'):
                return payload

        custom_user_id = self.headers.get('X-User-Id')
        if custom_user_id:
            return {'userId': custom_user_id, 'username': custom_user_id, 'displayName': custom_user_id}

        return None

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/auth/me':
            user = self.get_authenticated_user()
            if not user:
                return self.send_json({"error": "Unauthorized"}, 401)
            return self.send_json({"user": user})

        elif path == '/api/auth/profiles':
            db = load_user_db()
            profiles = []
            for u in db.get("users", {}).values():
                profiles.append({
                    "id": u.get("id"),
                    "username": u.get("username"),
                    "displayName": u.get("displayName"),
                    "avatar": u.get("avatar", "dog"),
                    "createdAt": u.get("createdAt", 0)
                })
            return self.send_json({"profiles": profiles})

        elif path == '/api/stats':
            user = self.get_authenticated_user()
            user_id = user.get('userId') if user else 'guest'

            db = load_user_db()
            stats_dict = db.get("stats", {})
            user_stats = stats_dict.get(user_id)

            if user_stats is None:
                # If guest and not in users.json, check legacy results.json
                results_path = os.path.join(os.getcwd(), RESULTS_FILE)
                if user_id == 'guest' and os.path.exists(results_path):
                    try:
                        with open(results_path, 'r', encoding='utf-8') as f:
                            user_stats = json.load(f)
                    except Exception:
                        user_stats = {}
                else:
                    user_stats = {}

            return self.send_json(user_stats)

        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        if path == '/api/auth/register':
            username = str(body.get('username', '')).strip().lower()
            display_name = str(body.get('displayName', '')).strip() or username
            avatar = body.get('avatar', 'dog')
            pin = str(body.get('pin', '')).strip()

            if len(username) < 2:
                return self.send_json({"error": "Username must be at least 2 characters."}, 400)
            if not pin.isdigit() or len(pin) != 4:
                return self.send_json({"error": "PIN must be a 4-digit code (e.g. 1234)."}, 400)

            db = load_user_db()
            for u in db.get("users", {}).values():
                if u.get("username") == username:
                    return self.send_json({"error": f'Username "{username}" is already taken.'}, 409)

            user_id = f"usr_{secrets.token_hex(8)}"
            salt = secrets.token_hex(16)
            pin_hash = hash_pin(pin, salt)

            user_record = {
                "id": user_id,
                "username": username,
                "displayName": display_name,
                "avatar": avatar,
                "pinHash": pin_hash,
                "salt": salt,
                "createdAt": int(time.time() * 1000)
            }

            if "users" not in db:
                db["users"] = {}
            db["users"][user_id] = user_record
            save_user_db(db)

            token_payload = {
                "userId": user_id,
                "username": username,
                "displayName": display_name,
                "avatar": avatar
            }
            token = create_token(token_payload)

            return self.send_json({
                "success": True,
                "user": token_payload,
                "token": token
            }, 201)

        elif path == '/api/auth/login':
            username = str(body.get('username', '')).strip().lower()
            user_id = body.get('userId')
            pin = str(body.get('pin', '')).strip()

            if not pin.isdigit() or len(pin) != 4:
                return self.send_json({"error": "Please enter a valid 4-digit PIN."}, 400)

            db = load_user_db()
            target_user = None

            if user_id and user_id in db.get("users", {}):
                target_user = db["users"][user_id]
            else:
                for u in db.get("users", {}).values():
                    if u.get("username") == username:
                        target_user = u
                        break

            if not target_user:
                return self.send_json({"error": "Explorer profile not found."}, 404)

            computed_hash = hash_pin(pin, target_user.get("salt", ""))
            if computed_hash != target_user.get("pinHash"):
                return self.send_json({"error": "Incorrect 4-digit PIN. Please try again."}, 401)

            token_payload = {
                "userId": target_user["id"],
                "username": target_user["username"],
                "displayName": target_user.get("displayName", target_user["username"]),
                "avatar": target_user.get("avatar", "dog")
            }
            token = create_token(token_payload)

            return self.send_json({
                "success": True,
                "user": token_payload,
                "token": token
            })

        elif path == '/api/stats':
            user = self.get_authenticated_user()
            user_id = user.get('userId') if user else 'guest'

            try:
                db = load_user_db()
                if "stats" not in db:
                    db["stats"] = {}
                existing_data = db["stats"].get(user_id, {})

                # Merge incoming stats with existing
                for table_key, new_stats in body.items():
                    if table_key == "rewards_data":
                        if "rewards_data" not in existing_data:
                            existing_data["rewards_data"] = {}
                        rew = existing_data["rewards_data"]

                        # Update bonus_stars
                        if "bonus_stars" in new_stats:
                            rew["bonus_stars"] = max(rew.get("bonus_stars", 0), new_stats["bonus_stars"])

                        # Merge daily logs
                        if "daily_logs" in new_stats and isinstance(new_stats["daily_logs"], dict):
                            if "daily_logs" not in rew:
                                rew["daily_logs"] = {}
                            for date_str, log_entry in new_stats["daily_logs"].items():
                                if date_str not in rew["daily_logs"]:
                                    rew["daily_logs"][date_str] = log_entry
                                else:
                                    curr = rew["daily_logs"][date_str]
                                    curr["seconds_played"] = max(curr.get("seconds_played", 0), log_entry.get("seconds_played", 0))
                                    curr["goal_completed"] = curr.get("goal_completed", False) or log_entry.get("goal_completed", False)

                        # Merge unlocked items
                        if "unlocked_items" in new_stats and isinstance(new_stats["unlocked_items"], list):
                            existing_items = set(rew.get("unlocked_items", []))
                            existing_items.update(new_stats["unlocked_items"])
                            rew["unlocked_items"] = list(existing_items)

                        # Merge equipped items
                        if "equipped_items" in new_stats and isinstance(new_stats["equipped_items"], dict):
                            if "equipped_items" not in rew:
                                rew["equipped_items"] = {"hat": None, "trail": None}
                            rew["equipped_items"].update(new_stats["equipped_items"])

                        # Merge weekly history
                        if "weekly_history" in new_stats and isinstance(new_stats["weekly_history"], dict):
                            if "weekly_history" not in rew:
                                rew["weekly_history"] = {}
                            rew["weekly_history"].update(new_stats["weekly_history"])

                        # Parent settings
                        if "parent_settings" in new_stats and isinstance(new_stats["parent_settings"], dict):
                            if "parent_settings" not in rew:
                                rew["parent_settings"] = {}
                            rew["parent_settings"].update(new_stats["parent_settings"])

                        continue

                    if table_key not in existing_data:
                        existing_data[table_key] = {
                            "attempts": 0,
                            "successes": 0,
                            "failures": 0,
                            "best_time": None
                        }

                    stats = existing_data[table_key]
                    if isinstance(new_stats, dict):
                        stats["attempts"] = stats.get("attempts", 0) + new_stats.get("attempts", 0)
                        stats["successes"] = stats.get("successes", 0) + new_stats.get("successes", 0)
                        stats["failures"] = stats.get("failures", 0) + new_stats.get("failures", 0)

                        incoming_best = new_stats.get("best_time")
                        if incoming_best is not None:
                            current_best = stats.get("best_time")
                            if current_best is None or incoming_best < current_best:
                                stats["best_time"] = incoming_best

                # Save merged stats to users.json
                db["stats"][user_id] = existing_data
                save_user_db(db)

                # Also sync guest stats to results.json for backwards compatibility
                if user_id == 'guest':
                    results_path = os.path.join(os.getcwd(), RESULTS_FILE)
                    try:
                        with open(results_path, 'w', encoding='utf-8') as f:
                            json.dump(existing_data, f, indent=2)
                    except Exception:
                        pass

                return self.send_json(existing_data)
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)
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

    port = get_free_port(args.host, args.port)
    server_address = (args.host, port)

    try:
        httpd = http.server.HTTPServer(server_address, MathGalaxyHandler)
        print(f"[OK] Math Galaxy Explorer server started at http://{args.host}:{port}")

        if not args.no_browser:
            url = f"http://localhost:{port}"
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
