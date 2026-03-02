import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  classId?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  message?: string;
  fileUrl?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
