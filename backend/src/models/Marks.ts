import mongoose, { Schema, Document } from 'mongoose';

export interface IMarks extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  examType: 'mid-term' | 'final' | 'quiz' | 'assignment' | 'project';
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
  teacherId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarksSchema = new Schema<IMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    examType: { 
      type: String, 
      enum: [
        'mid-term', 'final', 'quiz', 'assignment', 'project', 'semester',
        'isa1', 'isa2', 'isa3',
        'semester1', 'semester2', 'semester3', 'semester4', 'semester5', 'semester6',
        'peer-learning'
      ], 
      required: true 
    },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 0 },
    grade: { type: String, default: '' },
    remarks: { type: String, default: '' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { timestamps: true }
);

// Index for efficient queries
MarksSchema.index({ studentId: 1, subjectId: 1 });
MarksSchema.index({ classId: 1 });
MarksSchema.index({ teacherId: 1 });
MarksSchema.index({ examType: 1 });

export const Marks = mongoose.model<IMarks>('Marks', MarksSchema);
