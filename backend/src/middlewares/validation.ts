import { Request, Response, NextFunction } from 'express';

const ev: any = require('express-validator');
const { body, validationResult, param, query } = ev;

export const runValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', data: errors.array() });
  }
  next();
};

// example validators that can be extended per-route
export const authValidators = [
  body('email').isEmail().withMessage('email is required'),
  body('password').isLength({ min: 6 }).withMessage('password must be at least 6 chars'),
];
