#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "错误: 未找到 .env 文件，请先复制 .env.example 为 .env 并填写配置"
  exit 1
fi

mkdir -p logs

echo "正在启动 wechat-mall-backend..."
pm2 start ecosystem.config.cjs "$@"

echo ""
echo "启动完成。常用命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs wechat-mall-backend"
echo "  开机自启: 先执行 pm2 save，再按提示执行 pm2 startup"
echo ""
