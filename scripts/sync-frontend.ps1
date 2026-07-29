# Sync frontend/ → backend/public/ (preserves Laravel public files)
$Root = Split-Path -Parent $PSScriptRoot
$Src = Join-Path $Root "frontend"
$Dest = Join-Path $Root "backend\public"

node (Join-Path $PSScriptRoot "sync-frontend.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Frontend synced to backend/public"
