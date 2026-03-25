import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    name?: string;          // added so controllers can reference user.name safely
    classId?: string;
  };
  body: any;
  params: any;
  query: any;
  headers: any;
  file?: any; // for multer uploads
  rawBody?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      name: payload.name,
      classId: payload.classId, // Extract from JWT
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
