import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  targetRole: 'admin' | 'teacher' | 'student' | 'parent';
  targetClass?: mongoose.Types.ObjectId;
  targetUsers?: mongoose.Types.ObjectId[];
  senderId: mongoose.Types.ObjectId;
  isRead: boolean;
  readBy: mongoose.Types.ObjectId[];
  priority: 'low' | 'medium' | 'high';
  type: 'announcement' | 'alert' | 'reminder' | 'result' | 'fee' | 'general';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetRole: { type: String, enum: ['all', 'admin', 'teacher', 'student', 'parent'], required: true },
    targetClass: { type: Schema.Types.ObjectId, ref: 'Class' },
    targetUsers: [{ type: Schema.Types.ObjectId }],
    // senderId refers to the admin/teacher who created the notification
    senderId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId }],
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    type: { type: String, enum: ['announcement', 'alert', 'reminder', 'result', 'fee', 'general'], default: 'general' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ targetRole: 1 });
NotificationSchema.index({ targetClass: 1 });
NotificationSchema.index({ senderId: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);