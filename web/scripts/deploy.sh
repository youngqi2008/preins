#!/usr/bin/env bash
# 在服务器上构建前端，并在 18180 端口启动。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-18180}"
export API_TARGET="${API_TARGET:-https://study.yuanweiep.com}"

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js，请先安装 18 或更高版本。"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "当前 Node $(node -v)，需要 18 或更高版本。"
  exit 1
fi

# 阿里云访问 registry.npmjs.org 经常停在转圈。默认走国内镜像，并优先 IPv4。
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"
export NODE_OPTIONS="--dns-result-order=ipv4first${NODE_OPTIONS:+ $NODE_OPTIONS}"
export NO_UPDATE_NOTIFIER=1
export npm_config_audit=false
export npm_config_fund=false
export npm_config_update_notifier=false
export npm_config_fetch_retries=5
export npm_config_fetch_retry_mintimeout=10000
export npm_config_fetch_retry_maxtimeout=60000
export npm_config_fetch_timeout=120000

echo "安装依赖…"
echo "镜像：${NPM_REGISTRY}"
echo "下面会逐条打印下载记录。超过一分钟没有任何输出，再按 Ctrl+C。"
if [ -f package-lock.json ]; then
  npm ci --registry "$NPM_REGISTRY" --no-audit --no-fund --loglevel=http
else
  npm install --registry "$NPM_REGISTRY" --no-audit --no-fund --loglevel=http
fi

echo "构建前端…"
npm run build

if [ ! -f dist/index.html ]; then
  echo "构建失败：缺少 dist/index.html"
  exit 1
fi

echo "启动服务…"
bash "$ROOT/scripts/start.sh"
