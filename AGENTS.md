# IMPAR Outfit — Operating Contract

## Product intent
IMPAR Outfit is a commercial product of the TI Broker ecosystem. It must serve two clearly distinct user contexts without collapsing them into one generic app:

1. PERSON / CLIENTE FINAL
   - create and maintain a personal avatar;
   - own a private wardrobe;
   - create Looks;
   - save commercial references without converting them into owned items;
   - discover brands and sponsored references;
   - request/consume IMPAR analyses when authorized;
   - capture garments for the 3D pipeline.

2. ORGANIZATION / LOJISTA
   - manage store context, catalog and preview;
   - publish products;
   - manage campaigns/ads;
   - inspect engagement/analytics;
   - manage members/capabilities;
   - switch to the same person's private context without crossing private data.

Identity is Person-first. Commercial authority is contextual and capability-based. Never model STORE as a global role that replaces the person's identity.

## Decision chain
Problem -> diagnosis -> architecture -> technology decision -> implementation/integration -> validation -> release -> evolution.

Do not start with a tool. Preserve working capabilities unless an explicit deprecation decision exists.

## Operating roles

### PRODUCT / PROJECT LEAD
Owns business problem, user journeys, scope, prioritization, acceptance criteria and commercial coherence.
Must explicitly separate PERSON and ORGANIZATION journeys.

### TECH LEAD / ARCHITECT
Owns architecture, boundaries, data/auth, integrations, performance, maintainability, migration/rollback and technical sequencing.

### UX / PRODUCT DESIGN
Owns information architecture, navigation, interaction hierarchy, design system, accessibility, empty/error/loading states and presentation quality.
Must validate both PERSON and ORGANIZATION journeys independently.

### MOBILE FRONTEND
Owns Expo/React Native implementation, state transitions, native ergonomics, performance and device compatibility.

### BACKEND / DATA
Owns API contracts, PostgreSQL, media/storage, jobs, audit, rate limits and data isolation.

### 3D / RECONSTRUCTION
Owns capture protocol, reconstruction jobs, GLB lifecycle, quality gates, composition and explicit fidelity limitations.

### SECURITY / PRIVACY
Owns least privilege, auth, authorization, private media, secrets, logging hygiene, retention, auditability and tenant/person isolation.

### QA / RELEASE
Owns reproducible validation, regression gates, device smoke tests, evidence, release notes and rollback readiness.

## Delivery gates
Every meaningful release must pass:
1. Product acceptance criteria defined.
2. Tech impact reviewed.
3. Security/privacy impact reviewed.
4. Automated tests pass.
5. Bundle/build passes.
6. PERSON journey smoke-tested.
7. ORGANIZATION journey smoke-tested.
8. Native 3D path checked when touched.
9. Preview environment updated.
10. Rollback point recorded.

## Architecture rules
- Person private data and Organization commercial data must remain isolated.
- CommercialProduct is never an OwnedWardrobeItem by implication.
- Demo data never masquerades as production data.
- AI/IMPAR analysis must use governed server-side knowledge and explicit authorization.
- 3D output must carry provenance, state and quality-gate status.
- No raw personal media in public buckets.
- No hardcoded production credentials or secrets.
- No silent migration that destroys user state.

## UX rules
- The current context must always be visible: CLIENTE or LOJISTA.
- Switching context must be intentional and reversible.
- The home screen must answer: where am I, what can I do next, what changed.
- Bottom navigation is task-based, not implementation-based.
- Empty, loading, error and offline states are first-class product states.
- Commercial previews must look presentation-ready on real phones.
- Accessibility and tap targets are release criteria, not polish.

## Tooling policy
Prefer Expo-Go-compatible dependencies for the stakeholder-preview branch unless a capability materially requires a development build.
Add dependencies only when they solve a measured UX, performance or maintainability problem.
Avoid framework rewrites during feature delivery unless there is a documented migration case.

## Branch and release policy
- Work on focused branches.
- Checkpoint WIP before risky migrations.
- No direct promotion of experimental 3D or auth changes to production.
- Preview and production channels must remain separate.
- Changes to native dependencies require a new compatible runtime/build.
