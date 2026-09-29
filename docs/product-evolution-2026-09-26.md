# IMPAR Outfit — Product Evolution Plan — 2026-09-26

> HISTÓRICO. A fonte operacional vigente de maturação e MVP é `EXECUTION-MAP-IMPAR-OUTFIT-MVP.md`.

## Product diagnosis
The backend/domain foundation has evolved faster than the visible mobile experience. The next cycle must turn those capabilities into a coherent commercial product, not add more hidden infrastructure.

## Primary outcomes
1. Make PERSON and ORGANIZATION experiences unmistakably different.
2. Make wardrobe + avatar + Looks the core PERSON flow.
3. Make catalog + campaign + insights the core ORGANIZATION flow.
4. Preserve clean switching for a person who also has commercial memberships.
5. Improve navigation, loading, feedback, image performance and presentation quality.
6. Provide a persistent external stakeholder preview independent of a developer workstation session.
7. Keep Expo Go as an easy testing path while introducing a stable preview strategy.

## UX information architecture

### PERSON
- Início
- Armário
- Descobrir
- Análise
- Perfil

Home:
avatar status -> wardrobe -> Looks -> IMPAR analysis -> discovery.

### ORGANIZATION
- Painel
- Catálogo
- Campanhas
- Insights
- Conta

Home:
store health -> catalog -> campaigns -> customer intent -> commercial actions.

## Design-system direction
- premium editorial, clean and restrained;
- dark ink + warm neutral surfaces + IMPAR wine accent + gold detail;
- serif only for display/headlines;
- consistent radii, spacing, type scale, badges, cards and buttons;
- context badge visible in the shell;
- no generic admin-dashboard visual language in the client journey.

## Tool shortlist

### Adopt now
- react-native-gesture-handler: native gesture quality for 3D and interactive surfaces.
- react-native-reanimated: performant transitions/microinteractions.
- expo-haptics: lightweight tactile confirmation for key actions.
- expo-image: caching, decoding and rendering improvements for wardrobe/catalog imagery.
- existing React Navigation: keep for this cycle to avoid an unnecessary routing rewrite.

### Evaluate after role/navigation stabilization
- Expo Router: strong future fit for typed/file-based routes and deep linking, but migration is not required to solve current UX problems.
- bottom-sheet pattern for filters/quick actions after gesture stack is proven.
- EAS Update + preview build as the permanent stakeholder path.

## Preview strategy

### Short term
Keep Expo Go available for the client because it is already familiar.

### Stable stakeholder environment
Use Expo EAS as the canonical preview delivery path:
- project: @poshaze1/imparoutfit
- isolated preview channel/branch;
- publish JS/assets after release gates;
- keep the Dell only as a development terminal, not the source of truth for stakeholder access.

A custom development/preview build becomes the stable option when native runtime changes require it. Published updates then no longer depend on a running Metro server.

## Release slice 1
- explicit context badge and switch;
- persistent PERSON/LOJISTA distinction;
- merchant-specific tab navigation;
- redesigned login/presentation selector;
- image-performance and interaction tooling;
- 3D loader regression fix retained;
- preview release documentation.

## Release slice 2
- unify old screens under the design system;
- replace demo-only copy with product language;
- skeleton/loading/error states;
- accessibility pass;
- visual QA on iPhone + Android;
- merchant catalog/analytics workflow cleanup.

## Release slice 3
- connected backend presentation;
- persistent staging backend/storage;
- EAS Update/preview automation;
- stakeholder release notes and presentation mode.
