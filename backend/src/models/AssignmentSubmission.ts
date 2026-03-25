import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submittedAt: Date;
  content: string;
  attachments: { filename: string; url: string; mimetype: string; size: number }[];
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    submittedAt: { type: Date, default: Date.now },
    content: { type: String },
    attachments: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
        mimetype: { type: String, default: 'application/octet-stream' },
        size: { type: Number, default: 0 },
      },
    ],
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String },
    gradedAt: { type: Date },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);