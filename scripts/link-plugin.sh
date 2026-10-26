#!/usr/bin/env bash
#
# Link the repository's plugin source into Publii's plugin directory.
#
# Publii loads plugins from:
#   ~/Documents/Publii/plugins/<plugin-name>/
# It follows directory symlinks (fs.statSync + require), so this script lets
# Publii load the exact source used by GitHub Actions.
#
# Usage:
#   scripts/link-plugin.sh            # dry run (default)
#   scripts/link-plugin.sh --apply    # back up and create the symlink
#
# Environment:
#   PUBLII_HOME   Override the Publii data directory
#                 (default: $HOME/Documents/Publii)
#
set -euo pipefail

APPLY=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Use --apply to make changes, or run without arguments for a dry run." >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"

SOURCE="$REPO_ROOT/mirlaPlugin"
PUBLII_HOME="${PUBLII_HOME:-$HOME/Documents/Publii}"
PLUGINS_DIR="$PUBLII_HOME/plugins"
DEST="$PLUGINS_DIR/mirlaPlugin"
BACKUP_ROOT="$PUBLII_HOME/plugin-backups"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ -d "$SOURCE" ]] || die "Plugin source not found: $SOURCE"
[[ -f "$SOURCE/plugin.json" ]] || die "Missing $SOURCE/plugin.json"
[[ -f "$SOURCE/main.js" ]] || die "Missing $SOURCE/main.js"
[[ -d "$SOURCE/osd_icons" ]] || die "Missing $SOURCE/osd_icons"
[[ -d "$PLUGINS_DIR" ]] || die "Publii plugins directory not found: $PLUGINS_DIR"

echo "Repository plugin : $SOURCE"
echo "Publii plugins dir: $PLUGINS_DIR"
echo "Link destination  : $DEST"
echo

if [[ -L "$DEST" ]]; then
  CURRENT="$(readlink "$DEST")"
  if [[ "$CURRENT" == "$SOURCE" ]]; then
    echo "Already linked to the repository plugin. Nothing to do."
    exit 0
  fi
  die "$DEST is already a symlink to '$CURRENT'. Refusing to replace it automatically. Remove it manually if this is intended."
fi

BACKUP=""
if [[ -e "$DEST" ]]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  BACKUP="$BACKUP_ROOT/mirlaPlugin-$STAMP"
  if [[ -e "$BACKUP" ]]; then
    BACKUP="$BACKUP-$$"
  fi
  echo "Existing plugin will be backed up to:"
  echo "  $BACKUP"
else
  echo "No existing plugin directory; a new link will be created."
fi

if [[ "$APPLY" -eq 0 ]]; then
  echo
  echo "DRY RUN. No changes made."
  echo "Re-run with --apply to perform the backup and create the symlink."
  exit 0
fi

if [[ -n "$BACKUP" ]]; then
  mkdir -p "$BACKUP_ROOT"
  mv "$DEST" "$BACKUP"
  echo "Backed up existing plugin."
fi

ln -s "$SOURCE" "$DEST"

[[ -f "$DEST/main.js" ]] || die "Link verification failed: $DEST/main.js is not readable"
[[ -f "$DEST/plugin.json" ]] || die "Link verification failed: $DEST/plugin.json is not readable"
[[ -d "$DEST/osd_icons" ]] || die "Link verification failed: $DEST/osd_icons is not readable"

echo
echo "Linked:"
echo "  $DEST -> $(readlink "$DEST")"
echo
echo "Next steps:"
echo "  1. Restart Publii (it caches required plugin modules)."
echo "  2. Open the site and run a preview."
echo "  3. Run: node scripts/check-plugin-loader.js"
echo
if [[ -n "$BACKUP" ]]; then
  echo "Rollback:"
  echo "  scripts/unlink-plugin.sh --apply"
  echo "  (restores: $BACKUP)"
fi
