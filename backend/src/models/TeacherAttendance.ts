import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherAttendance extends Document {
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAttendanceSchema = new Schema<ITeacherAttendance>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

TeacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

export const TeacherAttendance = mongoose.model<ITeacherAttendance>('TeacherAttendance', TeacherAttendanceSchema);
