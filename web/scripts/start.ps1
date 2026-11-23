# 启动或停止前端。默认监听 0.0.0.0:18180。
# 用法：powershell -File scripts\start.ps1
#       powershell -File scripts\start.ps1 stop
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not $env:HOST) { $env:HOST = "0.0.0.0" }
if (-not $env:PORT) { $env:PORT = "18180" }
if (-not $env:API_TARGET) { $env:API_TARGET = "https://study.yuanweiep.com" }

$RunDir = Join-Path $Root "run"
$PidFile = Join-Path $RunDir "web.pid"
$LogFile = Join-Path $RunDir "web.log"
New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

function Stop-Web {
  if (Test-Path $PidFile) {
    $old = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($old) {
      $proc = Get-Process -Id $old -ErrorAction SilentlyContinue
      if ($proc) {
        Stop-Process -Id $old -Force -ErrorAction SilentlyContinue
      }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }
}

if ($args.Count -gt 0 -and $args[0] -eq "stop") {
  Stop-Web
  Write-Host "已停止 $($env:PORT) 端口上的前端服务。"
  exit 0
}

if (-not (Test-Path (Join-Path $Root "dist\index.html"))) {
  Write-Error "尚未构建。请先执行：powershell -File scripts\deploy.ps1"
}

Stop-Web

$server = Join-Path $Root "server.mjs"
$outLog = Join-Path $RunDir "web.out.log"
$errLog = Join-Path $RunDir "web.err.log"
$proc = Start-Process -FilePath "node" -ArgumentList "`"$server`"" -WorkingDirectory $Root `
  -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
Set-Content -Path $PidFile -Value $proc.Id -Encoding ascii
Start-Sleep -Milliseconds 600

$alive = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
if (-not $alive) {
  Write-Error "启动失败，请查看日志：$outLog 和 $errLog"
}

Write-Host "前端已启动。"
Write-Host "本机：http://127.0.0.1:$($env:PORT)"
Write-Host "对外：http://57.95.5.18:$($env:PORT)"
Write-Host "日志：$outLog"
Write-Host "停止：powershell -File scripts\start.ps1 stop"
