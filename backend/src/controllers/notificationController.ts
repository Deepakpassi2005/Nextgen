import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Notification } from '../models/Notification';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';

const notificationRequired = ['title', 'message', 'type', 'priority', 'targetAudience'];

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Include notifications that either have not expired or have no expiration set.
    const notifications = await Notification.find({
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: { $exists: false } },
        { expiresAt: null },
      ],
    }).populate('senderId targetClass');

    return sendSuccess(res, notifications);
  } catch (err) {
    console.error('[notification.getNotifications]', err);
    return sendError(res, 'Failed to fetch notifications');
  }
};

export const getNotificationsByUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user?.id;
    const teacher = await Teacher.findById(userId);
    const student = await Student.findById(userId);
    const user = teacher || student;
    if (!user) return sendError(res, 'User not found', 404);

    // Get user role - check if it's a teacher or student
    const userRole = teacher ? teacher.role || 'teacher' : 'student';

    const now = new Date();

    // Include notifications that either have not expired or have no expiration set.
    const query: any = {
      $and: [
        {
          $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: { $exists: false } },
            { expiresAt: null },
          ],
        },
        {
          $or: [
            { targetRole: userRole },
            { targetRole: 'all' },
            { targetUsers: userId },
          ],
        },
      ],
    };

    const notifications = await Notification.find(query).populate('senderId targetClass');
    return sendSuccess(res, notifications);
  } catch (err) {
    console.error('[notification.getNotificationsByUser]', err);
    return sendError(res, 'Failed to fetch user notifications');
  }
};

export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      message,
      targetAudience,
      targetRole,
      targetClass,
      targetUsers,
      priority,
      type,
      expiresAt,
    } = req.body;

    const missingFields: string[] = [];
    if (!title) missingFields.push('title');
    if (!message) missingFields.push('message');
    if (!type) missingFields.push('type');
    if (!priority) missingFields.push('priority');
    if (!targetRole && !targetAudience) missingFields.push('targetAudience');

    if (missingFields.length > 0) {
      return sendError(res, `Missing required field(s): ${missingFields.join(', ')}`, 400);
    }

    const senderId = req.user?.id;

    if (!senderId) {
      console.error('[notification.createNotification] missing senderId (user not authenticated)');
      return sendError(res, 'Missing senderId (user must be authenticated)', 401);
    }

    const resolvedTargetRole = (targetRole || targetAudience || 'all').toString();

    const notification = new Notification({
      title,
      message,
      targetRole: resolvedTargetRole,
      targetClass,
      targetUsers,
      senderId,
      priority,
      type,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    const saved = await notification.save();
    const populated = await saved.populate('senderId targetClass');
    return res.status(201).json({ success: true, message: 'Notification created', data: populated });
  } catch (err: any) {
    console.error('[notification.createNotification]', err);
    const msg = err.message || 'Failed to create notification';
    return sendError(res, msg, 400);
  }
};

export const updateNotification = async (req: Request, res: Response) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('senderId targetClass');

    if (!updated) return sendError(res, 'Notification not found', 404);
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[notification.updateNotification]', err);
    const msg = err.message || 'Failed to update notification';
    return sendError(res, msg, 400);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Notification not found', 404);
    return sendSuccess(res, { message: 'Notification deleted' });
  } catch (err) {
    console.error('[notification.deleteNotification]', err);
    return sendError(res, 'Failed to delete notification');
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const notification = await Notification.findById(req.params.id);

    if (!notification) return sendError(res, 'Notification not found', 404);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (!notification.readBy.includes(userObjectId)) {
      notification.readBy.push(userObjectId);
    }

    // Check if all targeted users have read it
    const allRead = await checkAllUsersRead(notification);
    if (allRead) {
      notification.isRead = true;
    }

    await notification.save();
    return sendSuccess(res, { message: 'Notification marked as read' });
  } catch (err) {
    console.error('[notification.markAsRead]', err);
    return sendError(res, 'Failed to mark notification as read');
  }
};

async function checkAllUsersRead(notification: any): Promise<boolean> {
  // This is a simplified check - in a real app you'd check all targeted users
  return notification.readBy.length > 0;
}