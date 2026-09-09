#!/usr/bin/env bash
# ------------------------------------------------------------------
# 校园社团管理系统 — 配置 GitHub 远程并完成首次推送
#
# 用法：
#   bash tools/git-setup-remote.sh <仓库地址> [GitHub PAT]
#
# 示例：
#   bash tools/git-setup-remote.sh https://github.com/zjd-sys/campus-club-management-sys.git ghp_xxx
#   bash tools/git-setup-remote.sh git@github.com:zjd-sys/campus-club-management-sys.git
#
# 说明：
#   - 第二个参数 PAT 可选。给了就写入 Git 凭据管理器，后续定时任务无需再次输入。
#   - 若远端仓库已带 README/LICENSE 导致推送冲突，脚本会自动 rebase 后重试。
# ------------------------------------------------------------------
set -u

REPO_DIR="D:/WorkBuddy/Project/campus-club-management-sys"
REMOTE_URL="${1:-}"
TOKEN="${2:-}"

if [ -z "$REMOTE_URL" ]; then
  echo "[error] 缺少仓库地址"
  echo "用法: bash tools/git-setup-remote.sh <仓库地址> [GitHub PAT]"
  exit 1
fi

cd "$REPO_DIR" || exit 1

# 非交互：禁用一切凭据弹窗
export GIT_TERMINAL_PROMPT=0

# ---------------- 1. 保存凭据 ----------------
if [ -n "$TOKEN" ]; then
  # 提取 host（兼容 https:// 与 git@ 两种写法）
  HOST="$(echo "$REMOTE_URL" | sed -E 's#^https?://([^/]+)/.*#\1#; s#^git@([^:]+):.*#\1#')"
  if [ "$HOST" = "$REMOTE_URL" ]; then HOST="github.com"; fi

  # 未配置凭据助手时启用 Git Credential Manager（Windows 自带）
  if [ -z "$(git config --get credential.helper)" ]; then
    git config credential.helper manager
  fi

  printf 'protocol=https\nhost=%s\nusername=zjd-sys\npassword=%s\n\n' "$HOST" "$TOKEN" \
    | git credential approve
  echo "[ok] 凭据已保存到 Git 凭据管理器（host=$HOST）"
fi

# ---------------- 2. 配置远程 ----------------
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
  echo "[ok] 已更新 origin -> $REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
  echo "[ok] 已添加 origin -> $REMOTE_URL"
fi

# ---------------- 3. 推送 ----------------
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "[..] 推送 $BRANCH 到 origin ..."

if git push -u origin "$BRANCH" 2>&1; then
  echo "[ok] 首次推送完成"
  exit 0
fi

echo "[..] 直接推送失败，尝试合并远端已有内容（README/LICENSE）后重试 ..."
if git pull --rebase --allow-unrelated-histories origin "$BRANCH" 2>&1; then
  if git push -u origin "$BRANCH" 2>&1; then
    echo "[ok] 已合并远端内容并推送完成"
    exit 0
  fi
fi

echo "[fail] 推送失败。请检查："
echo "        1) 仓库地址是否正确"
echo "        2) PAT 是否有效且勾选了 repo 权限"
echo "        3) 若是 SSH 地址，确认公钥已添加到 GitHub"
exit 1
