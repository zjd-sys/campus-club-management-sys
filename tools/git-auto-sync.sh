#!/usr/bin/env bash
# ------------------------------------------------------------------
# 校园社团管理系统 — 自动提交并推送到 GitHub
#
# 用法：
#   bash tools/git-auto-sync.sh
#
# 行为：
#   - 工作区无变动    → 静默跳过
#   - 未配置远程 origin → 静默跳过（凭据未就绪时不会报错刷屏）
#   - 有变动          → git add -A && commit && push
#
# 由定时任务每 15 分钟调用一次；也可手动执行。
# ------------------------------------------------------------------
set -u

REPO_DIR="D:/WorkBuddy/Project/campus-club-management-sys"

# 禁止任何交互式凭据弹窗（非交互环境下会挂死）
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=true
export GCM_INTERACTIVE=never

cd "$REPO_DIR" || { echo "[skip] 目录不存在"; exit 0; }

git rev-parse --git-dir >/dev/null 2>&1 || { echo "[skip] 不是 git 仓库"; exit 0; }

REMOTE="$(git remote get-url origin 2>/dev/null || true)"
if [ -z "$REMOTE" ]; then
  echo "[skip] 未配置远程 origin，跳过"
  exit 0
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "[skip] 无变动"
  exit 0
fi

CHANGED="$(git status --porcelain | wc -l | tr -d ' ')"
git add -A

STAMP="$(date '+%Y-%m-%d %H:%M')"
if ! git commit -q -m "chore: 自动同步 $STAMP

共 $CHANGED 个文件变动，由 git-auto-sync 定时提交。" >/dev/null 2>&1; then
  echo "[skip] 提交失败（可能无实质变动）"
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if git push -q origin "$BRANCH" >/dev/null 2>&1; then
  echo "[ok] 已推送 $CHANGED 个文件到 origin/$BRANCH"
else
  echo "[fail] 推送失败，请检查 GitHub 凭据（PAT 是否有效/过期）"
  # 撤销提交，避免下次重复提交同一批内容导致历史堆积
  git reset -q --soft HEAD~1
  exit 1
fi
