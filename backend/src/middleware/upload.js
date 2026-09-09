import multer from 'multer';
import sharp from 'sharp';
import { extname } from 'node:path';
import { HttpError } from '../utils/http.js';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 4;
const formats = { '.jpg': ['jpeg', 'image/jpeg'], '.jpeg': ['jpeg', 'image/jpeg'], '.png': ['png', 'image/png'], '.webp': ['webp', 'image/webp'] };
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES, fields: 16, parts: 20, fieldSize: 8192, fieldNameSize: 64 },
  fileFilter(_req, file, cb) {
    const format = formats[extname(file.originalname).toLowerCase()];
    cb(!format || format[1] !== file.mimetype
      ? new HttpError(415, 'Use JPEG, PNG ou WebP com extensão e MIME correspondentes') : null, !!format);
  },
});

// Bound buffers and decoder work per process, including requests without Content-Length.
let active = 0;
export function uploadBudget(req, res, next) {
  if (active >= 2) return next(new HttpError(429, 'Uploads ocupados; tente novamente'));
  if (Number(req.headers['content-length']) > MAX_FILE_BYTES * MAX_FILES + 131072) {
    return next(new HttpError(413, 'Upload excede o limite total'));
  }
  active += 1;
  let released = false;
  const release = () => { if (!released) { released = true; active -= 1; } };
  res.once('finish', release);
  res.once('close', release);
  next();
}

let decoders = 0;
export async function normalizeImage(file) {
  const format = formats[extname(file.originalname).toLowerCase()];
  if (!format || format[1] !== file.mimetype) throw new HttpError(415, 'Tipo de imagem não permitido');
  if (!file.buffer?.length || file.buffer.length > MAX_FILE_BYTES) throw new HttpError(413, 'Tamanho de imagem inválido');
  if (decoders >= 2) throw new HttpError(429, 'Processamento ocupado; tente novamente');
  decoders += 1;
  try {
    const decoder = sharp(file.buffer, { limitInputPixels: 20_000_000, failOn: 'warning', animated: false });
    const meta = await decoder.metadata();
    if (meta.format !== format[0] || (meta.pages || 1) > 1) throw new Error('format');
    // Full decoding rejects spoofed/truncated input. Re-encoding strips EXIF/GPS and trailing payloads.
    const buffer = await decoder.rotate().resize({ width: 4096, height: 4096, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (buffer.length > MAX_FILE_BYTES) throw new Error('size');
    return { buffer, mime: 'image/webp', extension: 'webp' };
  } catch {
    throw new HttpError(415, 'Imagem inválida, animada ou acima do limite de pixels');
  } finally { decoders -= 1; }
}

export async function validateImages(req, _res, next) {
  try {
    for (const file of req.files || (req.file ? [req.file] : [])) file.normalized = await normalizeImage(file);
    next();
  } catch (error) { next(error); }
}
