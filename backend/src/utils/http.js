export class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export const asyncHandler = (fn) => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
