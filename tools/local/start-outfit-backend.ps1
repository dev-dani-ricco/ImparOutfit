$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Backend = Join-Path $RepoRoot "backend"
$OmniDb = Join-Path $env:USERPROFILE ".omniroute\storage.sqlite"

if (-not (Test-Path -LiteralPath $OmniDb)) {
    throw "OmniRoute storage not found: $OmniDb"
}

$Python = @'
import sqlite3, sys
db=sys.argv[1]
c=sqlite3.connect(db)
row=c.execute("""
select key
from api_keys
where name='impar-outfit-local'
  and is_active=1
  and revoked_at is null
limit 1
""").fetchone()
if not row or not row[0]:
    raise SystemExit(2)
sys.stdout.write(row[0])
'@

$Key = $Python | python - $OmniDb
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($Key)) {
    throw "Active OmniRoute key 'impar-outfit-local' not available"
}

$env:IMPAR_AI_GATEWAY_URL = "http://127.0.0.1:20128/v1"
$env:IMPAR_AI_GATEWAY_KEY = $Key
$env:IMPAR_AI_MODEL = if ($env:IMPAR_AI_MODEL) { $env:IMPAR_AI_MODEL } else { "openrouter/nex-agi/nex-n2.5-mini:free" }
$env:IMPAR_PRIVATE_CONTENT_ROOT = if ($env:IMPAR_PRIVATE_CONTENT_ROOT) {
    $env:IMPAR_PRIVATE_CONTENT_ROOT
} else {
    Join-Path $env:USERPROFILE "ImparOutfit-private\content"
}

New-Item -ItemType Directory -Force -Path $env:IMPAR_PRIVATE_CONTENT_ROOT | Out-Null

try {
    Push-Location $Backend
    npm start
}
finally {
    Pop-Location
    Remove-Item Env:IMPAR_AI_GATEWAY_KEY -ErrorAction SilentlyContinue
}
