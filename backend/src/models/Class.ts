import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  teacherId?: mongoose.Types.ObjectId;
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, unique: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', default: null },
    capacity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Class = mongoose.model<IClass>('Class', ClassSchema);
