#!/usr/bin/env python3
"""Restore chunked binary assets from assets/.parts and verify SHA-256."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
MANIFEST = SKILL_ROOT / "assets" / ".parts" / "manifest.json"


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            sha.update(block)
    return sha.hexdigest()


def restore(check_only: bool = False) -> list[str]:
    if not MANIFEST.exists():
        return ["No chunk manifest found; bundled assets are already available."]

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    messages: list[str] = []
    for item in manifest["assets"]:
        target = SKILL_ROOT / item["target"]
        expected_size = int(item["size"])
        expected_sha = item["sha256"]
        if target.exists() and target.stat().st_size == expected_size and digest(target) == expected_sha:
            messages.append(f"OK {item['target']}")
            continue
        if check_only:
            raise SystemExit(f"Missing or invalid asset: {item['target']}")

        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_name(target.name + ".restoring")
        with temporary.open("wb") as output:
            for relative_part in item["parts"]:
                part = SKILL_ROOT / relative_part
                if not part.exists():
                    raise SystemExit(f"Missing asset part: {relative_part}")
                with part.open("rb") as source:
                    for block in iter(lambda: source.read(1024 * 1024), b""):
                        output.write(block)
        if temporary.stat().st_size != expected_size or digest(temporary) != expected_sha:
            temporary.unlink(missing_ok=True)
            raise SystemExit(f"Checksum failed while restoring {item['target']}")
        os.replace(temporary, target)
        messages.append(f"RESTORED {item['target']}")
    return messages


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify only; do not reconstruct files")
    args = parser.parse_args()
    print("\n".join(restore(check_only=args.check)))


if __name__ == "__main__":
    main()
