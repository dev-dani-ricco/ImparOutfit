# Showcase Build — roteiro após CICLO 1

Uso interno; dados fictícios. Não cadastrar dados pessoais reais na demonstração.
A Showcase roda com demoMode=true e não sincroniza dados com a API.

1. Abra “Experiência da cliente”. A pessoa fictícia demo-person recebe perfil, medidas,
   armário e coleções de exemplo.
2. Navegue por Perfil, Armário, Lojas e Feed. Abra uma loja e use “Salvar referência”:
   o item fica em referências comerciais e a quantidade no armário não aumenta.
3. Em Feed → Favoritas, abra uma referência salva. Em nova coleção, combine peças
   possuídas e referências; a relação original de cada item permanece.
4. Para catalogar peça pessoal, declare que possui a peça (ou que é uma fixture da demo).
   Foto/captura não representa malha reconstruída ou propriedade verificada externamente.
5. Saia e entre em “Experiência da marca”. demo-store-owner possui contexto comercial.
   “Abrir meu contexto pessoal” permite usar perfil e armário próprios sem perder membership.
   Os dados da cliente anterior não são carregados. No perfil, retorne à loja.
6. Cadastro demonstrativo cria identidade fictícia nova com estado pessoal vazio.
   A chave global antiga não é importada nem apagada automaticamente.
7. Conteúdo associado à Dani, campanhas e métricas são demonstração sob classificação de IP.
   Não constituem atendimento, agenda, parecer profissional, publicidade veiculada ou analytics real.

As ações de marca são exemplos locais por identidade. Dados pessoais não atravessam sessões.
Fotos locais podem depender da retenção do sistema operacional. AsyncStorage não é cofre
criptografado; não usar a demo como armazenamento de dados reais.

Com demoMode=false, a interface mostra dados pessoais e comerciais lidos da API autenticada.
Os demais fluxos estão em integração. Bundles Android/web preservam navegação e assets, mas
não comprovam distribuição assinada ou funcionamento do avatar em aparelho físico.
