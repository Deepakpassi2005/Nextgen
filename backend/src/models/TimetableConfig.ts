import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetableConfig extends Document {
  classId: mongoose.Types.ObjectId;
  startTime: string; // HH:mm format
  periodDuration: number; // in minutes
  periodCount: number; // number of periods per day
  createdAt: Date;
  updatedAt: Date;
}

const TimetableConfigSchema = new Schema<ITimetableConfig>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      unique: true,
    },
    startTime: {
      type: String,
      required: true,
      default: '09:00',
    },
    periodDuration: {
      type: Number,
      required: true,
      default: 60,
    },
    periodCount: {
      type: Number,
      required: true,
      default: 7,
    },
  },
  { timestamps: true }
);

export const TimetableConfig = mongoose.model<ITimetableConfig>(
  'TimetableConfig',
  TimetableConfigSchema
);
