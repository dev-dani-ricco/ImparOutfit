# Modelo de dados — CICLO 1

Nomes conceituais abaixo mapeiam para tabelas snake_case/plural. `Grant` é a tabela `grants`;
bundles são dados em `capability_bundles`/`bundle_capabilities`, não condições em controllers.

```mermaid
erDiagram
  Person ||--o{ Identifier : identifies
  Person ||--o| Account : authenticates
  Account ||--|| LegacyUser : bridges
  Person ||--o{ Membership : participates
  Organization ||--o{ Membership : contains
  Membership ||--o{ Grant : receives
  Capability ||--o{ Grant : permits
  CapabilityBundle ||--o{ BundleCapability : resolves
  Capability ||--o{ BundleCapability : included
  Organization ||--|| Store : commercial_domain
  Person ||--o{ StoreRequest : requests
  Organization o|--o{ StoreRequest : approves
  Store ||--o{ Product : catalogs
  Person ||--o{ OwnershipEvent : attests
  OwnershipEvent ||--o| WardrobeItem : establishes
  Person ||--o{ WardrobeItem : owns
  Person ||--o{ CommercialSavedItem : saves
  Product ||--o{ CommercialSavedItem : references
  Person ||--o{ Look : composes
  Look ||--o{ LookVersion : versions
  LookVersion ||--|{ LookItem : contains
  WardrobeItem o|--o{ LookItem : owned_reference
  Product o|--o{ LookItem : commercial_preview
  Person ||--o{ MediaAsset : supplies
  Organization o|--o{ MediaAsset : commercial_scope
  MediaAsset ||--o| ProductMedia : catalog_media
  Product ||--o{ ProductMedia : images
  MediaAsset ||--o| WardrobeMedia : private_media
  WardrobeItem ||--o{ WardrobeMedia : images
  Account ||--|| CustomerProfile : legacy_profile_adapter
  MediaAsset o|--o| CustomerProfile : private_photo
  Store ||--o{ Showcase : publishes
  Showcase ||--o{ ShowcaseProduct : contains
  Product ||--o{ ShowcaseProduct : same_store
  Person ||--o{ LegacyItemReview : reviews
  Person ||--o{ ReconstructionJob : owns
  WardrobeItem o|--o{ ReconstructionJob : reconstructs
  Product o|--o{ ReconstructionJob : reconstructs_preview
  ReconstructionJob ||--|{ ReconstructionInput : receives
  MediaAsset ||--o{ ReconstructionInput : captured_as
  ReconstructionJob ||--o{ ReconstructionOutput : produces

  Person { uuid id PK string display_name timestamp created_at timestamp updated_at }
  Identifier { uuid id PK uuid person_id FK string kind string value UK timestamp verified_at }
  Account { uuid id PK uuid person_id FK string status int token_version }
  Organization { uuid id PK string name uuid created_by_person_id FK }
  Membership { uuid id PK uuid person_id FK uuid organization_id FK string status }
  Capability { string code PK string description }
  Grant { uuid id PK uuid membership_id FK string capability_code FK uuid resource_id timestamp expires_at timestamp revoked_at uuid granted_by_person_id FK }
  Store { uuid id PK uuid organization_id FK uuid owner_user_id FK string store_name }
  StoreRequest { uuid id PK uuid person_id FK uuid organization_id FK string status }
  Product { uuid id PK uuid store_id FK uuid created_by_person_id FK string name string status uuid legacy_item_id FK }
  OwnershipEvent { uuid id PK uuid person_id FK string source uuid evidence_media_id FK timestamp attested_at }
  WardrobeItem { uuid id PK uuid person_id FK uuid ownership_event_id FK string kind }
  CommercialSavedItem { uuid id PK uuid person_id FK uuid product_id FK string kind }
  Look { uuid id PK uuid person_id FK string title boolean is_public }
  LookVersion { uuid id PK uuid look_id FK uuid person_id FK int version }
  LookItem { uuid id PK uuid look_version_id FK uuid person_id FK string kind uuid wardrobe_item_id FK uuid product_id FK int position }
  MediaAsset { uuid id PK uuid person_id FK uuid organization_id FK string purpose string storage_key UK string mime int bytes string sha256 string status }
  ReconstructionJob { uuid id PK uuid person_id FK uuid wardrobe_item_id FK uuid product_id FK string state string pipeline_version string technique int input_revision jsonb metrics jsonb quality jsonb placement }
  ReconstructionInput { uuid job_id FK uuid person_id FK uuid media_id FK int azimuth string elevation }
  ReconstructionOutput { uuid id PK uuid job_id FK uuid person_id FK string storage_key UK string mime string sha256 string lifecycle jsonb metadata }
```

Invariantes: Person+Organization única por membership; Identifier(kind,value) único; e-mail
normalizado único; grants ativos sem duplicatas por escopo; evento de ownership único por peça;
FK composta impede atribuir evento/peça/Look a outra pessoa; LookItem exige exatamente uma
referência compatível com kind; ShowcaseProduct exige mesmo Store. Mídia privada só pode ser
vinculada à pessoa correspondente; mídia comercial à organização correspondente, com triggers.

Há um Account por Person neste bridge. Multiplicidade futura de credenciais/contas exige migrar
perfil/plano de `users` para Person antes de remover essa unicidade. Não se faz merge automático
de identidades por e-mail ou telefone. `verified_at` nasce vazio: cadastro não verifica identificador.
`owner_user_id`, `profile_type`, items/item_saves e arrays legados permanecem compatibilidade/
histórico; os endpoints novos não usam esses campos como autoridade nem prova de posse.
Looks legados ficam privados, preservados sem reinterpretar arrays antigos como ownership válido.

Reconstrução exige exatamente um item pessoal ou produto comercial e preserva a pessoa no job,
input e output. Trigger de banco impede mídia de outra pessoa, mídia fora do contexto comercial e
mídia não READY. A saída é GLB derivado privado; seu lifecycle e checksum são metadados de banco,
enquanto o binário permanece no storage privado. READY é estado posterior ao quality gate, não ao
upload nem à execução do worker.
