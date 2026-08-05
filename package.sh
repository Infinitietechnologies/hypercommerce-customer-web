#!/bin/bash
# Builds codecanyon-package/ — the file set shipped on CodeCanyon.
# Run from the project root after any code change:  ./package.sh

set -e
cd "$(dirname "$0")"

OUT="codecanyon-package"

EXCLUDES=(
  "$OUT"
  package.sh
  .git .github .idea .claude
  .DS_Store '**/.DS_Store'
  node_modules .next out tsconfig.tsbuildinfo
  .env .env.local
  CLAUDE.md '**/CLAUDE.md' AGENTS.md CAVEMAN.md
  THEME_REDESIGN.md REDESIGN_QUESTIONS.md TEST_REPORT.md
  scripts/audit-routes.mjs
)

RSYNC_ARGS=()
for e in "${EXCLUDES[@]}"; do RSYNC_ARGS+=(--exclude "$e"); done

rm -rf "$OUT"
mkdir -p "$OUT"
rsync -a "${RSYNC_ARGS[@]}" ./ "$OUT/"

# Nothing in the build creates .env, and a missing one fails silently — the
# storefront builds fine but every API call falls back to /api. Seed it.
cp "$OUT/.env.example" "$OUT/.env"

fail=0

# Anything here means credentials would ship. Hard stop.
leaked=$(find "$OUT" \( -name '.env.local' -o -name '*.keystore' \
  -o -name '*.jks' -o -name 'key.properties' -o -name '*serviceAccount*.json' \) 2>/dev/null)
if [ -n "$leaked" ]; then echo "FAIL — secrets in package:"; echo "$leaked"; fail=1; fi

# The shipped .env must be the example verbatim — never a real one.
if ! cmp -s "$OUT/.env" "$OUT/.env.example"; then
  echo "FAIL — .env is not a copy of .env.example (real credentials?)"; fail=1
fi

for pat in "host:" "user:" "password:"; do
  val=$(grep -E "^\s*${pat}\s*\"[^\"]+\"" "$OUT/ftp.js" 2>/dev/null || true)
  if [ -n "$val" ]; then echo "FAIL — ftp.js has a value for ${pat}"; fail=1; fi
done

internal=$(find "$OUT" \( -name 'CLAUDE.md' -o -name 'AGENTS.md' -o -name 'CAVEMAN.md' \
  -o -name '*REDESIGN*' -o -name 'TEST_REPORT.md' \) 2>/dev/null)
if [ -n "$internal" ]; then echo "FAIL — internal docs in package:"; echo "$internal"; fail=1; fi

# Everything package.json's build/deploy scripts invoke must be present.
for f in scripts/update-manifest.mjs scripts/update-robots.mjs scripts/generate-sitemap.mjs \
         create-htaccess.js ftp.js package.json next.config.ts .env.example; do
  [ -e "$OUT/$f" ] || { echo "FAIL — missing $f"; fail=1; }
done

# 22 live files import from src/redesign; without it the build breaks.
[ -d "$OUT/src/redesign" ] || { echo "FAIL — missing src/redesign"; fail=1; }

[ "$fail" -eq 0 ] || { echo; echo "Package NOT safe to ship."; exit 1; }

echo "$OUT — $(du -sh "$OUT" | cut -f1), $(find "$OUT" -type f | wc -l | tr -d ' ') files. Checks passed."
