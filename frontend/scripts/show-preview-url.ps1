$ErrorActionPreference = 'Stop'

$headers = @(
  '-H', 'Expo-Platform: ios',
  '-H', 'Accept: application/expo+json,application/json'
)

$body = $null
for ($attempt = 1; $attempt -le 4; $attempt++) {
  $body = & curl.exe -sS --fail --max-time 20 @headers 'http://localhost:8480' 2>$null
  if ($LASTEXITCODE -eq 0 -and $body) { break }
  if ($attempt -lt 4) { Start-Sleep -Seconds 3 }
}

if (-not $body) {
  throw 'Expo preview local não respondeu na porta 8480 após múltiplas tentativas.'
}

$manifest = $body | ConvertFrom-Json
$hostUri = $manifest.extra.expoClient.hostUri
if (-not $hostUri) {
  throw 'Manifesto Expo não retornou extra.expoClient.hostUri.'
}

Write-Output ('exp://' + $hostUri)
