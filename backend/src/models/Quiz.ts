import mongoose, { Schema, Document } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  description?: string;
  classId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  questions: {
    _id: mongoose.Types.ObjectId;
    question: string;
    options: string[];
    answer: string;
    marks?: number;
  }[];
  totalMarks: number;
  passingMarks?: number;
  duration: number; // in minutes
  instructions?: string;
  dueDate: Date;
  isPublished: boolean;
  isActive: boolean;
  shuffle: boolean; // shuffle questions
  showCorrectAnswers: boolean; // show answers after submission
  allowMultipleAttempts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    questions: [
      {
        question: { type: String, required: true },
        options: { type: [String], required: true },
        answer: { type: String, required: true },
        marks: { type: Number, default: 1 },
      },
    ],
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, default: 0 },
    duration: { type: Number, required: true, default: 30 }, // minutes
    instructions: { type: String, default: '' },
    dueDate: { type: Date },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    shuffle: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: false },
    allowMultipleAttempts: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
