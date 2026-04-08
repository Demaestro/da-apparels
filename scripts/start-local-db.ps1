$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pgRoot = Join-Path $root ".tools\postgresql\16.13\pgsql"
$dataDir = Join-Path $root ".data\postgres\16"
$logDir = Join-Path $root ".data\postgres\logs"
$logFile = Join-Path $logDir "postgres.log"
$envPath = Join-Path $root ".env"

if (-not (Test-Path (Join-Path $pgRoot "bin\pg_ctl.exe"))) {
  throw "PostgreSQL binaries not found. Expected $(Join-Path $pgRoot 'bin\pg_ctl.exe')."
}

if (-not (Test-Path $dataDir)) {
  throw "PostgreSQL data directory not found. Expected $dataDir."
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$existing = Get-NetTCPConnection -State Listen -LocalPort 5432 -ErrorAction SilentlyContinue
if ($existing) {
  Write-Output "PostgreSQL already listening on port 5432."
} else {
  & (Join-Path $pgRoot "bin\pg_ctl.exe") -D $dataDir -l $logFile -o " -p 5432 " start | Out-Null
  Start-Sleep -Seconds 3
}

$env:PGPASSWORD = "da_password"
$psql = Join-Path $pgRoot "bin\psql.exe"
$createdb = Join-Path $pgRoot "bin\createdb.exe"

$databaseExists = {
  param([string]$name)
  $result = & $psql -h 127.0.0.1 -p 5432 -U da_user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$name';"
  return ($result | Out-String).Trim() -eq "1"
}

if (-not (& $databaseExists "da_apparels")) {
  & $createdb -h 127.0.0.1 -p 5432 -U da_user da_apparels | Out-Null
}

if (-not (& $databaseExists "da_apparels_shadow")) {
  & $createdb -h 127.0.0.1 -p 5432 -U da_user da_apparels_shadow | Out-Null
}

Write-Output (& (Join-Path $pgRoot "bin\pg_isready.exe") -h 127.0.0.1 -p 5432 -U da_user)
