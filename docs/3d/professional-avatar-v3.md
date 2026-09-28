# IMPAR Outfit — Professional Avatar & Garment 3D V3

## Objetivo de produto
Transformar o avatar e as roupas 3D em uma capacidade comercial real do IMPAR Outfit, mantendo duas rotas complementares:
- avatar paramétrico local, sem lock-in e ajustável por medidas;
- avatar realista opcional, gerado a partir de fotos por provedor especializado.

A experiência não deve alegar escaneamento biométrico, fitting físico preciso ou simulação de tecido enquanto essas capacidades não estiverem objetivamente validadas.

## PO / Project Lead
Resultado esperado:
1. a cliente consegue criar uma representação corporal ajustável;
2. consegue editar rosto, corpo, altura, cabelo e aparência;
3. a mesma identidade alimenta a composição de roupas;
4. o app diferencia proxy, peça reconstruída e GLB aprovado;
5. o lojista nunca recebe acesso implícito ao avatar privado da cliente.

Critério comercial: a funcionalidade precisa ser demonstrável no celular e evolutiva sem depender de um único fornecedor.
## Tech Lead / Arquitetura
Decisão: arquitetura híbrida de providers.

Default:
- MakeHuman/MPFB CC0 como engine paramétrica local.
- GLB skinned com centenas de morph targets revisados.
- cabelo modular em GLB separado.
- avatar_config versionado no perfil.

Opcional:
- Avaturn como provider realista por fotos.
- integração encapsulada em avatarProvider.mjs.
- perfil guarda apenas metadados e URL HTTPS do avatar exportado.
- sessão/token do fornecedor não é persistido no cliente.

Roupas:
- reconstrução multivista continua sendo a fonte de geometria.
- quality gate continua obrigatório.
- Garment Fit V3 é uma camada visual reversível sobre o GLB validado.
- escala dimensional usada no quality gate não é substituída pela escala visual de composição.

## UX / Product Design
Avatar Studio separado em CORPO, ROSTO e CABELO.
Controles visuais atualizam o modelo em tempo real.
O modo realista exige consentimento explícito antes de abrir o provedor externo.

O produto deve sempre comunicar:
- avatar paramétrico = representação ajustável;
- avatar realista = aparência derivada de fotos pelo provider;
- fitting = prévia proporcional;
- roupa reconstruída = geometria privada que passou pelo quality gate.

## Mobile
Runtime alvo: Expo SDK 57 / React Native.
Assets locais carregados como ArrayBuffer e parseados pelo GLTFLoader.
Renderer usa @react-three/fiber/native + three-stdlib.
Controles principais:
- rotação por gesto;
- sliders nativos;
- haptics;
- material/pele/olhos/cabelo atualizados em runtime.

## Backend / Data
customer_profiles.avatar_config é o envelope versionado.
Persistir:
- provider/engine/version;
- avatarControls;
- timestamps;
- realisticAvatar somente como metadados seguros e URL HTTPS.
Não persistir fotos cruas, token do fornecedor ou sessão temporária dentro do avatar_config.

## 3D / Reconstruction
MakeHuman runtime:
- corpo skinned;
- face/body morph targets;
- altura e medidas;
- cabelos modulares.
Garment Fit V3:
- categoria da peça;
- busto/cintura/quadril/altura;
- classe de tecido RIGID, STRUCTURED, KNIT ou FLUID;
- ease e silhouette allowance;
- PBR normalization.

Ainda não implementado como promessa de produção:
- cloth simulation física;
- colisão precisa corpo/roupa;
- inferência automática de medidas por foto;
- fitting de tamanho comercial garantido.

## Segurança / Privacidade
- assets humanos só entram em produção com proveniência e licença registradas;
- Michelle permanece bloqueada para produção;
- MakeHuman e cabelos Quaternius aprovados como CC0;
- avatar realista persistente deve usar HTTPS;
- captura por provider externo exige consentimento;
- conteúdo privado de pessoa continua isolado do contexto lojista.

## QA / Release
Gates:
1. testes de contrato de morph targets;
2. verificação GLB e skin;
3. teste de cabelos self-contained;
4. teste de Garment Fit por categoria e tecido;
5. expo-doctor;
6. bundle Android;
7. smoke em dispositivo iOS/Android;
8. preview separado de production;
9. rollback por commit.

