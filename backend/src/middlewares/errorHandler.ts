import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  console.error('[errorHandler]', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(status).json({ success: false, message });
};
