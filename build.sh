#!/usr/bin/env bash
# Packages the extension for AMO / Chrome Web Store upload.
# Ships only what the browser needs: no docs, no screenshots, no .git, no dist.
# login.js/login.css are no longer wired in the manifest, so they stay out too.
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT="dist/flexplus-${VERSION}.zip"

rm -f "$OUT"
mkdir -p dist
zip -qr "$OUT" css js json manifest.json \
    assets/icon16.png assets/icon48.png assets/icon128.png \
    -x '.*' '*/.*' 'js/login.js' 'css/login.css'

echo "built $OUT"
unzip -l "$OUT" | tail -1
