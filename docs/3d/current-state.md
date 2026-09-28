# Estado 3D atual — Avatar Híbrido & Garment Fit V2

| Capacidade | Estado atual | Limite / próximo passo |
| --- | --- | --- |
| Avatar paramétrico | MakeHuman/MPFB2 CC0 parametric-base.glb, skinned, com centenas de morph targets corporais e faciais | Representação paramétrica, não scan biométrico |
| Avatar realista | Provider Avaturn integrado por WebView, export GLB e fallback paramétrico | Protótipo com provider público; produção exige projeto/plano comercial próprio, consentimento, retenção e revogação |
| Avatar Studio | Controles de corpo, rosto, altura, medidas, pele, cabelo e cor | Validar ergonomia e performance em iPhone/Android reais |
| Cabelo | Quatro meshes 3D modulares CC0 da Quaternius | Ampliar biblioteca e adicionar estilos de maior fidelidade com mesma governança de licença |
| Identidade facial | Morphs de formato, mandíbula, queixo, maçãs, testa, nariz, olhos, boca e lábios | Foto ainda é referência; reconstrução facial por foto não está habilitada |
| Persistência demo | avatarControls + medidas persistidos no profile local | Connected mode deve persistir spec versionado no backend |
| Captura de roupa | Fotos multivista autenticadas no pipeline conectado | Adicionar validação visual de cobertura/foco em tempo real |
| Reconstrução de roupa | Job privado -> worker -> GLB -> quality gate | Pipeline local/CPU ainda é POC e precisa benchmark com captura real |
| Composição | Avatar paramétrico + asset de roupa validado | Sem simulação de tecido ou colisão |
| Garment Fit V2 | MEASUREMENT_EASE_V2 por categoria, busto/cintura/quadril/altura/ombros, anchors, folga visual e normalização PBR | Ainda não há cloth physics; próxima fronteira é body-aware deformation com landmarks/rig/cage, oclusão e collision shell |
| Legacy Michelle | assets/models/michelle.glb preservado apenas para compatibilidade/rollback | Não é mais o avatar principal da experiência móvel |
| Web fallback | BodyAvatar3D.js preserva uma visualização simplificada | O editor 3D profissional é prioritariamente iOS/Android |

Stack atual: Expo SDK 57, React Native, Three.js, React Three Fiber, three-stdlib, expo-file-system e @react-native-community/slider.

Critério de produto: o sistema pode afirmar representação paramétrica e prévia proporcional. Não pode afirmar scan biométrico, fitting físico exato, colisão corporal ou simulação de tecido enquanto esses estágios não existirem.
