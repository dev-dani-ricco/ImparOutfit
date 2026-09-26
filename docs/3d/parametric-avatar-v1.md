# IMPAR Outfit — Parametric Avatar & Garment Fit V1

Date: 2026-09-26

## PO / Project Lead
Problem: the prior avatar was a fixed generic GLB with approximate deformation and synthetic hair. The commercial product needs one persistent avatar whose face, body, hair, height and measurements can be refined.

Acceptance: body and face controls must visibly alter the mesh; hair must be real 3D geometry; settings must persist; garment preview must expose proportional adaptation without claiming cloth physics.

## Tech Lead / Architecture
Core V1: canonical parametric GLB derived from MakeHuman/MPFB2 CC0 assets, with a skinned human body and hundreds of morph targets.

Canonical asset: frontend/assets/models/parametric/makehuman-parametric-base.glb
Product schema/mapping: frontend/src/avatar/avatarSpec.mjs

The product specification is independent from the rendering/provider layer. A future external selfie-to-avatar provider can implement the same specification without becoming the system of record.

Provider policy:
- default: owned parametric runtime using CC0 assets;
- premium provider: optional adapter only after privacy, SLA, cost and lock-in review;
- restricted/non-commercial topology is excluded from the commercial core.

## UX / Product Design
Avatar Studio uses three surfaces: CORPO, ROSTO and CABELO. The live 3D preview stays visible before the controls. Declared measurements are separated from perceptual morph controls and appearance choices.

A profile photo remains a reference. V1 does not claim biometric reconstruction.

## Mobile
Expo SDK 57 + React Native + React Three Fiber/Three.js.
GLBs load as binary through expo-file-system and GLTFLoader.parse.
Sliders use @react-native-community/slider.
Hair is modular 3D geometry rather than synthetic primitives.

## Backend / Data
V1 persists avatarControls in the profile structure under face, body and appearance, alongside height/bust/waist/hips.

Connected mode should persist a versioned avatar specification server-side with person_id, spec_version, engine_version, controls, provenance and optional derived_asset_id. Derived assets remain private per person.

## 3D / Reconstruction
Avatar V1 includes skinned body, macro/regional body morphs, detailed face/head/nose/eyes/mouth morphs, height normalization and modular hair.

Garment pipeline remains:
capture -> authenticated private media -> reconstruction job -> GLB -> quality gate -> dimensional placement.

V1 adds a reversible proportional fit layer. TOP favors bust/shoulder/height; PANTS favors hips/waist/height; DRESS favors bust/hips/height. This is non-uniform visual adaptation on top of the quality-gated dimensional scale.

Next garment stages:
1. canonical body/garment landmarks;
2. semantic landmarks by category;
3. rig/skin transfer or cage deformation;
4. body occlusion masks;
5. collision shell;
6. optional offline cloth drape simulation when business value justifies it.

## Security / Privacy
No face photo is sent to an external avatar provider in V1. Measurements and derived assets are private identity-linked data. They must not enter public URLs or logs. External providers require a data-processing review.

## QA / Release
Required gates:
1. parametric GLB contains expected morph targets;
2. mappings produce bounded values;
3. hair assets load locally;
4. iOS/Android bundles include avatar and hair assets;
5. Expo Doctor passes;
6. PERSON path Home -> Avatar Studio -> save -> reopen;
7. garment path quality gate -> parametric avatar -> fit toggle;
8. LOJISTA regression remains green;
9. rollback commit recorded.

## Accuracy statement
The avatar is a professional parametric representation, not a biometric scan. Garment adaptation is a visual/proportional preview, not proof of physical fit or fabric behavior.
