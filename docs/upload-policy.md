# Política mínima de mídia — CICLO 1

Todos os uploads exigem conta ativa e autorização anterior ao processamento.
JPEG (.jpg/.jpeg), PNG e WebP são os únicos formatos permitidos: extensão, MIME declarado,
formato detectado e decodificação completa devem concordar. SVG, documentos, animações,
arquivos truncados e imagens acima de 20 milhões de pixels são recusados. Reencode em WebP
remove metadados EXIF/GPS e payloads adicionais. Não representa varredura antimalware universal.

Limites: 5 MiB por arquivo, quatro arquivos, 16 campos de 8 KiB, 20 partes,
dois uploads simultâneos por processo. O proxy deve limitar corpo a 21 MiB e impor timeout.
Limites de conta/armazenamento e rate limit distribuído permanecem evolução operacional.

Storage privado atrás da interface `put/get/delete/getSignedReadUrl`. Nome UUID gerado no
servidor, sem caminho/nome do cliente; chave validada antes de qualquer acesso ao disco.
Diretório `private/media` ignorado por Git/Docker, nunca montado por express.static/Nginx.
Permissões Unix 0700/0600; no Windows usar ACL do perfil de execução. O adapter local é de
desenvolvimento; produção exige storage durável configurado explicitamente.

Metadados registram pessoa, organização quando comercial, finalidade, MIME, bytes, hash,
estado, datas e chave interna. Respostas não expõem a chave. Mídia pessoal exige ownership
na leitura, Cache-Control private/no-store e autorização novamente a cada acesso.
Catálogo só entrega mídia comercial publicada ligada ao produto. Mídia privada não vira
pública por conhecer seu UUID. Falhas transacionais compensam arquivos já escritos.

O endpoint de acesso resolve autorização antes de obter URL assinada de curta duração de
um futuro adapter. Localmente retorna rota autenticada (sem JWT na URL). Não há contratação
ou integração externa. URLs pessoais antigas ficam em quarentena, não são retornadas como
foto de perfil nem copiadas para novas entidades; revogação em provedor remoto ainda exige
inventário operacional. Sem migração automática de URLs arbitrárias (risco de SSRF).
