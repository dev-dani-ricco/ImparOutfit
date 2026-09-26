# IMPAR Outfit — 3D Professional Evolution — 2026-09-26

## PO / Project Lead
Goal: move from a generic configurable mannequin to a professional identity-and-wardrobe experience without claiming biometric precision or cloth simulation that the product does not yet have.

Acceptance:
- user can keep the local parametric avatar;
- user can create a more realistic avatar from photos/customization;
- face/body/hair/height are part of the identity model;
- garment composition uses category + measurements + visual ease;
- personal media remains private by design;
- demo remains testable in Expo Go.

## Tech Lead / Architecture
Hybrid avatar architecture:
1. PARAMETRIC: MakeHuman/MPFB2 CC0 base with local morph targets. Offline, controllable and vendor-independent.
2. AVATURN: realistic external avatar provider for photo-based identity and richer customization.
3. realisticAvatar is provider metadata, never an API secret.
4. provider URL is configuration; production API tokens must remain server-side.
5. the garment pipeline remains owned by IMPAR Outfit, not coupled to the avatar vendor.

Fallback rule: if realistic provider/model is unavailable, the parametric avatar remains functional.

## UX / Product Design
The profile now exposes two deliberate paths:
- Adjust parametric avatar: exact manual control over measurements, face and body morphs.
- Create realistic avatar from photos: higher visual resemblance and richer hair/body/face customization through the provider.

The user is told the difference between digital resemblance and physical fitting.

## Mobile
- react-native-webview integrates the realistic avatar studio and is compatible with Expo Go.
- exported GLB becomes the primary visual avatar when present.
- parametric avatar is retained as fallback and for measurement-driven fit calculations.

## Backend / Data
Current demo persists provider metadata locally in the existing profile state.
Production target:
- map provider user/avatar IDs to the internal person ID;
- store only required provider metadata;
- download/copy approved GLB to private object storage when permitted;
- version avatar specs and exports;
- revoke/delete on account/avatar deletion;
- never place provider secret tokens in the mobile client.

## 3D
Provider selected for the first professional integration: Avaturn.
Reasons:
- realistic avatars derived from photos;
- body selection/proportions;
- hair/assets/customization;
- GLB export;
- documented mobile WebView integration;
- documented custom asset pipeline that can adapt clothing assets to multiple body types.

Garment Fit V2 implemented:
- category-specific anchors;
- body-measurement scaling;
- category-specific visual ease;
- PBR material normalization;
- reversible comparison against original scale;
- still explicitly not cloth physics.

## Security / Privacy
Avaturn demo integration uses no embedded secret.
Commercial API integration requires a backend-only API token and a dedicated IMPAR Outfit provider project.
Face photos and body measurements are sensitive product data operationally; production must use explicit consent, retention rules, deletion, private storage and audited access.
Do not log images, measurements, provider tokens or exported model bytes.

## QA / Release
Required gates:
- avatar provider contract tests;
- garment-fit tests;
- Expo Doctor;
- Android/iOS bundle;
- real iPhone smoke test;
- realistic export callback;
- realistic GLB render;
- parametric fallback;
- garment composition READY quality gate;
- preview environment update.

## Vendor decision
Avaturn is the preferred integration for this cycle. The public demo project is acceptable only for the prototype. A dedicated commercial project/API package is required before production use.
SMPL-X was not selected as the commercial base because its public model download terms are non-commercial research oriented; adopting it would require a separate commercial licensing path.
