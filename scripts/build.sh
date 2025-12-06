#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
PUBLIC_DIR="$ROOT_DIR/public"

echo "==> Cleaning dist"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "==> Copying static files"
cp "$PUBLIC_DIR/index.html" "$DIST_DIR/index.html"
cp "$PUBLIC_DIR/css/style.css" "$DIST_DIR/style.css"
cp "$PUBLIC_DIR/js/app.js" "$DIST_DIR/app.js"

echo "==> Rewriting asset paths for flattened layout"
node - "$DIST_DIR/index.html" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
let html = fs.readFileSync(file, 'utf8');
html = html
  .replace(/href="\/css\/style.css"/g, 'href="./style.css"')
  .replace(/src="\/js\/app.js"/g, 'src="./app.js"');
fs.writeFileSync(file, html);
EOF

cat <<EOF

✅ Static build complete.

dist/ now contains:
  - index.html
  - style.css
  - app.js
EOF
