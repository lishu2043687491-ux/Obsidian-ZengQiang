#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VERSION="$(node -p "require('./manifest.json').version")"
OUT="$ROOT/release-$VERSION"
rm -rf "$OUT"
mkdir -p "$OUT"
npm run build
cp main.js manifest.json styles.css "$OUT/"
echo "Release assets ready in $OUT"
ls -la "$OUT"
