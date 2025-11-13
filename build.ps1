$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "[INFO] Working directory: $projectRoot"

$buildDir = Join-Path $projectRoot 'build'
$specFile = Join-Path $buildDir 'keyset.spec'
$distDir = Join-Path $projectRoot 'dist'
$buildArtifactDir = Join-Path $buildDir 'KeySet'

if (-not (Test-Path $buildDir)) {
    Write-Host "[INFO] Creating build directory..."
    New-Item -ItemType Directory $buildDir | Out-Null
}

if (-not (Test-Path $specFile)) {
    Write-Host "[ERROR] Spec file build\keyset.spec not found. Create it before running the build." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Preview of build\keyset.spec:"
Get-Content $specFile | Select-Object -First 10

Write-Host "[INFO] Cleaning previous artifacts..."
if (Test-Path $distDir) {
    Remove-Item $distDir -Recurse -Force
    Write-Host "[INFO] Removed dist/"
}
if (Test-Path $buildArtifactDir) {
    Remove-Item $buildArtifactDir -Recurse -Force
    Write-Host "[INFO] Removed build/KeySet/"
}

if (-not (Test-Path $specFile)) {
    Write-Host "[ERROR] build\keyset.spec disappeared after cleanup!" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Running PyInstaller..."
$pyinstaller = Join-Path $projectRoot '.venv\Scripts\python.exe'
& $pyinstaller -m PyInstaller --noconfirm --clean $specFile

if (Test-Path (Join-Path $distDir 'KeySet.exe')) {
    $sizeMb = [math]::Round(((Get-Item (Join-Path $distDir 'KeySet.exe')).Length / 1MB), 2)
    Write-Host "[SUCCESS] KeySet.exe created successfully (${sizeMb} MB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] KeySet.exe was not created. Check PyInstaller output." -ForegroundColor Red
    exit 1
}
