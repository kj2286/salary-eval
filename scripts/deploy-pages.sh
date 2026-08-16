#!/usr/bin/env bash
# 빌드 → gh-pages 브랜치에 반영 → 푸시. 공개 주소: https://kj2286.github.io/salary-eval/
# 사용: npm run deploy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE="$ROOT/.pages-worktree"
cd "$ROOT"

echo "▶ 빌드"
npm run build

echo "▶ gh-pages 워크트리 준비"
# dist/ 는 vite 가 매 빌드마다 비우므로, 배포용 git 이력은 별도 워크트리에 둔다
git fetch --quiet origin gh-pages
rm -rf "$WORKTREE"
git worktree prune
git worktree add --quiet -f "$WORKTREE" gh-pages

echo "▶ 산출물 복사"
rsync -a --delete --exclude '.git' "$ROOT/dist/" "$WORKTREE/"
touch "$WORKTREE/.nojekyll"  # _ 로 시작하는 경로도 그대로 서빙되게

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "✔ 변경 없음 — 배포 생략"
else
  git commit --quiet -m "deploy: $(date '+%Y-%m-%d %H:%M')"
  git push --quiet origin gh-pages
  echo "✔ 푸시 완료 — 반영까지 30초~1분"
fi

cd "$ROOT"
git worktree remove --force "$WORKTREE"
echo "▶ https://kj2286.github.io/salary-eval/"
