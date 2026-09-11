# Contrato de erros HTTP

Toda resposta de erro da API usa o envelope `error` com `code`, `message`, `requestId` e `details`.
`code` é o contrato estável para clientes; `message` é seguro para apresentação e não deve ser usado para lógica.

| HTTP | Código padrão |
| --- | --- |
| 400 | `VALIDATION_ERROR` |
| 401 | `AUTHENTICATION_REQUIRED` |
| 403 | `FORBIDDEN` |
| 404 | `RESOURCE_NOT_FOUND` |
| 409 | `STATE_CONFLICT` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

Os códigos especializados de conflito são `DUPLICATE_RESOURCE`, `POSITION_CONFLICT`, `INCOMPLETE_DATA` e `VERSION_CONFLICT`.
Erros de recurso privado e recursos inexistentes convergem para `404 RESOURCE_NOT_FOUND`.
`details` contém somente dados estruturados seguros de validação, como campos e códigos de correção. Nunca contém SQL, stacks, prompts, knowledge, segredos ou dados privados brutos.
