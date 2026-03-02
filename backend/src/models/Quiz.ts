import mongoose, { Schema, Document } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  questions: {
    question: string;
    options: string[];
    answer: string;
  }[];
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String }],
        answer: { type: String, required: true },
      },
    ],
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
