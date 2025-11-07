param()
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Push-Location "$PSScriptRoot\..\frontend"
try {
  if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing frontend deps via pnpm...' -ForegroundColor Cyan
    pnpm install
  }
  Write-Host 'Starting Vite dev server...' -ForegroundColor Green
  pnpm dev
}
finally {
  Pop-Location
}
