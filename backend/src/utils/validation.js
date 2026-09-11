import Joi from 'joi';
import { HttpError } from './http.js';
export const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });
export function validate(schema, body) {
  const { value, error } = schema.validate(body,{abortEarly:false});
  if (error) {
    const fieldCode=detail=>{
      if(detail.type==='any.required') return 'REQUIRED';
      if(detail.type==='object.unknown') return 'FIELD_NOT_ALLOWED';
      if(detail.type.endsWith('.max')) return 'TOO_LONG';
      if(detail.type.endsWith('.min')) return 'TOO_SHORT';
      if(detail.type.includes('pattern')||detail.type.includes('guid')) return 'INVALID_FORMAT';
      if(detail.type.includes('base')||detail.type.includes('object')) return 'INVALID_TYPE';
      return 'INVALID_VALUE';
    };
    throw new HttpError(400, 'Request validation failed.',{code:'VALIDATION_ERROR',details:{fields:error.details.map(detail=>({
      field:detail.path.join('.'),code:fieldCode(detail)
    }))}});
  }
  return value;
}
export const itemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(160).required(), category: Joi.string().trim().min(1).max(80).required(),
  color: Joi.string().max(80).allow('', null), sizes: Joi.string().max(120).allow(''),
  price: Joi.number().min(0).max(99999999).allow(null), purchaseLink: Joi.string().uri({ scheme: ['https'] }).allow('', null),
});
