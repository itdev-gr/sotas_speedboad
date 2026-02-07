#!/usr/bin/env bash
# Compress MP4 files in public/videos/ using ffmpeg (H.264, CRF 28).
# Requires ffmpeg: https://ffmpeg.org/download.html
# On macOS: brew install ffmpeg  (install Homebrew from https://brew.sh first)

set -e
VIDEOS_DIR="$(cd "$(dirname "$0")/../public/videos" && pwd)"
cd "$VIDEOS_DIR"

if ! command -v ffmpeg &>/dev/null; then
  echo "Error: ffmpeg not found. Install it first:"
  echo "  macOS: brew install ffmpeg"
  echo "  Or download from: https://ffmpeg.org/download.html"
  exit 1
fi

for f in hero.mp4 hero2.mp4; do
  if [ ! -f "$f" ]; then
    echo "Skip: $f (not found)"
    continue
  fi
  echo "Compressing $f..."
  ffmpeg -y -i "$f" -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 128k -movflags +faststart "_tmp_$f"
  mv "_tmp_$f" "$f"
  echo "Done: $f"
done

echo "All videos compressed."
