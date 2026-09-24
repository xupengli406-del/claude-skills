#!/usr/bin/env python3
"""Validate this user's default 3:4 and 4:3 PNG covers at any exact resolution."""
from __future__ import annotations
import argparse
import struct
from pathlib import Path

EXPECTED = {'3比4': (3, 4), '4比3': (4, 3)}

def png_size(path: Path) -> tuple[int, int]:
    with path.open('rb') as handle:
        header = handle.read(24)
    if len(header) != 24 or header[:8] != b'\x89PNG\r\n\x1a\n' or header[12:16] != b'IHDR':
        raise ValueError('invalid PNG header')
    return struct.unpack('>II', header[16:24])

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output_dir', type=Path)
    parser.add_argument('--topic', required=True)
    args = parser.parse_args()
    errors = []
    for label, (rw, rh) in EXPECTED.items():
        files = sorted(args.output_dir.glob(f'{args.topic}_*{label}.png'))
        if len(files) != 1:
            errors.append(f'{label}: expected one PNG, found {len(files)}')
            continue
        try:
            width, height = png_size(files[0])
            if width <= 0 or height <= 0 or width * rh != height * rw:
                errors.append(f'{files[0].name}: {width}x{height} is not exact {rw}:{rh}')
        except (OSError, ValueError, struct.error) as exc:
            errors.append(f'{files[0].name}: {exc}')
    for label in ['9比16', '16比9']:
        for file in args.output_dir.glob(f'{args.topic}_*{label}.png'):
            errors.append(f'{file.name}: excluded by the current two-ratio cover preference')
    for error in errors:
        print('ERROR:', error)
    if not errors:
        print('OK: exact 3:4 and 4:3 PNG covers; no excluded ratio covers')
    return 1 if errors else 0

if __name__ == '__main__':
    raise SystemExit(main())
