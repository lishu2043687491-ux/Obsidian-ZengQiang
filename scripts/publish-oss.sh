#!/usr/bin/env bash
# 一键开源发布：同步源码 → 构建验收 → push → GitHub Release → 自动点社区 Check for new releases
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${SRC_VAULT:-/Users/mac/Obsidian/近期工作/.obsidian/plugins/feishu-doc-toolbar}"
REPO="${GITHUB_REPO_DIR:-$ROOT}"
GITHUB_REPO="${GITHUB_REPO:-lishu2043687491-ux/Obsidian-ZengQiang}"
SKIP_COMMUNITY="${SKIP_COMMUNITY:-0}"

export PATH="/Users/mac/.local/bin:/usr/bin:/bin:/usr/local/bin:$PATH"

VERSION="$(node -p "require('$SRC/manifest.json').version")"
NOTES_FILE="$REPO/RELEASE_NOTES_${VERSION}.md"

echo "==> ZengQiang OSS publish $VERSION"
echo "    src : $SRC"
echo "    repo: $REPO"

if [[ ! -f "$NOTES_FILE" ]]; then
  echo "缺少 $NOTES_FILE，请先撰写 RELEASE_NOTES_${VERSION}.md"
  exit 1
fi

echo "==> sync source to GitHub clone"
rsync -a --delete \
  --exclude 'node_modules/' \
  --exclude 'data.json' \
  --exclude 'data.json.bak*' \
  --exclude 'file-versions/' \
  --exclude '_git_snapshots/' \
  --exclude 'backups/' \
  --exclude '*.bak*' \
  "$SRC/src/" "$REPO/src/"

rsync -a "$SRC/scripts/" "$REPO/scripts/"
rsync -a "$SRC/tests/" "$REPO/tests/" \
  --exclude 'claudian-test-bundle.cjs' \
  --exclude 'managed-plugin-auto-updater-bundle.cjs' \
  --exclude 'goal-progress-sync-bundle.cjs' \
  --exclude 'native-table-video-helpers-bundle.cjs'

cp "$SRC/manifest.json" "$REPO/manifest.json"
cp "$SRC/styles.css" "$REPO/styles.css"
cp "$SRC/package.json" "$REPO/package.json"
[[ -f "$SRC/package-lock.json" ]] && cp "$SRC/package-lock.json" "$REPO/package-lock.json" || true

echo "==> build + verify (vault)"
cd "$SRC"
npm install
npm run build:oss
if rg -n "os\.hostname|localStorage|/Users/mac|近期工作|知识仓库" main.js >/dev/null 2>&1; then
  echo "main.js 泄漏检查失败"
  exit 1
fi
npm run test:smoke
npm run audit:css

echo "==> git commit + push"
cd "$REPO"
if git diff --quiet && git diff --cached --quiet; then
  echo "源码无变更，跳过 commit"
else
  git add manifest.json package.json styles.css src/ scripts/ tests/ "RELEASE_NOTES_${VERSION}.md" COMMUNITY_SUBMISSION.md 2>/dev/null || \
  git add manifest.json package.json styles.css src/ scripts/ tests/ "RELEASE_NOTES_${VERSION}.md"
  git commit -m "$(cat <<EOF
Release ${VERSION}: OSS publish.

EOF
)"
fi
git push origin main

echo "==> GitHub Release"
RELEASE_DIR="/tmp/zengqiang-${VERSION}-release"
rm -rf "$RELEASE_DIR" && mkdir -p "$RELEASE_DIR"
cp "$SRC/main.js" "$SRC/manifest.json" "$SRC/styles.css" "$RELEASE_DIR/"
if gh release view "$VERSION" --repo "$GITHUB_REPO" >/dev/null 2>&1; then
  echo "Release $VERSION 已存在，跳过 gh release create"
else
  gh release create "$VERSION" \
    --repo "$GITHUB_REPO" \
    --title "$VERSION" \
    --notes-file "$NOTES_FILE" \
    "$RELEASE_DIR/main.js" \
    "$RELEASE_DIR/manifest.json" \
    "$RELEASE_DIR/styles.css"
fi

if [[ "$SKIP_COMMUNITY" == "1" ]]; then
  echo "==> SKIP_COMMUNITY=1，跳过社区 Check for new releases"
  exit 0
fi

echo "==> Obsidian Community: Check for new releases"
cd "$REPO"
if node scripts/trigger-community-release-check.mjs; then
  echo "社区 Check for new releases 已完成"
else
  echo "WARN: 社区自动点击未完成（可能需首次登录）。Release 已推上 GitHub。"
  echo "  首次请执行: cd $REPO && npm run community:login"
  echo "  之后发布会自动完成此步。"
fi

echo "==> publish complete: $VERSION"
