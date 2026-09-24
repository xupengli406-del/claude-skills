#!/usr/bin/env python3
"""Direct HeyGen v3 API client. Credentials stay in the macOS Keychain.

Sources: developers.heygen.com/docs/quick-start, /reference/upload-asset,
/audio-to-video. No automatic retries for paid mutations.
"""
import argparse
import json
import mimetypes
import os
import subprocess
import urllib.error
import urllib.request
import uuid
from pathlib import Path

SERVICE = "codex.produce-digital-avatar-social-video.heygen-api-key"
BASE = "https://api.heygen.com"


def request(path, payload=None, file=None, idempotency=None):
    if not path.startswith("/v3/"):
        raise ValueError("Only official HeyGen v3 endpoints are accepted")
    key = os.environ.get("HEYGEN_API_KEY", "").strip()
    if not key:
        try:
            key = subprocess.run(
                ["security", "find-generic-password", "-a", "default", "-s", SERVICE, "-w"],
                capture_output=True, text=True, check=True,
            ).stdout.strip()
        except (OSError, subprocess.CalledProcessError):
            raise RuntimeError("Configure HEYGEN_API_KEY or the documented macOS Keychain service") from None
    if not key:
        raise RuntimeError("HeyGen API credential is empty")
    headers = {"X-Api-Key": key}
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode()
    if file is not None:
        file = Path(file)
        boundary = "codex-" + uuid.uuid4().hex
        mime = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
        headers["Content-Type"] = "multipart/form-data; boundary=" + boundary
        data = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; '
                f'filename="upload{file.suffix}"\r\nContent-Type: {mime}\r\n\r\n').encode()
        data += file.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    if idempotency:
        headers["Idempotency-Key"] = idempotency
    req = urllib.request.Request(BASE + path, data=data, headers=headers,
                                 method="POST" if data is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        detail = exc.read(4096).decode(errors="replace")
        raise RuntimeError(f"HeyGen HTTP {exc.code}: {detail}") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path")
    parser.add_argument("--payload", type=Path)
    parser.add_argument("--upload", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--idempotency")
    args = parser.parse_args()
    if args.payload and args.upload:
        parser.error("Choose JSON payload or uploaded file")
    if (args.payload or args.upload) and not args.idempotency:
        parser.error("Mutations require a stable idempotency key")
    if args.output.exists() and (args.payload or args.upload):
        parser.error("Mutation response already exists; inspect it instead of resubmitting")
    payload = json.loads(args.payload.read_text()) if args.payload else None
    result = request(args.path, payload, args.upload, args.idempotency)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    data = result.get("data", result)
    print(json.dumps({k: data[k] for k in ["video_id", "asset_id", "status"] if k in data}))


if __name__ == "__main__":
    main()
