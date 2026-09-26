param(
  [string[]]$Prefixes = @("gemini/","google/","deepseek/","mistral/","grok-cli/","gc/")
)

$ErrorActionPreference = "Stop"
$OmniDb = Join-Path $env:USERPROFILE ".omniroute\storage.sqlite"

$Python = @'
import sqlite3, sys, json, urllib.request
db=sys.argv[1]
prefixes=sys.argv[2].split(';')
c=sqlite3.connect(db)
row=c.execute("""
select key from api_keys
where name='impar-outfit-local'
  and is_active=1
  and revoked_at is null
limit 1
""").fetchone()
if not row or not row[0]:
    raise SystemExit(2)
req=urllib.request.Request(
    "http://127.0.0.1:20128/v1/models",
    headers={"Authorization":"Bearer "+row[0]}
)
with urllib.request.urlopen(req,timeout=15) as r:
    data=json.load(r)
ids=[m.get("id") for m in data.get("data",[]) if m.get("id")]
for prefix in prefixes:
    print("PREFIX="+prefix)
    for mid in [x for x in ids if x.startswith(prefix)][:40]:
        print(mid)
'@

$PrefixArg = ($Prefixes -join ';')
$Python | python - $OmniDb $PrefixArg
