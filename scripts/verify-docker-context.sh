#!/usr/bin/env bash
# Chạy TRÊN SERVER trong thư mục build (~/chotcare) trước docker compose build
set -euo pipefail

EXPECTED="free-nextjs-admin-dashboard"
NAME="$(node -p "require('./package.json').name")"

echo "Thư mục: $(pwd)"
echo "package.json name: ${NAME}"

if [ "${NAME}" != "${EXPECTED}" ]; then
  echo ""
  echo "LOI: Day la codebase ZaloCN cu (CHOTCARE), khong phai FE_ZALO_V2."
  echo "Dockerfile dung nhung build context SAI — can deploy toan bo FE_ZALO_V2 vao ~/chotcare."
  exit 1
fi

if [ ! -d src/app ]; then
  echo "LOI: Thieu src/app — chua copy source FE_ZALO_V2."
  exit 1
fi

if [ ! -f package-lock.json ]; then
  echo "LOI: Thieu package-lock.json."
  exit 1
fi

echo "OK — co the chay: docker compose build nextjs"