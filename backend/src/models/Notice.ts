import mongoose, { Schema, Document } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  date: Date;
  priority: 'low' | 'medium' | 'high';
  audience: 'all' | 'teachers' | 'students';
  author: string;
  authorId: string;
  createdByRole: 'admin' | 'teacher';
  attachments: { filename: string; url: string; mimetype: string; size: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    audience: { type: String, enum: ['all', 'teachers', 'students'], default: 'all' },
    authorId: { type: String },
    createdByRole: { type: String, enum: ['admin', 'teacher'], default: 'admin' },
    attachments: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
        mimetype: { type: String, default: 'application/octet-stream' },
        size: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>('Notice', NoticeSchema);
