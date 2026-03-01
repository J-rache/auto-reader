#!/usr/bin/env bash
set -euo pipefail

# Downloads and verifies coqui models listed in manifest.json (requires curl, sha256sum, tar)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT_DIR/coqui/manifest.json"
OUT_DIR="$ROOT_DIR/coqui/models"

mkdir -p "$OUT_DIR"

jq -c '.models[]' "$MANIFEST" | while read -r entry; do
  name=$(echo "$entry" | jq -r '.name')
  url=$(echo "$entry" | jq -r '.url')
  sha256_expected=$(echo "$entry" | jq -r '.sha256')
  filename=$(echo "$entry" | jq -r '.filename')

  if [ -z "$url" ] || [ "$sha256_expected" = "REPLACE_WITH_REAL_SHA256_HASH" ]; then
    echo "Skipping $name: no valid URL or checksum in manifest"
    continue
  fi

  tmpfile="$OUT_DIR/$filename"
  if [ -f "$tmpfile" ]; then
    echo "$filename already exists, verifying checksum..."
  else
    echo "Downloading $name from $url"
    curl -L -o "$tmpfile" "$url"
  fi

  echo "Verifying SHA256 for $filename"
  sha256_actual=$(sha256sum "$tmpfile" | awk '{print $1}')
  if [ "$sha256_actual" != "$sha256_expected" ]; then
    echo "Checksum mismatch for $filename: expected $sha256_expected, got $sha256_actual"
    exit 2
  fi

  echo "Extracting $filename"
  tar -xzf "$tmpfile" -C "$OUT_DIR"
done

echo "Done"
