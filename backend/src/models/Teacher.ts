import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  email: string;
  password: string;
  subjects?: mongoose.Types.ObjectId[];
  classes?: mongoose.Types.ObjectId[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // professional details
    // employeeId is optional and may not exist on every teacher
    // @ts-ignore
    employeeId: { type: String as any, unique: true, sparse: true },
    phone: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    role: { type: String, enum: ['admin','teacher','student'], default: 'teacher' },
    qualification: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    joiningDate: { type: Date },
    dateOfBirth: { type: Date },
    // academic assignment
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject', default: [] }],
    classes: [{ type: Schema.Types.ObjectId, ref: 'Class', default: [] }],
    isClassTeacher: { type: Boolean, default: false },
    department: { type: String, default: '' },
    // contact & address
    address: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    alternatePhone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
