import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  classId?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  message?: string;
  fileUrl?: string;
  messageType: 'text' | 'file' | 'announcement';
  isRead: boolean;
  readAt?: Date;
  deletedAt?: Date; // soft delete
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    messageType: { type: String, enum: ['text', 'file', 'announcement'], default: 'text' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    deletedAt: { type: Date }, // soft delete support
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
