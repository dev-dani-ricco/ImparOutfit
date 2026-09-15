import { HttpError } from '../utils/http.js';

export async function resolveMethodologyContent() {
  throw new HttpError(503,'Conteúdo metodológico privado não configurado');
}
