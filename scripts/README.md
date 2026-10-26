# Scripts

Small, explicit development helpers. They are intentionally boring and print what they are going to do.

| Script | Purpose |
|---|---|
| `link-plugin.sh` | Link `mirlaPlugin/` into `~/Documents/Publii/plugins/mirlaPlugin` (dry run by default; `--apply` to perform). Backs up the installed copy outside Publii's plugin scan folder. |
| `unlink-plugin.sh` | Remove the symlink and restore the most recent backup (dry run by default). |
| `link-plugin.ps1` | Windows directory-junction equivalent (dry run by default; `-Apply` to perform). |
| `check-plugin-loader.js` | Reproduces Publii's plugin discovery/require path and checks that the plugin registers `afterRender`. |
| `test-all.sh` | Fast checks: plugin syntax/manifests, available package tests, optional local Publii loader check. |
| `build-all.sh` | Builds the Svelte components into the theme and the data editor once it exists. |

## Plugin development loop

```bash
scripts/link-plugin.sh            # inspect the plan
scripts/link-plugin.sh --apply    # back up + create the symlink
# restart Publii, run a preview
node scripts/check-plugin-loader.js
```

Rollback:

```bash
scripts/unlink-plugin.sh          # inspect what will be restored
scripts/unlink-plugin.sh --apply
```

The backup lives in `$PUBLII_HOME/plugin-backups/`, **not** in `plugins/`, so Publii does not list it as a second plugin.

## Rules

- Never edit the installed plugin copy. After linking, there is no copy: the directory is a symlink to this repository.
- Restart Publii after changing `main.js`; Node caches `require()`d modules.
- The symlink is a local development convenience. GitHub Actions always zips the repository folder directly.
