import { Activity, IActivity } from '../models/Activity';

// The package.json for socket.io uses conditional exports which can confuse
// TypeScript's module resolution.  Import directly from the compiled typings
// file in `dist` where the Server class is declared to avoid the namespace
// conflict observed earlier.
import type { Server as IOServer } from 'socket.io/dist';

let io: IOServer | null = null;

export const initializeSocketIO = (socketIO: IOServer) => {
  io = socketIO;
};

export const logActivity = async (
  type: IActivity['type'],
  title: string,
  description: string,
  userId: string,
  userName: string,
  relatedId?: string,
  relatedType?: string
): Promise<IActivity | null> => {
  try {
    // ensure userId is castable to ObjectId; if not, leave undefined
    let uid: any = undefined;
    const mongoose = await import('mongoose');
    if (mongoose.Types.ObjectId.isValid(userId)) {
      uid = new mongoose.Types.ObjectId(userId);
    }

    const activity = new Activity({
      type,
      title,
      description,
      userId: uid,
      userName,
      relatedId,
      relatedType,
      read: false,
    });

    const saved = await activity.save();

    // Emit real-time notification via Socket.io (doesn't block)
    if (io) {
      try {
        io.emit('activity', {
          _id: saved._id,
          type: saved.type,
          title: saved.title,
          description: saved.description,
          userName: saved.userName,
          createdAt: saved.createdAt,
          read: false,
        });
      } catch (e) {
        console.error('Socket emit failed:', e);
      }
    }

    return saved;
  } catch (err) {
    console.error('Error logging activity:', err);
    // swallow error so callers are not impacted
    return null;
  }
};

export const getRecentActivities = async (limit: number = 10) => {
  try {
    return await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (err) {
    console.error('Error fetching activities:', err);
    throw err;
  }
};

export const markActivityAsRead = async (activityId: string) => {
  try {
    return await Activity.findByIdAndUpdate(
      activityId,
      { read: true },
      { new: true }
    );
  } catch (err) {
    console.error('Error marking activity as read:', err);
    throw err;
  }
};
