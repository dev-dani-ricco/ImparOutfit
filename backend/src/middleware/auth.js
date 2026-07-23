import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http.js';
export function requireAuth(req,_res,next){
  const token = req.headers.authorization?.replace('Bearer ', '');
  if(!token) return next(new HttpError(401,'Token ausente'));
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); } catch { next(new HttpError(401,'Token inválido')); }
}
export const requireRole = (...roles) => (req,_res,next) => roles.includes(req.user?.profileType) ? next() : next(new HttpError(403,'Perfil sem permissão'));
