# IMPAR Outfit — roteiro de apresentação ao cliente

## Antes da reunião
Use o preview Expo Go autenticado na conta `poshaze1`.

Endereço atual:
`exp://8t_ysow-poshaze1-8480.exp.direct`

O Dell possui a tarefa automática `IMPAR Outfit Expo Preview`, que mantém o servidor de desenvolvimento ativo e tenta reiniciá-lo em caso de queda. Para uma apresentação importante, confirme o endpoint antes da reunião.

A apresentação usa dados fictícios. Não cadastre dados pessoais reais neste ambiente demonstrativo.

## Abertura
Ao abrir o app, a primeira tela deve pedir a escolha da jornada. Isso é intencional e demonstra a separação de contexto do produto.

### Jornada 1 — CLIENTE FINAL
Escolha **Explorar meu estilo**.

Demonstre nesta ordem:
1. Início: destaque que o produto parte do avatar + guarda-roupa, não de um feed genérico.
2. Avatar: abra **Criar meu avatar** / **Atualizar meu avatar** e mostre medidas, foto e representação 3D experimental.
3. Armário: mostre peças possuídas, capacidade e catalogação.
4. Looks: crie ou abra uma coleção pessoal.
5. Descobrir: mostre marcas e referências comerciais sem transformar uma referência em peça possuída.
6. Análise: mostre o espaço reservado à Análise IMPAR e explique que conteúdo/IA institucional real depende do modo conectado e da governança autorizada.
7. Perfil: mostre que a pessoa mantém identidade e contexto próprios.

Mensagem principal: o cliente final controla avatar, acervo e Looks; marcas aparecem como descoberta e referência, não como dona dos dados privados da pessoa.

### Jornada 2 — LOJISTA
Use **Trocar jornada** e escolha **Gerenciar minha vitrine**.

A navegação comercial agora é própria:
- Painel
- Catálogo
- Campanhas
- Conta

Demonstre:
1. Painel: saúde da vitrine, métricas e ações rápidas.
2. Catálogo: produtos publicados, prévias e nova publicação.
3. Campanhas: configuração e visualização de mídia patrocinada.
4. Conta: mostre o selo **LOJISTA**, capabilities e a troca explícita para o contexto pessoal.

Mensagem principal: a mesma pessoa pode operar uma marca sem transformar a identidade pessoal em um papel global de lojista. Dados pessoais e comerciais continuam separados.

## 3D — como apresentar
O avatar genérico atual é uma POC de representação proporcional e não um avatar corporal reconstruído da usuária.

O produto já possui fundação para:
- captura multivista de peças;
- jobs de reconstrução;
- GLB privado;
- quality gate;
- composição com avatar de referência.

Não apresentar como fitting físico preciso, simulação de tecido ou reconstrução corporal pronta.

## O que mudou nesta entrega
- Expo SDK 57;
- carregamento nativo do GLB corrigido;
- Home cliente final orientada ao guarda-roupa;
- navegação CLIENTE FINAL própria;
- navegação LOJISTA própria;
- escolha explícita da jornada na abertura;
- catálogo comercial dedicado;
- contexto/capabilities do lojista;
- expo-image para cache/transição de imagens em superfícies novas;
- feedback háptico em ações principais;
- preview Expo Go auto-reiniciável no Dell;
- EAS Update configurado e primeira atualização `preview` publicada.

## Limites que ainda devem ser explicados
O Expo Go atual ainda depende do Dell estar ligado, conectado e com a sessão do usuário disponível. É o caminho rápido já conhecido pelo cliente.

O caminho realmente independente da máquina é o build de preview do próprio IMPAR Outfit ligado ao canal EAS `preview`. O update hospedado já existe; falta gerar/instalar o primeiro build iOS compatível para que futuras apresentações recebam atualizações sem depender do Metro do Dell.
