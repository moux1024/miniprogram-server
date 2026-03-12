#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "错误: 未找到 .env 文件"
  exit 1
fi

echo "正在重启 wechat-mall-backend..."
pm2 restart wechat-mall-backend
echo "已重启。查看状态: pm2 status"
