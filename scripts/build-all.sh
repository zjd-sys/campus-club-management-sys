#!/usr/bin/env bash
# =============================================================
# 生产构建（Linux / macOS）
#   - 后端：Maven 打包 -> backend/target/campus-club-backend.jar
#   - 前端：Vite 构建 -> portal-web/dist、admin-web/dist
# 依赖：JDK 17+、Maven 3.8+、Node.js 18+
# =============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [1/3] 构建后端 ..."
(cd backend && mvn -q -DskipTests package)
echo "    产物: backend/target/campus-club-backend.jar"

echo "==> [2/3] 构建门户前端 ..."
(cd portal-web && { [ -d node_modules ] || npm install; } && npm run build)
echo "    产物: portal-web/dist"

echo "==> [3/3] 构建管理前端 ..."
(cd admin-web && { [ -d node_modules ] || npm install; } && npm run build)
echo "    产物: admin-web/dist"

echo
echo "构建完成。生产启动：bash scripts/start-prod.sh"
