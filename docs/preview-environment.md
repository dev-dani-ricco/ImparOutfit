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
Git release -> QA gates -> PostgreSQL-backed HTTPS API -> EAS preview environment -> stakeholder preview build.

This removes the dependency on an always-on development machine. A preview/development build is required when the native runtime differs from Expo Go or when a stable app-specific scheme/update channel is needed.

### Persistent preview status — 2026-09-28
Validated on PC NewBio:
- Expo/EAS account authenticated as @poshaze1;
- project ID confirmed: 2251ff12-7ff9-4567-b27c-fd5f26c33fc6;
- preview environment defines EXPO_PUBLIC_API_URL=https://impar-outfit-api.vercel.app/api;
- distributed API guard passes with REQUIRE_DISTRIBUTED_API=true;
- Android internal build finished successfully on channel preview;
- build ID: 9bbf5625-a1a2-4f2c-bf2f-8924b931ba40;
- runtime version: 1.0.0;
- APK artifact responds HTTP 200 and is independent from the NewBio Metro process;
- production API passes registration, Neon persistence, private media upload, signed media access and signed media read end to end.

The EAS preview path is now the persistent stakeholder distribution path. Expo Go remains a faster development/demo fallback, but is no longer the only route available.

## Release procedure
1. Run product/tech/security review.
2. Run frontend and backend test gates.
3. Run Expo Doctor.
4. Run distributed API config + Android bundle guard.
5. Run npm run smoke:production-media against the public API.
6. Smoke PERSON and ORGANIZATION journeys on real devices.
7. Commit/push the release branch.
8. Use the EAS preview build for persistent Android stakeholder testing.
9. Keep Expo Go as the fast development fallback.
10. Record release notes and rollback commit.

## iOS boundary
The preview environment and API configuration are valid for iOS, but the internal EAS build cannot be generated non-interactively until Apple provisioning credentials / a registered device are configured. EAS explicitly returned that no suitable internal-distribution credentials are available.

## Important boundary
Expo Go remains useful for fast stakeholder demos. The Android EAS preview is the first independent persistent build; iOS persistent distribution still depends on Apple provisioning.


## Published preview baseline — 2026-09-26
Branch: preview
Runtime version: 1.0.0
Update group: 97206ee5-6f56-4d37-a821-951b27688422
Commit: 27b736f57c1f2f916c9d56c9266c199097e249d4
Platforms: iOS and Android

This is the first hosted EAS baseline for the separated CLIENTE FINAL / LOJISTA experience.
