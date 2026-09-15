import Joi from 'joi';
import { validate } from '../utils/validation.js';

export const CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION = 1;

const blockedPayloadKeys=new Set([
  'chainOfThought','systemPrompt','prompt','rawPrompt','ragContext','knowledgeChunks','secrets','credentials'
]);

const payloadV1=Joi.object().unknown(true).custom((payload,helpers)=>{
  if(Object.keys(payload).some(key=>blockedPayloadKeys.has(key))) return helpers.error('any.invalid');
  return payload;
});

export function validateAnalysisResultPayload(schemaVersion,payload) {
  if(schemaVersion!==CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION) throw new Error('Unsupported analysis result schema version');
  return validate(payloadV1,payload);
}
