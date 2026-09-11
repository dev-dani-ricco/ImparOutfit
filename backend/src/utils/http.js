export const ERROR_CODES=new Set([
  'VALIDATION_ERROR','AUTHENTICATION_REQUIRED','FORBIDDEN','RESOURCE_NOT_FOUND','STATE_CONFLICT',
  'DUPLICATE_RESOURCE','POSITION_CONFLICT','INCOMPLETE_DATA','VERSION_CONFLICT','PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE','RATE_LIMITED','INTERNAL_ERROR','UPSTREAM_ERROR','SERVICE_UNAVAILABLE','UPSTREAM_TIMEOUT'
]);
export const defaultErrorCode=status=>({
  400:'VALIDATION_ERROR',401:'AUTHENTICATION_REQUIRED',403:'FORBIDDEN',404:'RESOURCE_NOT_FOUND',
  409:'STATE_CONFLICT',413:'PAYLOAD_TOO_LARGE',415:'UNSUPPORTED_MEDIA_TYPE',429:'RATE_LIMITED',
  500:'INTERNAL_ERROR',502:'UPSTREAM_ERROR',503:'SERVICE_UNAVAILABLE',504:'UPSTREAM_TIMEOUT'
}[status]||'INTERNAL_ERROR');
export class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = ERROR_CODES.has(code) ? code : defaultErrorCode(status);
    this.details = details;
  }
}
export const asyncHandler = (fn) => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
