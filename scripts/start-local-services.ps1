$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

& (Join-Path $root "scripts\start-local-db.ps1")
& (Join-Path $root "scripts\start-local-cache.ps1")
