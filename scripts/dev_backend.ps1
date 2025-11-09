param()
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Push-Location "$PSScriptRoot\..\backend"
try {
  if (-not (Test-Path '.venv')) {
    Write-Host 'Creating backend virtualenv...' -ForegroundColor Cyan
    python -m venv .venv
  }
  & .\.venv\Scripts\python.exe -m pip install --upgrade pip > $null
  & .\.venv\Scripts\pip.exe install -r requirements.txt
  Write-Host 'Starting uvicorn...' -ForegroundColor Green
  & .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8765
}
finally {
  Pop-Location
}
