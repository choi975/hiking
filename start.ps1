$ErrorActionPreference = "Stop"

$projectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$weatherUrl = "http://localhost:4311/hiking-weather-tool/index.html"

Set-Location -LiteralPath $projectDirectory

$listener = Get-NetTCPConnection -LocalPort 4311 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  $nodePath = (Get-Command node -ErrorAction Stop).Source
  Start-Process -FilePath $nodePath -ArgumentList "server.mjs" -WorkingDirectory $projectDirectory -WindowStyle Hidden
}

$serviceReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  if (Get-NetTCPConnection -LocalPort 4311 -State Listen -ErrorAction SilentlyContinue) {
    $serviceReady = $true
    break
  }

  Start-Sleep -Milliseconds 500
}

if (-not $serviceReady) {
  throw "天气服务未能启动，请检查 Node.js 和 server.err.log。"
}

Start-Process $weatherUrl
