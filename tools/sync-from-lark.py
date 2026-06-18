#!/usr/bin/env python3
"""Sync Lark refactored skill doc → GitHub folder structure.

Parses a Lark-flavored markdown export and emits one file per H1 marker
(`# 📄 path/to/file.md`). Extracts the YAML frontmatter from the top
callout block and prepends it (as Anthropic Claude Skills frontmatter)
to SKILL.md.
"""
import re
import sys
from pathlib import Path

SRC = Path("/tmp/refactor_md.md")
OUT_ROOT = Path("/tmp/skills-repo/skills/mbo-read-scenario")

content = SRC.read_text(encoding="utf-8")

# --- Extract frontmatter from the top callout ---
# The callout wraps a code block; YAML is between backticks-or-fenced
m = re.search(r"<callout[^>]*>(.*?)</callout>", content, re.DOTALL)
frontmatter_yaml = ""
if m:
    callout_body = m.group(1)
    # YAML is in a backtick block: `name: ...\n...`
    fm = re.search(r"`([^`]*name:[^`]+)`", callout_body, re.DOTALL)
    if fm:
        # unescape backslash-escaped chars (Lark md often escapes `-`)
        frontmatter_yaml = fm.group(1).replace("\\-", "-").strip()

# --- Strip Lark-only blocks before splitting ---
content_clean = re.sub(r"<title>.*?</title>", "", content, flags=re.DOTALL)
content_clean = re.sub(r"<callout[^>]*>.*?</callout>", "", content_clean, flags=re.DOTALL)

# --- Split by H1 file markers ---
pattern = re.compile(r"^# 📄 (.+?)$", re.MULTILINE)
matches = list(pattern.finditer(content_clean))
files = {}
for i, mt in enumerate(matches):
    filename = mt.group(1).strip()
    start = mt.end()
    end = matches[i + 1].start() if i + 1 < len(matches) else len(content_clean)
    body = content_clean[start:end].strip()
    # Strip leading/trailing `---` horizontal rules
    body = re.sub(r"^---\s*\n", "", body)
    body = re.sub(r"\n---\s*$", "", body)
    files[filename] = body.strip()

# --- Prepend frontmatter to SKILL.md ---
if "SKILL.md" in files and frontmatter_yaml:
    files["SKILL.md"] = f"---\n{frontmatter_yaml}\n---\n\n# mbo-read-scenario\n\n{files['SKILL.md']}"

# --- Write files ---
OUT_ROOT.mkdir(parents=True, exist_ok=True)
written = []
for filename, body in files.items():
    target = OUT_ROOT / filename
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(body + "\n", encoding="utf-8")
    written.append((filename, len(body)))

print(f"Wrote {len(written)} files to {OUT_ROOT}:")
for fn, sz in written:
    print(f"  {fn:50s} {sz:>6,} chars")
