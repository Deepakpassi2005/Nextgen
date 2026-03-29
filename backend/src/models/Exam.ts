import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  name: string;
  examType: 'mid-term' | 'final' | 'quiz' | 'assignment' | 'project';
  classId: mongoose.Types.ObjectId;
  subjects: mongoose.Types.ObjectId[];
  examDate: Date;
  totalMarks: number;
  duration?: number; // in minutes
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    name: { type: String, required: true },
    examType: { type: String, enum: ['mid-term', 'final', 'quiz', 'assignment', 'project'], required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject', required: true }],
    examDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, min: 0 },
    duration: { type: Number, default: 0 },
    instructions: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for efficient queries
ExamSchema.index({ classId: 1 });
ExamSchema.index({ examType: 1 });
ExamSchema.index({ examDate: 1 });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);