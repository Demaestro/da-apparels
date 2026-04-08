$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$memuraiRoot = Join-Path $root ".tools\memurai\pkg\tools"
$dataDir = Join-Path $root ".data\memurai"
$logFile = Join-Path $dataDir "memurai.log"
$configPath = Join-Path $dataDir "memurai.conf"

if (-not (Test-Path (Join-Path $memuraiRoot "memurai.exe"))) {
  throw "Memurai binary not found. Expected $(Join-Path $memuraiRoot 'memurai.exe')."
}

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

@"
bind 127.0.0.1
protected-mode yes
port 6379
dir $dataDir
dbfilename dump.rdb
logfile $logFile
save 900 1
save 300 10
save 60 10000
"@ | Set-Content -Path $configPath -NoNewline

$existing = Get-NetTCPConnection -State Listen -LocalPort 6379 -ErrorAction SilentlyContinue
if ($existing) {
  Write-Output "Cache already listening on port 6379."
  exit 0
}

$proc = Start-Process -FilePath (Join-Path $memuraiRoot "memurai.exe") -ArgumentList $configPath -WorkingDirectory $memuraiRoot -PassThru

Start-Sleep -Seconds 4

try {
  $response = & (Join-Path $memuraiRoot "memurai-cli.exe") -h 127.0.0.1 -p 6379 ping
  Write-Output "Started Memurai PID=$($proc.Id)"
  Write-Output $response
} catch {
  if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
  }
  throw
}
