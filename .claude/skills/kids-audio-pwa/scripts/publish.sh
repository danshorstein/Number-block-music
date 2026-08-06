#!/usr/bin/env bash
#
# Publish the built site to the gh-pages branch.
#
# This exists because GitHub Actions is not always available on this repo. The
# .github/workflows/deploy.yml pipeline is still the intended route — push to main and
# it publishes. Use this only when Actions is not running, with Pages configured as:
#
#   Settings → Pages → Source: Deploy from a branch → gh-pages → / (root)
#
# The two Pages sources are mutually exclusive, so switching to gh-pages means the
# Actions pipeline no longer publishes even once it recovers. Switch back to
# "GitHub Actions" when it does.
#
# Usage:  npm run deploy

set -euo pipefail

BRANCH=gh-pages
WORKTREE="$(mktemp -d)"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit or stash first — this publishes what is built," >&2
  echo "and a dirty tree makes it unclear what actually shipped." >&2
  exit 1
fi

SOURCE_COMMIT="$(git rev-parse --short HEAD)"
SOURCE_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "Building from ${SOURCE_BRANCH} (${SOURCE_COMMIT})…"
rm -rf dist
npm run build

cleanup() {
  git worktree remove "$WORKTREE" --force 2>/dev/null || true
  git worktree prune
}
trap cleanup EXIT

echo "Staging ${BRANCH}…"
git worktree add --detach "$WORKTREE" >/dev/null

(
  cd "$WORKTREE"
  # Reuse the published branch if it exists, so history is kept rather than replaced.
  if git show-ref --verify --quiet "refs/remotes/origin/${BRANCH}"; then
    git checkout -B "$BRANCH" "origin/${BRANCH}" >/dev/null 2>&1
  else
    git checkout --orphan "$BRANCH" >/dev/null 2>&1
  fi
  git rm -rf . -q 2>/dev/null || true

  cp -r "${REPO_ROOT}/dist/." .
  # Without this, Pages runs the output through Jekyll and drops anything underscored.
  touch .nojekyll

  git add -A
  if git diff --cached --quiet; then
    echo "Nothing changed — the published site already matches this build."
    exit 0
  fi

  git commit -q -m "Publish built site from ${SOURCE_BRANCH} (${SOURCE_COMMIT})"
  git push -u origin "$BRANCH"
  echo "Published ${SOURCE_COMMIT} → ${BRANCH}."
)

echo
echo "Live at https://<user>.github.io/<repo>/ once Pages rebuilds."
echo "On a phone that already has it installed, close the tab or delete and re-add the"
echo "home-screen icon — the service worker will otherwise serve the previous build once."
