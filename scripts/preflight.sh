#!/usr/bin/env bash
set -euo pipefail

echo "Checking repository..."
test -f package.json
test -f .env.example

if git ls-files | grep -E '(^|/)(\.env\.local|\.env|.*service.*key.*)$'; then
  echo "Potential secret file is tracked. Stop."
  exit 1
fi

npm run typecheck
npm run lint
npm run build

echo "Preflight passed."
