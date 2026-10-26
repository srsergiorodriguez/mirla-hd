#!/usr/bin/env bash
#
# Run every available fast check in the repository.
# This intentionally does not start Publii or build the whole site.
#
# Usage:
#   scripts/test-all.sh
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$REPO_ROOT"

FAIL=0

section() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

has_script() {
  local package_json="$1"
  local script_name="$2"
  node -e "
    const p = require('./${package_json}');
    process.exit(p.scripts && p.scripts['${script_name}'] ? 0 : 1);
  " >/dev/null 2>&1
}

section "Plugin: syntax and manifest"
if node --check mirlaPlugin/main.js; then
  echo "OK: mirlaPlugin/main.js"
else
  echo "FAIL: mirlaPlugin/main.js"
  FAIL=1
fi

for json in mirlaPlugin/plugin.json input/themes/mirlaTheme/config.json input/config/site.plugins.json; do
  if node -e "JSON.parse(require('fs').readFileSync('${json}', 'utf8'))"; then
    echo "OK: ${json}"
  else
    echo "FAIL: ${json}"
    FAIL=1
  fi
done

section "Components: tests"
if [[ -f svelte-components/package.json ]]; then
  if has_script "svelte-components/package.json" "test"; then
    if npm --prefix svelte-components test; then
      echo "OK: components tests"
    else
      echo "FAIL: components tests"
      FAIL=1
    fi
  else
    echo "SKIP: svelte-components has no test script yet."
  fi
else
  echo "SKIP: svelte-components/package.json not found."
fi

section "Data editor: tests"
if [[ -f data-editor/package.json ]]; then
  if has_script "data-editor/package.json" "test"; then
    if npm --prefix data-editor test; then
      echo "OK: editor tests"
    else
      echo "FAIL: editor tests"
      FAIL=1
    fi
  else
    echo "SKIP: data-editor has no test script yet."
  fi
else
  echo "SKIP: data-editor is not created yet."
fi

section "Local Publii plugin loader (optional)"
PUBLII_HOME_DIR="${PUBLII_HOME:-$HOME/Documents/Publii}"
if [[ -d "$PUBLII_HOME_DIR/plugins/mirlaPlugin" ]]; then
  if node scripts/check-plugin-loader.js; then
    echo "OK: Publii plugin loader"
  else
    echo "FAIL: Publii plugin loader"
    FAIL=1
  fi
else
  echo "SKIP: no local Publii plugin installation found."
fi

section "Summary"
if [[ "$FAIL" -eq 0 ]]; then
  echo "All available checks passed."
  exit 0
fi

echo "One or more checks failed."
exit 1
