#!/usr/bin/env bash
# 启动或停止前端。默认监听 0.0.0.0:18180。
# 用法：bash scripts/start.sh
#       bash scripts/start.sh stop
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-18180}"
API_TARGET="${API_TARGET:-https://study.yuanweiep.com}"
RUN_DIR="$ROOT/run"
PID_FILE="$RUN_DIR/web.pid"
LOG_FILE="$RUN_DIR/web.log"

mkdir -p "$RUN_DIR"

stop_server() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5 6 7 8 9 10; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.3
      done
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
}

if [ "${1:-}" = "stop" ]; then
  stop_server
  echo "已停止 ${PORT} 端口上的前端服务。"
  exit 0
fi

if [ ! -f "$ROOT/dist/index.html" ]; then
  echo "尚未构建。请先执行：bash scripts/deploy.sh"
  exit 1
fi

stop_server

export HOST PORT API_TARGET
nohup node "$ROOT/server.mjs" >>"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
sleep 0.5

PID="$(cat "$PID_FILE")"
if ! kill -0 "$PID" 2>/dev/null; then
  echo "启动失败，请查看日志：$LOG_FILE"
  exit 1
fi

echo "前端已启动。"
echo "本机：http://127.0.0.1:${PORT}"
echo "对外：http://57.95.5.18:${PORT}"
echo "日志：$LOG_FILE"
echo "停止：bash scripts/start.sh stop"
