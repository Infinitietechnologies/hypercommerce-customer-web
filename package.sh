#!/bin/bash
# Builds codecanyon-package/ — the file set shipped on CodeCanyon.
#   ./package.sh              interactive
#   ./package.sh --defaults   no prompts, use the defaults shown below

set -e
cd "$(dirname "$0")"

OUT="codecanyon-package"

# Only these root entries ship. Anything new in the project root is excluded
# until it is added here on purpose.
INCLUDE=(
  src public scripts
  create-htaccess.js ftp.js i18n.ts i18next-scanner.config.cjs
  next.config.ts next-env.d.ts postcss.config.mjs tailwind.config.ts
  eslint.config.mjs tsconfig.json
  package.json package-lock.json .npmrc
  .env.example LICENSE README.md
)

# Pruned from inside the allow-listed trees.
PRUNE=(
  .DS_Store
  CLAUDE.md
  scripts/audit-routes.mjs
)

pkg_value() {
  python3 -c "import json,sys;print(json.load(open('package.json')).get(sys.argv[1],''))" "$1"
}

ask() {
  local prompt=$1 default=$2 answer=""
  if [ "$INTERACTIVE" = 1 ]; then read -r -p "$prompt [$default]: " answer; fi
  echo "${answer:-$default}"
}

INTERACTIVE=${INTERACTIVE:-$([ -t 0 ] && echo 1 || echo 0)}
[ "$1" = "--defaults" ] && INTERACTIVE=0

APP_NAME=$(ask "Package name" "$(pkg_value name)")
APP_VERSION=$(ask "Version" "$(pkg_value version)")
MAKE_ZIP=$(ask "Create the zip afterwards? (1/0)" 0)

APP_NAME=$(echo "$APP_NAME" | tr '[:upper:] ' '[:lower:]-')

for entry in "${INCLUDE[@]}"; do
  [ -e "$entry" ] || { echo "FAIL — allow-listed entry missing: $entry"; exit 1; }
done

RSYNC_ARGS=()
for p in "${PRUNE[@]}"; do RSYNC_ARGS+=(--exclude "$p"); done

rm -rf "$OUT"
mkdir -p "$OUT"
rsync -a "${RSYNC_ARGS[@]}" "${INCLUDE[@]}" "$OUT/"

python3 - "$OUT/package.json" "$APP_NAME" "$APP_VERSION" <<'PY'
import json, sys
path, name, version = sys.argv[1:4]
pkg = json.load(open(path))
pkg['name'] = name
pkg['version'] = version
json.dump(pkg, open(path, 'w'), indent=2)
open(path, 'a').write('\n')
PY

# Nothing in the build creates .env, and a missing one fails silently — the
# storefront builds fine but every API call falls back to /api. Seed it. Both
# files get the same version stamp, so the "verbatim copy" check below holds.
cp "$OUT/.env.example" "$OUT/.env"
for f in "$OUT/.env" "$OUT/.env.example"; do
  sed -i.bak -E "s|^NEXT_PUBLIC_APP_VERSION=.*|NEXT_PUBLIC_APP_VERSION=$APP_VERSION|" "$f"
  rm -f "$f.bak"
done

fail=0

# Anything here means credentials would ship. Hard stop.
leaked=$(find "$OUT" \( -name '.env.local' -o -name '*.keystore' \
  -o -name '*.jks' -o -name 'key.properties' -o -name '*serviceAccount*.json' \) 2>/dev/null)
if [ -n "$leaked" ]; then echo "FAIL — secrets in package:"; echo "$leaked"; fail=1; fi

# The shipped .env must be the example verbatim — never a real one.
if ! cmp -s "$OUT/.env" "$OUT/.env.example"; then
  echo "FAIL — .env is not a copy of .env.example (real credentials?)"; fail=1
fi

grep -qE "^NEXT_PUBLIC_APP_VERSION=$APP_VERSION$" "$OUT/.env" \
  || { echo "FAIL — NEXT_PUBLIC_APP_VERSION not stamped"; fail=1; }

for pat in "host:" "user:" "password:"; do
  val=$(grep -E "^\s*${pat}\s*\"[^\"]+\"" "$OUT/ftp.js" 2>/dev/null || true)
  if [ -n "$val" ]; then echo "FAIL — ftp.js has a value for ${pat}"; fail=1; fi
done

internal=$(find "$OUT" \( -name 'CLAUDE.md' -o -name 'AGENTS.md' -o -name 'CAVEMAN.md' \
  -o -name '*REDESIGN*' -o -name '*INSTRUCTIONS.md' -o -name 'TEST_REPORT.md' \) 2>/dev/null)
if [ -n "$internal" ]; then echo "FAIL — internal docs in package:"; echo "$internal"; fail=1; fi

# Everything package.json's build/deploy scripts invoke must be present.
for f in scripts/update-manifest.mjs scripts/update-robots.mjs scripts/generate-sitemap.mjs \
         create-htaccess.js ftp.js package.json next.config.ts .env.example; do
  [ -e "$OUT/$f" ] || { echo "FAIL — missing $f"; fail=1; }
done

[ "$fail" -eq 0 ] || { echo; echo "Package NOT safe to ship."; exit 1; }

if [ "$MAKE_ZIP" = 1 ]; then
  zip_name="$APP_NAME-v$APP_VERSION.zip"
  rm -f "$zip_name"
  zip -rqX "$zip_name" "$OUT"
  echo "$zip_name — $(du -sh "$zip_name" | cut -f1)"
fi

echo "$OUT — $(du -sh "$OUT" | cut -f1), $(find "$OUT" -type f | wc -l | tr -d ' ') files. $APP_NAME v$APP_VERSION. Checks passed."
