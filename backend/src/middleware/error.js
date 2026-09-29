import multer from 'multer';
import { defaultErrorCode, ERROR_CODES, HttpError } from '../utils/http.js';

const messages={
  VALIDATION_ERROR:'Request validation failed.',AUTHENTICATION_REQUIRED:'Authentication is required.',
  FORBIDDEN:'You are not authorized to perform this action.',RESOURCE_NOT_FOUND:'Resource not found.',
  STATE_CONFLICT:'The resource state does not allow this operation.',DUPLICATE_RESOURCE:'The resource already exists.',
  POSITION_CONFLICT:'The requested position is unavailable.',INCOMPLETE_DATA:'The operation requires additional data.',
  VERSION_CONFLICT:'The requested version conflicts with the current state.',PAYLOAD_TOO_LARGE:'The submitted payload exceeds the allowed size.',
  UNSUPPORTED_MEDIA_TYPE:'The submitted media type is not supported.',RATE_LIMITED:'Too many requests.',
  INTERNAL_ERROR:'An unexpected error occurred.',UPSTREAM_ERROR:'An upstream dependency failed.',
  SERVICE_UNAVAILABLE:'The service is temporarily unavailable.',UPSTREAM_TIMEOUT:'An upstream dependency timed out.'
};
const envelope=(req,status,code,details=null)=>({error:{code,message:messages[code]||messages.INTERNAL_ERROR,requestId:req.requestId,details}});
export function errorHandler(err, req, res, _next) {
  let status=500,code='INTERNAL_ERROR',details=null;
  if (err instanceof multer.MulterError) { status=413;code='PAYLOAD_TOO_LARGE'; }
  else if (['Unexpected end of form','Multipart: Boundary not found','Unexpected end of multipart data'].includes(err.message)) { status=400;code='VALIDATION_ERROR'; }
  else if (err instanceof HttpError) { status=err.status;code=ERROR_CODES.has(err.code)?err.code:defaultErrorCode(status);details=err.details||null; }
  else if (err.type === 'entity.too.large') { status=413;code='PAYLOAD_TOO_LARGE'; }
  else if (err.type === 'entity.parse.failed' || ['22P02','23502','23514'].includes(err.code)) { status=400;code='VALIDATION_ERROR'; }
  else if (err.code === '23505') { status=409;code='DUPLICATE_RESOURCE'; }
  else if (err.code === '23503') { status=404;code='RESOURCE_NOT_FOUND'; }
  if(status>=500){
    console.error(JSON.stringify({
      event:'api_error',requestId:req.requestId,code,
      errorName:err?.name||'Error',dbCode:typeof err?.code==='string'?err.code:null,
      constraint:typeof err?.constraint==='string'?err.constraint:null
    }));
  }
  res.status(status).json(envelope(req,status,code,details));
}
