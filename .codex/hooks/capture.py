#!/usr/bin/env python3
"""Append Codex prompt/response hook events to the 8x assignment session log."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT = "8x-assignment"
AUTHOR = "mugheesmustafa"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def repository_root(cwd: Path) -> Path:
    try:
        value = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        return Path(value).resolve()
    except (OSError, subprocess.CalledProcessError):
        return cwd


def safe_id(session_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "-", session_id)


def find_log(log_dir: Path, session_id: str) -> Path | None:
    marker = f"session_id: {session_id}\n"
    for path in log_dir.glob("*.md"):
        try:
            if marker in path.read_text(encoding="utf-8"):
                return path
        except OSError:
            continue
    return None


def create_log(log_dir: Path, event: dict, timestamp: str) -> Path:
    session_id = str(event["session_id"])
    model = str(event.get("model") or "unknown")
    stamp = timestamp.replace("-", "").replace(":", "")[:15]
    filename = f"{stamp[:8]}_{stamp[9:15]}_{safe_id(session_id)}.md"
    path = log_dir / filename
    short_id = session_id[:8]
    date = timestamp[:10]
    header = (
        "---\n"
        f"session_id: {session_id}\n"
        f"date: {date}\n"
        f"author: {AUTHOR}\n"
        f"model: {model}\n"
        "tool: codex-desktop\n"
        f"project: {PROJECT}\n"
        "total_exchanges: 0\n"
        f"first_prompt_time: {timestamp}\n"
        f"last_prompt_time: {timestamp}\n"
        "---\n\n"
        f"# Session Log - {date}\n\n"
        f"Session: `{short_id}` | Project: `{PROJECT}` | Author: `{AUTHOR}`\n\n"
        "---\n\n"
    )
    path.write_text(header, encoding="utf-8")
    return path


def count_entries(text: str, entry_type: str) -> int:
    return len(re.findall(rf"^\[LOG_ENTRY type={entry_type} num=", text, re.MULTILINE))


def update_frontmatter(text: str, key: str, value: str) -> str:
    return re.sub(rf"^{re.escape(key)}: .*?$", f"{key}: {value}", text, count=1, flags=re.MULTILINE)


def append_prompt(path: Path, event: dict, timestamp: str) -> None:
    text = path.read_text(encoding="utf-8")
    number = count_entries(text, "PROMPT") + 1
    session_id = str(event["session_id"])
    model = str(event.get("model") or "unknown")
    prompt = str(event.get("prompt") or "")
    text = update_frontmatter(text, "last_prompt_time", timestamp)
    text += (
        f"[LOG_ENTRY type=PROMPT num={number} session={session_id[:8]}]\n"
        f"timestamp: {timestamp}\n"
        f"model: {model}\n\n"
        f"{prompt}\n\n\n"
    )
    path.write_text(text, encoding="utf-8")


def append_response(path: Path, event: dict, timestamp: str) -> None:
    response = event.get("last_assistant_message")
    if response is None:
        return
    text = path.read_text(encoding="utf-8")
    number = count_entries(text, "RESPONSE") + 1
    session_id = str(event["session_id"])
    model = str(event.get("model") or "unknown")
    text += (
        f"[LOG_ENTRY type=RESPONSE num={number} session={session_id[:8]}]\n"
        f"timestamp: {timestamp}\n"
        f"model: {model}\n\n"
        f"{response}\n\n\n"
    )
    text = update_frontmatter(text, "total_exchanges", str(number))
    path.write_text(text, encoding="utf-8")


def main() -> int:
    event = json.load(sys.stdin)
    repo = repository_root(Path(str(event.get("cwd") or Path.cwd())).resolve())
    log_dir = repo / ".agent-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = utc_now()
    session_id = str(event.get("session_id") or "unknown-session")
    path = find_log(log_dir, session_id)

    if event.get("hook_event_name") == "UserPromptSubmit":
        path = path or create_log(log_dir, event, timestamp)
        append_prompt(path, event, timestamp)
    elif event.get("hook_event_name") == "Stop" and path is not None:
        append_response(path, event, timestamp)

    # Stop hooks require JSON on stdout; this is valid and harmless for both events.
    print("{}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
