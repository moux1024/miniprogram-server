#!/usr/bin/env bash
set -e

echo "正在停止 wechat-mall-backend..."
pm2 stop wechat-mall-backend
echo "已停止。"
