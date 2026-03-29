import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface ITeacher extends Document {
  name: string;
  email: string;
  password: string;
  role?: string;
  employeeId?: string;
  phoneNumber?: string;
  department?: string;
  qualification?: string;
  experience?: number;
  joiningDate?: Date;
  dateOfBirth?: Date;
  isClassTeacher?: boolean;
  address?: string;
  emergencyContact?: string;
  alternatePhone?: string;
  subjects?: mongoose.Types.ObjectId[];
  classes?: mongoose.Types.ObjectId[];
  status: 'active' | 'inactive';
  profilePhoto?: string;
  notificationSettings?: {
    nextClass: boolean;
    attendanceMarked: boolean;
    newResult: boolean;
    newNotice: boolean;
  };
  fcmToken?: string;
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
    profilePhoto: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notificationSettings: {
      nextClass: { type: Boolean, default: true },
      attendanceMarked: { type: Boolean, default: true },
      newResult: { type: Boolean, default: true },
      newNotice: { type: Boolean, default: true },
    },
    fcmToken: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
TeacherSchema.pre<ITeacher>('save', async function() {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err: any) {
    throw err;
  }
});

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
