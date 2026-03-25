import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  dueDate: Date;
  attachments: { filename: string; url: string; mimetype: string; size: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    dueDate: { type: Date, required: true },
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

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);