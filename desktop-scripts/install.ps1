# Install the Nightfall tweak into an existing ChatGPT++ runtime; do not patch official clients here.
$ErrorActionPreference = 'Stop'
$src = Resolve-Path (Join-Path $PSScriptRoot '..\desktop-tweak')
$runtimeRoot = Join-Path $env:APPDATA 'chatgpt-plusplus'
if (-not (Test-Path $runtimeRoot)) {
  Write-Host 'ChatGPT++ runtime not found. Install and test a supported third-party runtime first.' -ForegroundColor Yellow
  exit 1
}
$target = Join-Path $runtimeRoot 'tweaks\nightfall-theme-studio'
New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item (Join-Path $src 'manifest.json') (Join-Path $target 'manifest.json') -Force
Copy-Item (Join-Path $src 'index.js') (Join-Path $target 'index.js') -Force
Write-Host "Nightfall installed: $target" -ForegroundColor Green
Write-Host 'Restart the patched client or reload tweaks; open Nightfall Studio in settings.'
