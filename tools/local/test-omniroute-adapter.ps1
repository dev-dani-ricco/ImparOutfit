param(
  [string]$Model = "openrouter/nex-agi/nex-n2.5-mini:free"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Backend = Join-Path $RepoRoot "backend"
$OmniDb = Join-Path $env:USERPROFILE ".omniroute\storage.sqlite"

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
  throw "Outfit OmniRoute key unavailable"
}

$env:IMPAR_AI_GATEWAY_URL = "http://127.0.0.1:20128/v1"
$env:IMPAR_AI_GATEWAY_KEY = $Key
$env:IMPAR_AI_MODEL = $Model

try {
  Push-Location $Backend
  $Script = @'
import {omnirouteAdapter} from "./src/ai/omnirouteAdapter.js";
try {
  const result = await omnirouteAdapter.execute(
    {task:"IMPAR_ANALYSIS",instruction:"Return only valid JSON with status equal to ok.",input:{test:true}},
    {model_identifier:process.env.IMPAR_AI_MODEL,timeout_ms:45000}
  );
  console.log(JSON.stringify({ok:true,model:process.env.IMPAR_AI_MODEL,keys:Object.keys(result.output||{}),usage:result.usage||null}));
} catch (error) {
  console.log(JSON.stringify({ok:false,model:process.env.IMPAR_AI_MODEL,code:error.code||"UNKNOWN"}));
  process.exitCode=1;
}
'@
  $Script | node --input-type=module -
}
finally {
  Pop-Location
  Remove-Item Env:IMPAR_AI_GATEWAY_KEY -ErrorAction SilentlyContinue
}
