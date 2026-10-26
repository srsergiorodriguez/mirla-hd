#!/usr/bin/env bash
#
# Remove the repository plugin symlink from Publii and restore the most recent
# backup (or a specific one).
#
# Usage:
#   scripts/unlink-plugin.sh                         # dry run
#   scripts/unlink-plugin.sh --apply                 # restore latest backup
#   scripts/unlink-plugin.sh --backup <path> --apply # restore a specific backup
#
# Environment:
#   PUBLII_HOME   Override the Publii data directory
#                 (default: $HOME/Documents/Publii)
#
set -euo pipefail

APPLY=0
BACKUP_ARG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1; shift ;;
    --backup)
      [[ $# -ge 2 ]] || { echo "ERROR: --backup requires a path" >&2; exit 2; }
      BACKUP_ARG="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
SOURCE="$REPO_ROOT/mirlaPlugin"
PUBLII_HOME="${PUBLII_HOME:-$HOME/Documents/Publii}"
DEST="$PUBLII_HOME/plugins/mirlaPlugin"
BACKUP_ROOT="$PUBLII_HOME/plugin-backups"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ -L "$DEST" ]] || die "$DEST is not a symlink; refusing to remove it."
CURRENT="$(readlink "$DEST")"
[[ "$CURRENT" == "$SOURCE" ]] || die "$DEST points to '$CURRENT', not the repository plugin. Refusing to touch it."

if [[ -n "$BACKUP_ARG" ]]; then
  BACKUP="$BACKUP_ARG"
else
  BACKUP="$(ls -1dt "$BACKUP_ROOT"/mirlaPlugin-* 2>/dev/null | head -n 1 || true)"
fi

if [[ -n "$BACKUP" && ! -d "$BACKUP" ]]; then
  die "Backup directory not found: $BACKUP"
fi

echo "Symlink : $DEST -> $CURRENT"
if [[ -n "$BACKUP" ]]; then
  echo "Restore : $BACKUP"
else
  echo "Restore : no backup found; the plugin will be absent after unlinking."
fi

if [[ "$APPLY" -eq 0 ]]; then
  echo
  echo "DRY RUN. No changes made."
  echo "Re-run with --apply to remove the symlink and restore the backup."
  exit 0
fi

rm "$DEST"

if [[ -n "$BACKUP" ]]; then
  mv "$BACKUP" "$DEST"
  echo "Restored: $DEST"
else
  echo "Symlink removed. No backup was restored."
fi

echo "Restart Publii to reload plugins."
