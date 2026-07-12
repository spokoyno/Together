param(
  [string]$Message = "",
  [switch]$SkipCheck,
  [switch]$SkipDb,
  [switch]$SkipGit
)

$ErrorActionPreference = "Stop"

function Read-DotEnvValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (-not (Test-Path $FilePath)) {
    return $null
  }

  foreach ($line in Get-Content $FilePath) {
    if ($line -match '^\s*#') { continue }
    if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.*)\s*$") {
      $value = $matches[1].Trim()
      if (
        ($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))
      ) {
        return $value.Substring(1, $value.Length - 2)
      }
      return $value
    }
  }

  return $null
}

function Invoke-Step {
  param(
    [string]$Title,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  & $Action
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Test-Path "package.json")) {
  throw "Run this script from the project root."
}

$trackedSecrets = git ls-files | Select-String -Pattern '(^|/)(\.env\.local|\.env)$'
if ($trackedSecrets) {
  throw ".env or .env.local is tracked by git. Remove secrets before deploy."
}

Invoke-Step "App check: typecheck, lint, build" {
  if ($SkipCheck) {
    Write-Host "Skipped: SkipCheck"
    return
  }
  npm run check
}

if (-not $SkipGit) {
  Invoke-Step "Git: commit and push" {
    $status = git status --porcelain
    if ($status) {
      git add -A
      if (-not $Message) {
        $Message = "chore: deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
      }
      git commit -m $Message
      Write-Host "Commit created: $Message"
    } else {
      Write-Host "No local changes to commit."
    }

    $branch = git rev-parse --abbrev-ref HEAD
    git push -u origin $branch
    Write-Host "Push done. Vercel will deploy branch: $branch"
  }
} else {
  Write-Host "Skipped: SkipGit"
}

if (-not $SkipDb) {
  Invoke-Step "Supabase: db push" {
    $password = $env:SUPABASE_DB_PASSWORD
    if (-not $password) {
      $password = Read-DotEnvValue -FilePath ".env.local" -Key "SUPABASE_DB_PASSWORD"
    }

    $supabase = Join-Path $repoRoot "node_modules\.bin\supabase.cmd"
    if (-not (Test-Path $supabase)) {
      throw "Supabase CLI not found. Run: npm install"
    }

    if ($password) {
      & $supabase db push --linked --yes -p $password
    } else {
      Write-Host "SUPABASE_DB_PASSWORD is missing. CLI will ask for password."
      Write-Host "Add SUPABASE_DB_PASSWORD to .env.local to skip the prompt."
      & $supabase db push --linked --yes
    }

    & $supabase migration list --linked
  }
} else {
  Write-Host "Skipped: SkipDb"
}

Write-Host ""
Write-Host "Deploy finished." -ForegroundColor Green
Write-Host "1. GitHub updated"
Write-Host "2. Vercel deploys automatically after push"
Write-Host "3. Supabase migrations applied"
