$ErrorActionPreference = "Stop"

Write-Host "Checking repository..."
if (-not (Test-Path "package.json")) { throw "package.json not found" }
if (-not (Test-Path ".env.example")) { throw ".env.example not found" }

$tracked = git ls-files
$danger = $tracked | Select-String -Pattern '(^|/)(\.env\.local|\.env|.*service.*key.*)$'
if ($danger) { throw "Potential secret file is tracked. Stop." }

npm run typecheck
npm run lint
npm run build

Write-Host "Preflight passed."
