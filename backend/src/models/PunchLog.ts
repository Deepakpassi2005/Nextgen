import mongoose, { Schema, Document } from 'mongoose';

export interface IPunchLog extends Document {
  teacherId: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  timestamp: Date;
  withinRadius: boolean;
}

const PunchLogSchema = new Schema<IPunchLog>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    withinRadius: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// one punch per teacher per day
PunchLogSchema.index({ teacherId: 1, timestamp: 1 }, { unique: true, partialFilterExpression: { withinRadius: true } });

export const PunchLog = mongoose.model<IPunchLog>('PunchLog', PunchLogSchema);
