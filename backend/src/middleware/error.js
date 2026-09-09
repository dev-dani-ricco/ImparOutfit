import multer from 'multer';
import { HttpError } from '../utils/http.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) return res.status(413).json({ error: 'Limite ou formato multipart inválido', code: 'UPLOAD_LIMIT' });
  if (['Unexpected end of form','Multipart: Boundary not found','Unexpected end of multipart data'].includes(err.message)) return res.status(400).json({error:'Multipart inválido'});
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Corpo muito grande' });
  if (err.type === 'entity.parse.failed' || ['22P02', '23502', '23514'].includes(err.code)) return res.status(400).json({ error: 'Dados inválidos' });
  if (err.code === '23505') return res.status(409).json({ error: 'Registro já existe' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referência inválida' });
  res.status(500).json({ error: 'Erro interno', code: 'INTERNAL_ERROR' });
}
