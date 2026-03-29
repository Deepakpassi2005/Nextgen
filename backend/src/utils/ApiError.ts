export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any) => {
  if (err.name === 'ValidationError') {
    return new ApiError(err.message, 400);
  }
  if (err.name === 'CastError') {
    return new ApiError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  if (err.code === 11000) {
    return new ApiError('Duplicate field value entered', 400);
  }
  return err;
};
