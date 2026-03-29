import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { sendSuccess, sendError } from '../utils/response';

export const registerFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return sendError(res, 'FCM Token is required', 400);

    const userId = req.user?.id;
    const role = req.user?.role;

    if (role === 'student') {
      await Student.findByIdAndUpdate(userId, { fcmToken });
    } else if (role === 'teacher' || role === 'admin') {
      await Teacher.findByIdAndUpdate(userId, { fcmToken });
    } else {
      return sendError(res, 'Invalid user role for push notifications', 400);
    }

    return sendSuccess(res, { message: 'FCM Token registered successfully' });
  } catch (err: any) {
    console.error('[user.registerFcmToken]', err);
    return sendError(res, err.message || 'Failed to register FCM token', 400);
  }
};
