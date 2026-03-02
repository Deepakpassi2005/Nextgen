import mongoose, { Schema, Document } from 'mongoose';

export interface IResult extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  marks: {
    subjectId: mongoose.Types.ObjectId;
    score: number;
    maxMarks: number;
  }[];
  published: boolean;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    marks: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
        score: { type: Number, required: true },
        maxMarks: { type: Number, required: true },
      },
    ],
    published: { type: Boolean, default: false },
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Result = mongoose.model<IResult>('Result', ResultSchema);
