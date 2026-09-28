# IMPAR Outfit — Preview Environment

## Current stakeholder path: Expo Go
Project: @poshaze1/imparoutfit
Project ID: 2251ff12-7ff9-4567-b27c-fd5f26c33fc6

The canonical PC NewBio workstation runs a dedicated scheduled task:

IMPAR Outfit Expo Preview

It starts the preview from:
C:\Users\NewBio Digital\ImparOutfit\frontend

Environment:
- EXPO_PUBLIC_DEMO_MODE=true
- EXPO_PUBLIC_DEMO_AUTO_RESUME=false
- Expo CLI account: poshaze1
- port: 8480
- tunnel mode: Expo/exp.direct

Current stable development URL:
exp://1sd3dca-poshaze1-8480.exp.direct

The URL has remained stable across authenticated restarts on the same account/project/port, but it is still a development tunnel. Availability depends on the canonical PC NewBio workstation, the logged-in user session, network connectivity and Expo/ngrok infrastructure.

A Windows scheduled task restarts the server automatically at user logon and the wrapper restarts Expo if the process exits.

Versioned launcher:
frontend/scripts/start-preview-server.ps1

Runtime log:
%LOCALAPPDATA%\IMPAR-Outfit-Preview\expo-preview.log

## Canonical persistent preview path
EAS Update has been configured for the Expo project.

Updates URL:
https://u.expo.dev/2251ff12-7ff9-4567-b27c-fd5f26c33fc6

Channels:
- development
- preview
- production

The intended stakeholder architecture is:
Git release -> QA gates -> EAS preview update -> stakeholder preview build.

This removes the dependency on an always-on development machine. A preview/development build is required when the native runtime differs from Expo Go or when a stable app-specific scheme/update channel is needed.

## Release procedure
1. Run product/tech/security review.
2. Run frontend tests.
3. Run expo-doctor.
4. Run Android bundle guard.
5. Smoke PERSON journey.
6. Smoke ORGANIZATION journey.
7. Commit/push the release branch.
8. Restart the Expo Go scheduled task for immediate presentation testing.
9. Publish to the EAS preview channel after the preview build path is available.
10. Record release notes and rollback commit.

## Important boundary
Expo Go remains useful for fast stakeholder demos because the client already knows the workflow. It is not the final production distribution architecture.


## Published preview baseline — 2026-09-26
Branch: preview
Runtime version: 1.0.0
Update group: 97206ee5-6f56-4d37-a821-951b27688422
Commit: 27b736f57c1f2f916c9d56c9266c199097e249d4
Platforms: iOS and Android

This is the first hosted EAS baseline for the separated CLIENTE FINAL / LOJISTA experience.
