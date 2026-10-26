#!/usr/bin/env bash
#
# Build every distributable that lives in this repository.
# It does not install dependencies and does not run Publii.
#
# Usage:
#   scripts/build-all.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$REPO_ROOT"

echo "============================================================"
echo "Svelte components -> theme bundle"
echo "============================================================"
if [[ ! -d svelte-components/node_modules ]]; then
  echo "ERROR: svelte-components/node_modules is missing." >&2
  echo "Run: npm --prefix svelte-components ci" >&2
  exit 1
fi
npm --prefix svelte-components run build

BUNDLE="input/themes/mirlaTheme/assets/js/mirla-components.js"
if [[ -f "$BUNDLE" ]]; then
  echo "OK: $BUNDLE"
else
  echo "ERROR: expected bundle not found at $BUNDLE" >&2
  exit 1
fi

echo
echo "============================================================"
echo "Data editor -> single HTML (when available)"
echo "============================================================"
if [[ -f data-editor/package.json ]]; then
  if [[ ! -d data-editor/node_modules ]]; then
    echo "ERROR: data-editor/node_modules is missing." >&2
    echo "Run: npm --prefix data-editor ci" >&2
    exit 1
  fi
  npm --prefix data-editor run build
  echo "OK: data editor build"
else
  echo "SKIP: data-editor is not created yet."
fi

echo
echo "Done. Theme and editor artifacts are up to date."
