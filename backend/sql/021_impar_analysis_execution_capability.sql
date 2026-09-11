INSERT INTO capabilities(code,description)
VALUES ('impar.analysis.execute','Executar operações oficiais de ÍMPAR Analysis em contexto institucional')
ON CONFLICT(code) DO NOTHING;
