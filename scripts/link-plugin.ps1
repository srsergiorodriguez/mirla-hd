<#
.SYNOPSIS
  Link the repository plugin into Publii's plugin directory on Windows.

.DESCRIPTION
  Creates a directory junction (no administrator elevation required) so Publii
  loads the same source used by GitHub Actions. The installed plugin is backed
  up outside Publii's plugins directory so it is not detected as a second
  plugin.

.PARAMETER Apply
  Perform the backup and create the junction. Without it, the script is a dry
  run.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\link-plugin.ps1
  powershell -ExecutionPolicy Bypass -File scripts\link-plugin.ps1 -Apply
#>
param(
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..')).Path
$Source = Join-Path $RepoRoot 'mirlaPlugin'

if ($env:PUBLII_HOME) {
    $PubliiHome = $env:PUBLII_HOME
} else {
    $Documents = [Environment]::GetFolderPath('MyDocuments')
    $PubliiHome = Join-Path $Documents 'Publii'
}

$PluginsDir = Join-Path $PubliiHome 'plugins'
$Dest = Join-Path $PluginsDir 'mirlaPlugin'
$BackupRoot = Join-Path $PubliiHome 'plugin-backups'

function Fail([string]$Message) {
    Write-Error "ERROR: $Message"
    exit 1
}

if (-not (Test-Path $Source -PathType Container)) { Fail "Plugin source not found: $Source" }
if (-not (Test-Path (Join-Path $Source 'plugin.json') -PathType Leaf)) { Fail "Missing plugin.json in $Source" }
if (-not (Test-Path (Join-Path $Source 'main.js') -PathType Leaf)) { Fail "Missing main.js in $Source" }
if (-not (Test-Path $PluginsDir -PathType Container)) { Fail "Publii plugins directory not found: $PluginsDir" }

Write-Host "Repository plugin : $Source"
Write-Host "Publii plugins dir: $PluginsDir"
Write-Host "Link destination  : $Dest"
Write-Host ""

if (Test-Path $Dest) {
    $existing = Get-Item $Dest -Force
    if ($existing.LinkType -eq 'Junction') {
        $target = @($existing.Target)[0]
        if ($target -and ((Resolve-Path $target).Path -eq $Source)) {
            Write-Host "Already linked to the repository plugin. Nothing to do."
            exit 0
        }
    }
    Fail "$Dest already exists. Move or remove it manually before linking."
}

$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Backup = Join-Path $BackupRoot "mirlaPlugin-$Stamp"

Write-Host "Existing plugin will be backed up to:"
Write-Host "  $Backup"
Write-Host ""

if (-not $Apply) {
    Write-Host "DRY RUN. No changes made."
    Write-Host "Re-run with -Apply to perform the backup and create the junction."
    exit 0
}

New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
Move-Item -LiteralPath $Dest -Destination $Backup
New-Item -ItemType Junction -Path $Dest -Target $Source | Out-Null

if (-not (Test-Path (Join-Path $Dest 'main.js') -PathType Leaf)) {
    Fail "Junction verification failed: $Dest\main.js is not readable"
}

Write-Host "Linked:"
Write-Host "  $Dest -> $Source"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart Publii (it caches required plugin modules)."
Write-Host "  2. Open the site and run a preview."
Write-Host "  3. Run: node scripts/check-plugin-loader.js"
Write-Host ""
Write-Host "Rollback:"
Write-Host "  Remove-Item `"$Dest`" -Force"
Write-Host "  Move-Item `"$Backup`" `"$Dest`""
