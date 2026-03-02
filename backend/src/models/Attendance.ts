import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceStudent {
  studentId: mongoose.Types.ObjectId;
  status: 'present' | 'absent';
}

export interface IAttendance extends Document {
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  students: IAttendanceStudent[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    date: { type: Date, required: true },
    students: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        status: { type: String, enum: ['present', 'absent'], required: true },
      },
    ],
  },
  { timestamps: true }
);

// prevent duplicate attendance per class per date
AttendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

// helper index for queries by student
AttendanceSchema.index({ 'students.studentId': 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
