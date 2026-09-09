import Joi from 'joi';
import { HttpError } from './http.js';
export const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });
export function validate(schema, body) {
  const { value, error } = schema.validate(body);
  if (error) throw new HttpError(400, 'Dados inválidos', { code: 'VALIDATION_ERROR' });
  return value;
}
export const itemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(160).required(), category: Joi.string().trim().min(1).max(80).required(),
  color: Joi.string().max(80).allow('', null), sizes: Joi.string().max(120).allow(''),
  price: Joi.number().min(0).max(99999999).allow(null), purchaseLink: Joi.string().uri({ scheme: ['https'] }).allow('', null),
});