## Decisão de fornecedor
MakeHuman é o default por controle, licença CC0 e ausência de lock-in.
Avaturn fica como rota premium/realista; API/SDK comercial depende de credenciais e plano do fornecedor.
A camada provider existe justamente para permitir troca futura sem reescrever domínio, perfil ou composição.

## V4 implementation slice — 2026-09-28

### PO / Project Lead
The 3D promise is split into three explicit product levels:
1. Avatar Paramétrico Profissional — controllable identity using MakeHuman/MPFB CC0, real morph targets and modular hair.
2. Avatar Realista por Fotos — optional premium route through a provider adapter; current adapter target is Avaturn.
3. Peça 3D — an immediate tailored proxy for UX continuity, replaced by the authenticated private reconstructed GLB only after the reconstruction quality gate.

This avoids presenting a generic proxy as if it were the customer's real body or garment.

### Tech Lead / Architecture
The avatar renderer remains provider-agnostic. avatarSpec is the stable domain contract; renderer/provider implementations can change without rewriting wardrobe/Looks/reconstruction domains.

A backend Avaturn adapter now:
- keeps the provider token server-side;
- creates pseudonymous external identities;
- issues short-lived provider sessions;
- requires HTTPS;
- rate-limits session creation;
- does not persist raw face/body photos in the identity mapping.

The provider identity table stores only person_id, provider and external user id.

### UX / Product Design
Avatar Studio now changes camera framing by editing task:
- CORPO: full body;
- ROSTO: facial close-up;
- CABELO: head/hair close-up.

Additional controls expose arm length, calves, glutes, chin projection, nose bridge, eye height and eye color. The premium photo-realistic route is visible from the same studio instead of being hidden in an unrelated settings screen.

### Mobile
The local MakeHuman runtime contains 306 morph targets on the body mesh plus compatible eye/teeth/tongue morphs.

The garment instant preview no longer uses React Three primitive shapes directly. TI Broker now ships original Blender-generated GLB templates for:
- top;
- pants;
- skirt;
- dress;
- bag;
- shoe.

Each template:
- is self-contained GLB;
- receives avatar measurement scaling;
- receives fabric-class material tuning;
- is explicitly labelled as a tailored proxy.

Connected mode now checks for a READY reconstruction job for a wardrobe item. If one exists, the wardrobe detail loads the authenticated private GLB output instead of labeling the proxy as reconstructed.

### Backend / Data
A provider session route exists at POST /api/avatar/realistic/session.

Persistent provider credentials remain server-only.

Reconstructed garment output remains GET /api/reconstruction/jobs/:jobId/output.

The latter is authorization-protected, integrity-checked and served as model/gltf-binary.

### 3D / Reconstruction
Garment proxy materials react to declared fabric class:
- RIGID;
- STRUCTURED;
- KNIT;
- FLUID.

The private reconstruction pipeline remains authoritative for actual garment geometry. The proxy is never reconstruction-equivalent.

### Security / Privacy
- provider session URL must be HTTPS;
- provider token is not exposed in Expo configuration;
- raw photos are not persisted in avatar_provider_identities;
- reconstructed GLBs remain authenticated/private;
- unknown-provenance human mesh remains blocked from production;
- generated garment proxy templates are TI Broker-owned procedural assets and are not presented as captured garments.

### QA / Release
New gates added:
- Avaturn adapter tests;
- all garment proxy GLBs must be valid self-contained GLB 2.0;
- advanced avatar controls must map to existing morph names;
- wardrobe detail must distinguish proxy from private READY output;
- Android bundle must include parametric human, hair and garment GLBs.

### Provider research boundary
Current provider decision remains:
- MakeHuman/MPFB: default controlled local base because core graphical assets are CC0 and the target system supports extensive face/body deformation.
- Avaturn: optional realistic/photo route because it exposes embeddable SDK/API sessions and avatar GLB export, but it is a paid external dependency.
- SMPL-X: not used as default because the public research model license is non-commercial without a separate commercial license.
- MetaHuman: not used as default because the content/runtime path is Unreal-centered and mismatched with the Expo/React Native product.

No provider result is described as biometric identity, medically accurate body measurement, guaranteed size recommendation or physical cloth simulation.
