import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  classId: Schema.Types.ObjectId;
  teacherIds?: Schema.Types.ObjectId[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'Teacher', default: [] }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Ensure unique constraint on (name, classId) - one subject name per class
subjectSchema.index({ name: 1, classId: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
