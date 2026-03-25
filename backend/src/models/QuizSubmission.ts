import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizSubmission extends Document {
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: {
    questionId: mongoose.Types.ObjectId;
    answer: string;
    isCorrect?: boolean;
  }[];
  score?: number;
  totalMarks?: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSubmissionSchema = new Schema<IQuizSubmission>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, required: true },
        answer: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// prevent a student from submitting the same quiz twice
QuizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export const QuizSubmission = mongoose.model<IQuizSubmission>('QuizSubmission', QuizSubmissionSchema);
