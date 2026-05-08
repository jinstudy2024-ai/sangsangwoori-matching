"""YouTube 자막을 추출해 텍스트 파일로 저장한다."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

_VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def parse_video_id(arg: str) -> str:
    """Accept a raw video id or any common YouTube URL form."""
    if _VIDEO_ID_RE.match(arg):
        return arg
    parsed = urlparse(arg)
    host = parsed.netloc.lower().removeprefix("www.")
    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/", 1)[0]
    elif host in {"youtube.com", "m.youtube.com"}:
        if parsed.path == "/watch":
            candidate = (parse_qs(parsed.query).get("v") or [""])[0]
        else:
            candidate = parsed.path.rsplit("/", 1)[-1]
    else:
        candidate = arg
    if not _VIDEO_ID_RE.match(candidate):
        raise ValueError(f"could not parse video id from: {arg!r}")
    return candidate


def fetch(video_id: str, languages: tuple[str, ...] = ("ko", "en")) -> tuple[str, str]:
    """Try each language in order. Returns (lang_code, formatted_text)."""
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    last_err: Exception | None = None
    for lang in languages:
        try:
            transcript = transcript_list.find_transcript([lang])
            fetched = transcript.fetch()
            return transcript.language_code, TextFormatter().format_transcript(fetched)
        except Exception as e:
            last_err = e
    assert last_err is not None
    raise last_err


def main() -> int:
    raw = sys.argv[1] if len(sys.argv) > 1 else "EZjS0ARK3Wg"
    video_id = parse_video_id(raw)
    out_dir = Path(__file__).parent

    lang, text = fetch(video_id)
    out_path = out_dir / f"{video_id}.{lang}.txt"
    out_path.write_text(text, encoding="utf-8")
    print(f"saved: {out_path} ({len(text)} chars, lang={lang})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
