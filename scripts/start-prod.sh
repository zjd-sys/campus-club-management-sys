#!/usr/bin/env bash
# =============================================================
# 生产启动（Linux / macOS）
#   - 启动后端 jar（默认 mysql profile；可用 PROFILE 覆盖）
#   - 前端静态产物（portal-web/dist、admin-web/dist）建议由 Nginx 托管
# 常用环境变量（均有安全默认值，可用 .env / 系统环境注入）：
#   PROFILE=mysql            运行 profile（dev=H2 演示库，mysql=生产库）
#   SERVER_PORT=8080         后端端口
#   DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD   MySQL 连接
#   STORAGE_TYPE=local|minio 文件存储方式
#   STORAGE_LOCAL_PATH=./uploads  本地存储目录（相对或绝对路径均可）
#   JWT_SECRET / ADMIN_SECRET     令牌密钥（生产必须修改）
#   APP_CORS_ALLOWED_ORIGINS      跨域白名单，逗号分隔
# =============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JAR="backend/target/campus-club-backend.jar"
if [ ! -f "$JAR" ]; then
  echo "未找到 $JAR，请先执行 scripts/build-all.sh"
  exit 1
fi

PROFILE="${PROFILE:-mysql}"
PORT="${SERVER_PORT:-8080}"

echo "启动后端: profile=$PROFILE port=$PORT"
nohup java -jar "$JAR" \
  --spring.profiles.active="$PROFILE" \
  --server.port="$PORT" \
  > backend.log 2>&1 &

echo "后端已启动（日志: backend.log）"
echo
echo "下一步：用 Nginx 托管前端静态产物并反向代理 /api 与 /files："
echo "  portal-web/dist -> 门户站点根目录"
echo "  admin-web/dist  -> 管理后台站点根目录"
echo "  例：location /api/  { proxy_pass http://127.0.0.1:$PORT; }"
echo "      location /files/ { proxy_pass http://127.0.0.1:$PORT; }"
