# Local-first e sync

O cliente pode consultar metadata já sincronizado de armário, Looks e jobs conhecidos. Captura, upload, processamento e novos assets requerem API/worker. Contrato futuro: operação local com ID imutável → fila → sync → reconciliação por versão → conflito explícito. Não há fila distribuída implementada neste ciclo.
