# IMPAR Outfit — Preview Environment

## Current stakeholder path: Expo Go
Project: @poshaze1/imparoutfit
Project ID: 2251ff12-7ff9-4567-b27c-fd5f26c33fc6

Active preview host at the 2026-09-28 checkpoint:
PCNewBioDigital

Worktree:
C:\Users\NewBio Digital\ImparOutfit-runtime\frontend

Environment:
- EXPO_PUBLIC_DEMO_MODE=true
- EXPO_PUBLIC_DEMO_AUTO_RESUME=false
- Expo CLI account: poshaze1
- port: 8480
- tunnel mode: Expo/exp.direct

Current runtime URL at the 2026-09-28 checkpoint:
exp://0xw0s2w-poshaze1-8480.exp.direct

The Expo/ngrok hostname can rotate after a restart. Do not treat a previously documented `exp.direct` hostname as persistent. Resolve the live URL from the local manifest with:

`frontend/scripts/show-preview-url.ps1`

The resolver retries the local manifest to tolerate a cold Metro start.

The versioned preview wrapper is:
`frontend/scripts/start-preview-server.ps1`

On PCNewBioDigital, Windows Task Scheduler registration was denied for the current user. The equivalent startup behavior is therefore configured under the current user's HKCU Run entry:

`IMPAR Outfit Expo Preview`

This starts the same wrapper at user login without administrator privileges. The wrapper itself restarts Expo after an unexpected process exit.

Runtime log:
`%LOCALAPPDATA%\IMPAR-Outfit-Preview\expo-preview.log`

Availability of this development preview still depends on the active workstation, logged-in user session, network connectivity and Expo/ngrok infrastructure.

## Canonical persistent preview path
EAS Update is configured for the Expo project.

Updates URL:
https://u.expo.dev/2251ff12-7ff9-4567-b27c-fd5f26c33fc6

Channels:
- development
- preview
- production

The intended stakeholder architecture remains:

Git release -> QA gates -> EAS preview update -> stakeholder preview build.

This removes the dependency on an always-on development workstation. A preview/development build is required when the native runtime differs from Expo Go or when a stable app-specific scheme/update channel is needed.

## Release procedure
1. Run product/tech/security review.
2. Run frontend tests.
3. Run expo-doctor.
4. Run Android bundle guard.
5. Run iOS export/bundle.
6. Smoke PERSON journey on a physical device.
7. Smoke ORGANIZATION journey on a physical device.
8. Validate parametric avatar, Avaturn export/render, fallback and Garment Fit V2.
9. Commit/push the release branch.
10. Publish to the EAS preview channel only after the physical smoke gate is green.
11. Record release notes and rollback commit.

## Important boundary
Expo Go remains useful for fast stakeholder demos because the client already knows the workflow. It is not the final production distribution architecture.

## Published preview baseline — 2026-09-26
Branch: preview
Runtime version: 1.0.0
Update group: 97206ee5-6f56-4d37-a821-951b27688422
Commit: 27b736f57c1f2f916c9d56c9266c199097e249d4
Platforms: iOS and Android

This hosted EAS preview baseline predates the final realistic-avatar / Garment Fit V2 production promotion.

## Published production runtime — 2026-09-28
Channel: production
Runtime version: 1.0.0
Update group: cbd838c5-afb2-4487-9e07-ac5d1eff5cfa
Commit: fe52a0bdeeee6dbf7621fd9fd8f28405b19463d4
Platforms: iOS and Android
Message: `Production: Avatar Hibrido + Garment Fit V2 - smoke mobile aprovado`

This is the production EAS runtime approved after the user's physical mobile smoke. It is a demonstrable production runtime, not yet a store-distributed connected binary. The connected distribution remains blocked until a public HTTPS API is deployed and `EXPO_PUBLIC_API_URL` is configured in the EAS production environment.
