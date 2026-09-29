$ErrorActionPreference = 'Continue'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logRoot = Join-Path $env:LOCALAPPDATA 'IMPAR-Outfit-Preview'
$logFile = Join-Path $logRoot 'expo-preview.log'

New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
Set-Location $repo

$env:EXPO_PUBLIC_DEMO_MODE = 'true'
$env:EXPO_PUBLIC_DEMO_AUTO_RESUME = 'false'
$env:EXPO_PUBLIC_API_URL = 'https://impar-outfit-api.vercel.app/api'
$env:CI = '1'

$existingListener = Get-NetTCPConnection -LocalPort 8480 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingListener) {
  $existingProcess = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $existingListener.OwningProcess) -ErrorAction SilentlyContinue
  if ($existingProcess -and $existingProcess.Name -eq 'node.exe' -and $existingProcess.CommandLine -match 'ImparOutfit' -and $existingProcess.CommandLine -match 'expo') {
    Add-Content -Path $logFile -Value ("[" + (Get-Date -Format o) + "] stopping stale IMPAR Outfit Expo listener PID " + $existingListener.OwningProcess)
    Stop-Process -Id $existingListener.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
}

while ($true) {
  $stamp = Get-Date -Format o
  Add-Content -Path $logFile -Value "[$stamp] starting Expo Go preview on port 8480"
  try {
    & npx expo start --go --tunnel --port 8480 --clear *>> $logFile
    $exitCode = $LASTEXITCODE
  } catch {
    $exitCode = 1
    Add-Content -Path $logFile -Value ("[" + (Get-Date -Format o) + "] error: " + $_.Exception.Message)
  }
  Add-Content -Path $logFile -Value ("[" + (Get-Date -Format o) + "] Expo exited with code " + $exitCode + "; restarting in 8 seconds")
  Start-Sleep -Seconds 8
}
