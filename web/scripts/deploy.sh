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

echo "安装依赖…"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "构建前端…"
npm run build

if [ ! -f dist/index.html ]; then
  echo "构建失败：缺少 dist/index.html"
  exit 1
fi

echo "启动服务…"
bash "$ROOT/scripts/start.sh"
