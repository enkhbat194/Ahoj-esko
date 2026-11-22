#!/usr/bin/env python3
"""HTTP smoke test for Ahoj Render previews, no secrets and no changes to deployments."""
import json
import socket
import ssl
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

MAIN = "https://ahoj-cesko-main-server-preview.onrender.com"
UI = "https://cesky-reading-uiux-preview.onrender.com"
OLD = "https://ahoj-cesko-ios-l01-preview.onrender.com"
FACTORY = "https://ahoj-audio-factory-free-poc.onrender.com"

checks = [
    ("Unified new reading app at root", MAIN + "/?smoke=unified", "GET", None, (200,), 'class="app-shell"'),
    ("New UI under same server", MAIN + "/cesky-reading-uiux/index.html?smoke=20261122", "GET", None, (200,), 'reader-experience.js?v=4'),
    ("Responsive iPhone layout CSS v1", MAIN + "/cesky-reading-uiux/index.html?smoke=viewport1", "GET", None, (200,), "MOBILE VIEWPORT v1"),
    ("New reader v4 guided CSS reference", MAIN + "/cesky-reading-uiux/index.html?smoke=reader2", "GET", None, (200,), "reader-experience.css?v=4"),
    ("New reader v4 STT/TTS JS reference", MAIN + "/cesky-reading-uiux/index.html?smoke=reader2", "GET", None, (200,), "reader-experience.js?v=4"),
    ("PWA service worker includes modern reader navigation", MAIN + "/sw.js?smoke=pwa2", "GET", None, (200,), "cesky-reading-uiux"),
    ("Reader player JavaScript", MAIN + "/cesky-reading-uiux/reader-experience.js?smoke=reader1", "GET", None, (200,), "AhojReaderExperience"),
    ("Reader player responsive stylesheet", MAIN + "/cesky-reading-uiux/reader-experience.css?smoke=reader1", "GET", None, (200,), "aho-reader-shell"),
    ("Health", MAIN + "/api/health?smoke=20261122", "GET", None, (200,), None),
    ("Reading AI input validation (must reject empty input)", MAIN + "/api/ai/reading-help", "POST", b"{}", (400,), None),
    ("Audio Factory health", FACTORY + "/api/health?smoke=20261122", "GET", None, (200,), '"auth_required":true'),
    ("Audio Factory read-only guard", FACTORY + "/api/state", "POST", b"{}", (403,), "FREE_HOSTING_READ_ONLY"),
]

failures = 0
# Diagnose the user's Chrome iOS "Connection is not secure" warning separately
# from HTTP 200 health checks. Default SSL trust validation is mandatory.
try:
    host = urlparse(MAIN).hostname
    with socket.create_connection((host, 443), timeout=20) as sock:
        with ssl.create_default_context().wrap_socket(sock, server_hostname=host) as tls:
            cert = tls.getpeercert()
            print("PASS TLS certificate verified:", tls.version(), "expires", cert.get("notAfter"))
    with urllib.request.urlopen("http://" + host + "/?transport_probe=1", timeout=45) as response:
        final_url = response.geturl()
        print("HTTP navigation final URL:", final_url)
        if not final_url.startswith("https://"):
            raise ValueError("HTTP navigation did not upgrade to HTTPS")
        print("PASS HTTP → HTTPS redirect")
    with urllib.request.urlopen(MAIN + "/?transport_probe=2", timeout=45) as response:
        print("HTTPS headers:", {
            "HSTS": response.headers.get("Strict-Transport-Security"),
            "CSP": response.headers.get("Content-Security-Policy"),
        })
except Exception as exc:
    failures += 1
    print("FAIL browser transport/security probe:", type(exc).__name__, str(exc)[:250])

for label, url, method, data, expected, marker in checks:
    result = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(
                url,
                data=data,
                method=method,
                headers={"Accept": "text/html, application/json", "Cache-Control": "no-cache", "Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=85) as resp:
                status = resp.status
                body = resp.read(2_000_000).decode("utf-8", "replace")
                result = (status, body)
            if status in expected:
                break
        except urllib.error.HTTPError as exc:
            result = (exc.code, exc.read(4096).decode("utf-8", "replace"))
            if exc.code in expected:
                break
            print(f"  {label}: HTTP {exc.code}, attempt {attempt+1}/4")
        except Exception as exc:
            print(f"  {label}: {type(exc).__name__}: {str(exc)[:180]}, attempt {attempt+1}/4")
        if attempt < 3:
            time.sleep(5 * (attempt + 1))

    if result is None:
        print(f"FAIL {label}: no HTTP response")
        failures += 1
        continue

    status, body = result
    if status not in expected:
        print(f"FAIL {label}: HTTP {status}, expected {expected}")
        failures += 1
        continue
    if marker and marker.lower() not in body.lower():
        print(f"FAIL {label}: HTTP {status}, missing HTML fingerprint {marker!r}")
        failures += 1
        continue

    if label == "Health":
        try:
            value = json.loads(body)
            if value.get("ok") is not True:
                raise ValueError("ok != true")
            print(f"PASS {label}: HTTP {status}, aiConfigured={bool(value.get('aiConfigured'))} (presence only, not a live Gemini API test)")
        except (ValueError, json.JSONDecodeError) as exc:
            print(f"FAIL {label}: invalid health JSON: {exc}")
            failures += 1
    else:
        print(f"PASS {label}: HTTP {status}, response length {len(body)} chars")

print(f"Smoke test result: {len(checks)-failures}/{len(checks)} passed")
sys.exit(1 if failures else 0)
