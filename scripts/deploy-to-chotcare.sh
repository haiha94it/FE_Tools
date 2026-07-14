#!/usr/bin/env bash
# Đồng bộ FE_ZALO_V2 lên server ~/chotcare rồi build Docker.
# Usage: ./scripts/deploy-to-chotcare.sh
#        REMOTE=root@your-server REMOTE_DIR=~/chotcare ./scripts/deploy-to-chotcare.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${REMOTE:-root@chotnhanh}"
REMOTE_DIR="${REMOTE_DIR:-~/chotcare}"

echo "==> Sync FE_ZALO_V2 -> ${REMOTE}:${REMOTE_DIR}"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .grok \
  --exclude .agents \
  "${ROOT}/" "${REMOTE}:${REMOTE_DIR}/"

echo "==> Remote build..."
ssh "${REMOTE}" "cd ${REMOTE_DIR} && docker compose build nextjs && docker compose up -d nextjs"

echo "==> Done."