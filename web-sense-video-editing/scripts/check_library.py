#!/usr/bin/env python3
"""检查方法、配方、来源覆盖和证据依赖。只读，不等同于成片验收。"""
from pathlib import Path
import hashlib
import json
import re
import sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
REFS = ROOT / 'references'


def check():
    errors = []
    techniques = {}
    recipes = {}
    for path in REFS.glob('*.md'):
        text = path.read_text(encoding='utf-8')
        for ident, name in re.findall(r'^## ((?:V|S|R)\d{2}) (.+)$', text, flags=re.M):
            target = recipes if ident.startswith('R') else techniques
            if ident in target:
                errors.append(f'重复 ID：{ident}')
            target[ident] = (path, name)
            if f'id="{ident}"' not in text:
                errors.append(f'缺少链接锚点：{ident}')
    if not techniques:
        errors.append('没有技法条目')
    contracts_path = REFS / 'method-contracts.json'
    if not contracts_path.is_file():
        errors.append('缺少方法执行约束')
    else:
        contracts = json.loads(contracts_path.read_text())['methods']
        for ident in sorted(set(techniques) - set(contracts)):
            errors.append(f'技法缺少执行约束：{ident}')
        for ident in sorted(set(contracts) - set(techniques)):
            errors.append(f'执行约束指向不存在的技法：{ident}')
    covered = set()
    counts = []
    for manifest in sorted((REFS / 'cases').glob('*/coverage.json')):
        folder = manifest.parent
        data = json.loads(manifest.read_text(encoding='utf-8'))
        duration = data['duration_ms'] / 1000
        registered = set()
        for media in data['media_files']:
            path = (folder / media['path']).resolve()
            if not path.is_relative_to(folder.resolve()):
                errors.append(f'证据路径越出案例目录：{path}')
                continue
            registered.add(media['path'])
            if not path.is_file():
                errors.append(f'缺少证据：{path}')
            elif hashlib.sha256(path.read_bytes()).hexdigest() != media['sha256']:
                errors.append(f'证据哈希不符：{path}')
        for group in ('annotations', 'observations'):
            for item in data[group]:
                if not item.get('label') or not item.get('technique_ids'):
                    errors.append(f'空覆盖条目：{manifest}')
                if not 0 <= item['time_seconds'] < duration:
                    errors.append(f'时间越界：{item}')
                if item['snapshot'] not in registered:
                    errors.append(f'截图未登记：{item["snapshot"]}')
                for ident in item['technique_ids']:
                    if ident not in techniques:
                        errors.append(f'来源映射到不存在的技法：{ident}')
                    covered.add(ident)
        counts.append((data['case_id'], len(data['annotations']), len(data['observations']), len(registered)))
    for ident in sorted(set(techniques) - covered):
        errors.append(f'技法缺少来源覆盖：{ident}')
    all_ids = set(techniques) | set(recipes)
    for path in ROOT.rglob('*.md'):
        text = path.read_text(encoding='utf-8')
        for ident in set(re.findall(r'\b(?:V|S|R)\d{2}\b', text)) - all_ids:
            errors.append(f'引用不存在的技法/配方：{path.name} → {ident}')
        for target in re.findall(r'\]\(([^)]+)\)', text):
            if target.startswith(('http://', 'https://')):
                continue
            filename, _, fragment = target.partition('#')
            resolved = (path.parent / unquote(filename)).resolve() if filename else path.resolve()
            if not resolved.is_file():
                errors.append(f'缺少本地引用：{path.name} → {target}')
            elif fragment and resolved.suffix == '.md' and f'id="{fragment}"' not in resolved.read_text(encoding='utf-8'):
                errors.append(f'缺少锚点：{path.name} → {target}')
    if errors:
        for error in errors:
            print('错误：' + error)
        return 1
    print(f'通过：{len(techniques)} 个技法、{len(recipes)} 个配方；所有条目均有来源覆盖。')
    for case_id, annotations, observations, media in counts:
        print(f'{case_id}：{annotations} 个明确标注/声音项、{observations} 个可见补充项、{media} 个证据文件；时间、哈希和引用完整。')
    return 0


if __name__ == '__main__':
    sys.exit(check())
