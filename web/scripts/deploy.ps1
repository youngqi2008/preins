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

if (-not $env:NPM_REGISTRY) { $env:NPM_REGISTRY = "https://registry.npmmirror.com" }
if ($env:NODE_OPTIONS) {
  $env:NODE_OPTIONS = "--dns-result-order=ipv4first $($env:NODE_OPTIONS)"
} else {
  $env:NODE_OPTIONS = "--dns-result-order=ipv4first"
}
$env:NO_UPDATE_NOTIFIER = "1"
$env:npm_config_audit = "false"
$env:npm_config_fund = "false"
$env:npm_config_update_notifier = "false"
$env:npm_config_fetch_retries = "5"
$env:npm_config_fetch_timeout = "120000"

Write-Host "安装依赖…"
Write-Host "镜像：$($env:NPM_REGISTRY)"
if (Test-Path "package-lock.json") {
  npm ci --registry $env:NPM_REGISTRY --no-audit --no-fund --loglevel=http
} else {
  npm install --registry $env:NPM_REGISTRY --no-audit --no-fund --loglevel=http
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
