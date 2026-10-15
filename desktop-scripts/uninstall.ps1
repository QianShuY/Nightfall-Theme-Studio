$ErrorActionPreference='Stop'
$target=Join-Path $env:APPDATA 'chatgpt-plusplus\tweaks\nightfall-theme-studio'
$manifest=Join-Path $target 'manifest.json'
if(Test-Path $manifest){
  $obj=Get-Content -Raw -Encoding UTF8 $manifest | ConvertFrom-Json
  if($obj.id -eq 'com.nightfall.theme-studio'){
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Host 'Nightfall tweak removed. Restart the modified client.' -ForegroundColor Green
    exit 0
  }
}
Write-Host 'No matching Nightfall tweak installation found; nothing removed.'
