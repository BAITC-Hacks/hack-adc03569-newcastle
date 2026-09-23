#!/usr/bin/env python3
"""Local hackathon server. Python standard library only; not public production."""
from __future__ import annotations
import argparse
import json
import os
import sys
import threading
import time
import webbrowser
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
# Minimal .env reader, before AI configuration is used. Environment wins.
for line in (ROOT / ".env").read_text(encoding="utf-8-sig").splitlines() if (ROOT / ".env").is_file() else []:
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        key, value = line.split("=", 1)
        if key.strip() in {"OPENAI_API_KEY", "OPENAI_MODEL"}:
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

from app.engine import DATA, DATA_HASH, ENGINE_VERSION, InvalidScenario, baseline, compare, jsonable, simulate, sensitivity, validate
from app.ai import explain
from app.evidence import facts_for
from app.i18n import error_text

STATIC = {"/": ("web/index.html", "text/html"), "/index.html": ("web/index.html", "text/html"),
          "/style.css": ("web/style.css", "text/css"), "/app.js": ("web/app.js", "text/javascript"),
          "/favicon.svg": ("web/favicon.svg", "image/svg+xml"),
          "/sources/brief.pdf": ("sources/brief.pdf", "application/pdf"),
          "/sources/dataset.docx": ("sources/dataset.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
AI_LOCK = threading.Lock()
AI_TIMES: deque[float] = deque()


class Handler(BaseHTTPRequestHandler):
    server_version = "QalaLocal/1.1"
    sys_version = ""

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        super().end_headers()

    def send_json(self, data: dict, status: int = 200) -> None:
        if isinstance(data.get("error"), str):
            data = {**data, "message": error_text(data["error"])}
        encoded = json.dumps(jsonable(data), ensure_ascii=False, allow_nan=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def origin_ok(self) -> bool:
        host = self.headers.get("Host", "")
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != host:
            return False
        # Prevent DNS rebinding from an unrelated hostname in local default mode.
        if self.server.server_address[0] == "127.0.0.1":
            if urlsplit("//" + host).hostname not in ("127.0.0.1", "localhost"):
                return False
        return True

    def do_GET(self) -> None:
        if not self.origin_ok():
            return self.send_json({"error": "Origin not allowed"}, 403)
        path = urlsplit(self.path).path
        if path == "/api/health":
            return self.send_json({"ok": True, "version": ENGINE_VERSION,
                                  "ai_configured": bool(os.getenv("OPENAI_API_KEY", "").strip()),
                                  "live_connection_verified": False})
        if path == "/api/bootstrap":
            return self.send_json({"data": DATA, "dataset_sha256": DATA_HASH,
                                  "baseline": baseline(), "version": ENGINE_VERSION,
                                  "ai_configured": bool(os.getenv("OPENAI_API_KEY", "").strip())})
        if path not in STATIC:
            return self.send_json({"error": "Not found"}, 404)
        relative, mime = STATIC[path]
        raw = (ROOT / relative).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime + ("; charset=utf-8" if mime.startswith("text/") else ""))
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self) -> None:
        if not self.origin_ok():
            return self.send_json({"error": "Origin not allowed"}, 403)
        if self.headers.get_content_type() != "application/json":
            return self.send_json({"error": "Content-Type must be application/json"}, 415)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 65536:
                return self.send_json({"error": "Body must be 1..65536 bytes"}, 413)
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("JSON body must be an object")
            path = urlsplit(self.path).path
            decisions = payload.get("decisions")
            if path == "/api/validate":
                complete = payload.get("complete", True)
                if type(complete) is not bool:
                    raise ValueError("complete must be boolean")
                return self.send_json(validate(decisions, complete=complete))
            if path == "/api/simulate":
                return self.send_json(simulate(decisions))
            if path == "/api/compare":
                return self.send_json(compare(payload.get("a"), payload.get("b")))
            if path == "/api/sensitivity":
                return self.send_json(sensitivity(decisions, payload.get("measure_id"), payload.get("extra_lag")))
            if path == "/api/evidence":
                return self.send_json({"facts": facts_for(simulate(decisions))})
            if path == "/api/explain":
                # Local demo abuse guard: no more than 8 explanation requests per minute.
                with AI_LOCK:
                    now = time.monotonic()
                    while AI_TIMES and now - AI_TIMES[0] > 60:
                        AI_TIMES.popleft()
                    if len(AI_TIMES) >= 8:
                        return self.send_json({"error": "Please wait: explanation limit is 8 requests/minute."}, 429)
                    AI_TIMES.append(now)
                return self.send_json(explain(decisions, payload.get("question", ""), payload.get("lang", "kk")))
            return self.send_json({"error": "Not found"}, 404)
        except InvalidScenario as exc:
            return self.send_json({"error": "invalid_scenario", "validation": exc.validation, "score": None}, 422)
        except (ValueError, UnicodeDecodeError, TypeError) as exc:
            return self.send_json({"error": str(exc)}, 400)
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception:
            # Never expose credentials, stack traces or upstream response bodies.
            print("Request failed (internal error)", file=sys.stderr)
            return self.send_json({"error": "Internal server error"}, 500)

    def log_message(self, fmt: str, *args: object) -> None:
        # Request path/status only; no questions, request bodies or keys.
        print("[QALA] " + (fmt % args))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run QALA LAB locally")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--open", action="store_true", help="Open browser")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("Port must be between 1 and 65535")
    try:
        server = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as exc:
        print(f"Cannot start server: {exc}\nTry: python server.py --port 8001", file=sys.stderr)
        raise SystemExit(1)
    server.daemon_threads = True
    address = f"http://127.0.0.1:{args.port}"
    print(f"\nQALA LAB | {address}\nLocal demo. Stop with Ctrl+C.\n")
    if args.open:
        threading.Timer(0.5, lambda: webbrowser.open(address)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nQALA LAB stopped.")
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
