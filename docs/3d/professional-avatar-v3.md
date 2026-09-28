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
