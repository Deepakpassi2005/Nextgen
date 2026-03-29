import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from './authMiddleware';

export const auditLogMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  let responseBody: any;

  res.send = function (body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    try {
      if (req.user && req.user.id) {
        const auditLog = new AuditLog({
          userId: req.user.id,
          action: req.method,
          entity: getEntityFromPath(req.path),
          entityId: getEntityIdFromPath(req.path),
          oldData: req.method === 'PUT' ? await getOldData(req.path, req.params.id) : undefined,
          newData: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        await auditLog.save();
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  });

  next();
};

function getEntityFromPath(path: string): string {
  const segments = path.split('/');
  if (segments.length >= 2) {
    return segments[1]; // e.g., /students -> students
  }
  return 'unknown';
}

function getEntityIdFromPath(path: string): string | undefined {
  const segments = path.split('/');
  if (segments.length >= 3 && segments[2]) {
    return segments[2];
  }
  return undefined;
}

async function getOldData(path: string, id: string): Promise<any> {
  // This is a simplified version - in production, you'd query the database
  // to get the old data before update
  return undefined;
}