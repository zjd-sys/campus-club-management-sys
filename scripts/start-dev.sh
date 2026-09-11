#!/usr/bin/env bash
# =============================================================
# 一键启动本地开发环境（Linux / macOS）
#   - 后端：Spring Boot，H2 内存库 + 演示数据，端口 8080
#   - 门户前端：Vite dev server，端口 5173（/api、/files 代理到后端）
#   - 管理前端：Vite dev server，端口 5174（/api、/files 代理到后端）
# 依赖：JDK 17+、Maven 3.8+、Node.js 18+
# =============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [1/3] 构建后端 ..."
(cd backend && mvn -q -DskipTests package)

echo "==> [2/3] 启动后端 :8080 (H2 + 演示数据) ..."
nohup java -jar backend/target/campus-club-backend.jar --server.port=8080 > backend.log 2>&1 &
echo "    日志: backend.log"

echo "==> [3/3] 启动前端 dev server ..."
(cd portal-web && { [ -d node_modules ] || npm install; } && nohup npm run dev > ../portal-web.log 2>&1 &)
(cd admin-web  && { [ -d node_modules ] || npm install; } && nohup npm run dev > ../admin-web.log 2>&1 &)

echo
echo "门户端:   http://localhost:5173"
echo "管理后台: http://localhost:5174"
echo "后端接口: http://localhost:8080/api/portal/clubs"
echo
echo "默认账号（密码均为 123456）："
echo "  超级管理员 admin / 令牌 admin123    学生 student(张三)"
echo "  教师 teacher(王老师)                学生 sunqi(孙七)"
