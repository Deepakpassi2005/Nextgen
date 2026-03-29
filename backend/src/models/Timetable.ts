import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetableSlot extends Document {
  classId: mongoose.Types.ObjectId;
  day: string; // Monday-Friday
  timeSlot: string; // e.g., "09:00 AM"
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    day: { 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 
      required: true 
    },
    timeSlot: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate slots
TimetableSlotSchema.index({ classId: 1, day: 1, timeSlot: 1 }, { unique: true });

export const Timetable = mongoose.model<ITimetableSlot>('Timetable', TimetableSlotSchema);
