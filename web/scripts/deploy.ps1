# 在服务器上构建前端，并在 18180 端口启动。
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not $env:HOST) { $env:HOST = "0.0.0.0" }
if (-not $env:PORT) { $env:PORT = "18180" }
if (-not $env:API_TARGET) { $env:API_TARGET = "https://study.yuanweiep.com" }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Error "未找到 Node.js，请先安装 18 或更高版本。"
}
$major = [int](node -p "process.versions.node.split('.')[0]")
if ($major -lt 18) {
  Write-Error "当前 Node $(node -v)，需要 18 或更高版本。"
}

Write-Host "安装依赖…"
if (Test-Path "package-lock.json") {
  npm ci
} else {
  npm install
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "构建前端…"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if (-not (Test-Path "dist\index.html")) {
  Write-Error "构建失败：缺少 dist\index.html"
}

Write-Host "启动服务…"
& "$PSScriptRoot\start.ps1"
