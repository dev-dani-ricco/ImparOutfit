# IMPAR Outfit — Professional Avatar & Garment 3D V2

Date: 2026-09-28

## PO / Project Lead

### Business problem
The previous 3D experience used one generic female GLB with four coarse body deformations and a procedural hairstyle. It demonstrated the concept, but it was not sufficient for a commercial product where the customer expects a believable personal avatar and the retailer expects clothing to evolve from capture to usable 3D.

### Outcome for this cycle
1. Let the final customer build a visibly personal avatar with body, height, face shape, skin tone, hair form and hair color.
2. Keep the preview responsive inside Expo Go.
3. Do not claim biometric reconstruction or precise fitting before there is evidence.
4. Give garments a real 3D lifecycle: parametric proxy -> reconstruction job -> quality gate -> private validated GLB -> composition.
5. Establish a commercially safe asset pipeline with explicit provenance.

## Tech Lead / Architecture

### Provider decision
The product uses a provider-agnostic AvatarProfile contract.

Current runtime provider:
- PARAMETRIC_LOCAL_V2: real-time, on-device preview compatible with Expo Go.

Production asset compiler target:
- MAKEHUMAN_CC0: MakeHuman/MPFB base meshes, targets, skins and core assets are CC0 and can be used in a closed-source/commercial character generator.

Optional future provider:
- AVATURN: realistic selfie-based avatar service; useful for a high-fidelity managed option, but advanced API/Web SDK access is paid and creates vendor/runtime dependency.

Rejected as default:
- SMPL-X: official download terms are non-commercial research for the public model package.
- MetaHuman: current content terms make it an Unreal-centered/UE-only content path and unsuitable as the base of this mobile product.

### Architecture
Mobile editor -> AvatarProfile v2 -> instant parametric preview.
AvatarProfile v2 -> authenticated API -> avatar compilation job -> private storage -> licensed/provenanced GLB -> quality gate -> renderer.

No user face photo is baked into a public texture. Face photos remain private inputs/references.

## UX / Product Design

The editor now separates:
- body base;
- body refinements;
- face preset;
- face refinements;
- skin tone;
- hairstyle;
- hair color;
- declared measurements.

Body and face changes update the 3D preview immediately. The UI avoids suggesting that a photo automatically produces an exact biometric twin.

## Mobile

Implemented:
- AvatarProfile V2 domain contract.
- body morphs: bust, waist, hips, height, shoulders, torso, thighs.
- face morphs: head width, jaw, chin, face depth.
- skin color control.
- seven hair silhouettes and six hair colors.
- binary GLB loading compatible with Expo SDK 57.
- explicit V2 status labels.
- category-based garment 3D proxy for immediate feedback.
- reconstructed garment path remains separate and quality-gated.

## Backend / Data

AvatarProfile v2 fields are versioned and provider-tagged:
- avatarProvider
- avatarVersion
- bodyPreset
- faceShape
- skinTone
- hairStyleId
- hairColor
- shoulders / torso / thighs
- headWidth / jaw / chin / faceDepth
- bust / waist / hips / height
- avatarConfiguredAt / avatarUpdatedAt

Production compilation should persist:
- input profile hash;
- provider;
- provider version;
- asset license/provenance;
- output checksum;
- private object key;
- quality status;
- generated_at.

## 3D / Reconstruction

### Avatar
PARAMETRIC_LOCAL_V2 is a live editor, not a biometric scanner. It creates meaningful visual differentiation while the MakeHuman CC0 compiler is integrated.

MakeHuman/MPFB is the chosen owned pipeline because its target system is already based on blend-shape-like vertex offsets and the core graphical assets are CC0.

### Garments
Garments have two clearly separated visual states:

1. PARAMETRIC_PROXY
Fast category-derived volume used before reconstruction.

2. RECONSTRUCTED_GLB
Private geometry created from valid multiview inputs. Only a READY output that passes the configured quality gate can be used as a reconstructed item in composition.

The proxy must never be presented as the captured garment itself.

## Security / Privacy

- Face photos and multiview clothing inputs remain private.
- No public object-storage URL for personal media.
- Provider access tokens belong server-side only.
- Store asset provenance and license metadata with compiled outputs.
- Do not use unknown-provenance human meshes in production.
- Existing michelle.glb remains a development fallback until replaced by a verified CC0 compiled human base.

## QA / Release

Mandatory gates:
- AvatarProfile contract tests.
- Expo Doctor.
- native Android bundle.
- native GLB load.
- face/body parameter smoke tests.
- garment proxy render.
- reconstructed GLB quality-gate regression.
- iOS Expo Go smoke.
- asset provenance gate before production promotion.

## External research used

MakeHuman:
- https://static.makehumancommunity.org/about/license.html
- https://static.makehumancommunity.org/mpfb/faq/build_other_chargen.html
- https://static.makehumancommunity.org/mpfb/docs/assets/concept_targets.html

Avaturn:
- https://docs.avaturn.me/
- https://docs.avaturn.me/docs/integration/api/introduction/

SMPL-X:
- https://smpl-x.is.tue.mpg.de/register.php

MetaHuman:
- https://www.unrealengine.com/eula/content

## Acceptance boundary

This cycle improves personalization and 3D professionalism materially, but does not claim:
- medical or biometric body measurement;
- exact face reconstruction from one photo;
- precise garment fitting;
- cloth physics;
- purchase-size prediction.

Those require calibrated capture, validated body reconstruction and cloth/fitting validation as separate product milestones.
