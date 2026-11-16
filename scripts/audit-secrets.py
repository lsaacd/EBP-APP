"""Redacted source/artifact check. Reports locations and categories, never values.

Run from repository root. This is a targeted baseline, not a guarantee that all
credential formats or historical exposure have been found.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES = {
    'private-key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'github-token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b'),
    'google-api-key': re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b'),
    'google-oauth-secret': re.compile(r'GOCSPX-[A-Za-z0-9_-]{20,}'),
    'google-refresh-token': re.compile(r'\b1//[A-Za-z0-9_-]{50,}'),
    'aws-access-key': re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'expo-token': re.compile(r'\bExpoToken\[[A-Za-z0-9_-]{20,}\]'),
}
paths = subprocess.check_output(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd=ROOT).decode().split('\0')
for artifact in ['.cloudflare-pages-stage', 'himnario/dist']:
    folder = ROOT / artifact
    if folder.exists():
        paths.extend(str(p.relative_to(ROOT)) for p in folder.rglob('*') if p.is_file())
findings = []
scanned = 0
for name in sorted(set(paths)):
    p = ROOT / name
    if not name or not p.is_file() or p.stat().st_size > 8_000_000:
        continue
    try:
        raw = p.read_bytes()
        if b'\0' in raw[:4096]:
            continue
        content = raw.decode('utf-8')
    except (UnicodeError, OSError):
        continue
    scanned += 1
    for number, line in enumerate(content.splitlines(), 1):
        for category, pattern in RULES.items():
            if pattern.search(line):
                findings.append({'path': name, 'line': number, 'category': category})
print(json.dumps({'scanned_files': scanned, 'findings': findings}, indent=2))
raise SystemExit(1 if findings else 0)
