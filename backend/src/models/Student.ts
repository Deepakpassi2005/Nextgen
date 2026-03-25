import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IGuardian {
  type: 'father' | 'mother' | 'guardian';
  name: string;
  relation?: string;
  contactNumber: string; // for SMS notifications
  email?: string; // for email notifications
  occupation?: string;
  annualIncome?: number;
  enableParentLogin?: boolean;
  isNationalGuardian?: boolean; // primary contact for notifications
}

export interface IMedicalInfo {
  hasConditions: boolean;
  details?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  doctorName?: string;
  hospital?: string;
}

export interface ITransportInfo {
  required: boolean;
  route?: string;
  busNumber?: string;
  pickupPoint?: string;
  dropPoint?: string;
  driverContact?: string;
}

export interface IStudent extends Document {
  // 1️⃣ Basic Student Information
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  age?: number;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  studentPhoto?: string;

  // 2️⃣ Academic Information
  academicYear?: string;
  admissionDate?: Date;
  classId: mongoose.Types.ObjectId;
  section?: string;
  rollNumber: string;
  previousSchool?: string;
  previousClass?: string;
  transferCertificateNumber?: string;
  mediumOfInstruction?: 'english' | 'hindi' | 'other';

  // 3️⃣ Contact & Address
  studentMobileNumber?: string;
  parentMobileNumber?: string; // deprecated - use guardians array
  alternateMobileNumber?: string;
  email: string;
  residentialAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;

  // Parent/Guardian Details
  guardians?: IGuardian[];
  fatherName?: string;
  fatherContact?: string;
  motherName?: string;
  motherMobileNumber?: string;
  parentEmail?: string;
  primaryContactForNotifications?: 'father' | 'mother' | 'guardian' | 'both';

  // 5️⃣ Medical Information
  medicalInfo?: IMedicalInfo;

  // 6️⃣ Fee & Financial Details
  feeCategory?: 'regular' | 'rte' | 'scholarship';
  feeStructure?: string;
  discountPercentage?: number;
  scholarshipPercentage?: number;
  paymentModePreference?: string;

  // 7️⃣ Transport Details
  transportInfo?: ITransportInfo;

  // 8️⃣ Documents
  documents?: {
    birthCertificate?: string;
    aadharCard?: string;
    previousSchoolTC?: string;
    parentIdProof?: string;
    casteCertificate?: string;
  };

  // 9️⃣ System & Account Settings
  status: 'active' | 'inactive';
  role?: 'admin' | 'teacher' | 'student';
  phone?: string;
  loginUsername?: string;
  password: string;
  userId?: mongoose.Types.ObjectId; // Reference to User model
  remarks?: string;
  attendance: number;
  averageScore: number;
  notificationSettings?: {
    newNotice: boolean;
    newResult: boolean;
    newAssignment: boolean;
  };
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    // 1️⃣ Basic Student Information
    admissionNumber: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    dateOfBirth: { type: Date, default: null },
    age: { type: Number, default: 0 },
    bloodGroup: { type: String, default: '' },
    nationality: { type: String, default: '' },
    religion: { type: String, default: '' },
    studentPhoto: { type: String, default: '' },

    // 2️⃣ Academic Information
    academicYear: { type: String, default: '2025-26' },
    admissionDate: { type: Date, default: Date.now },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String, default: '' },
    rollNumber: { type: String, required: true, unique: true },
    previousSchool: { type: String, default: '' },
    previousClass: { type: String, default: '' },
    transferCertificateNumber: { type: String, default: '' },
    mediumOfInstruction: { type: String, enum: ['english', 'hindi', 'other'], default: 'english' },

    // 3️⃣ Contact & Address
    studentMobileNumber: { type: String, default: '' },
    parentMobileNumber: { type: String, default: '' },
    alternateMobileNumber: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    residentialAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    country: { type: String, default: '' },

    // Parent/Guardian Details
    guardians: [
      {
        type: { type: String, enum: ['father', 'mother', 'guardian'], required: true },
        name: { type: String, required: true },
        relation: { type: String, default: '' },
        contactNumber: { type: String, required: true },
        email: { type: String, default: '' },
        occupation: { type: String, default: '' },
        annualIncome: { type: Number, default: 0 },
        enableParentLogin: { type: Boolean, default: false },
        isNationalGuardian: { type: Boolean, default: false },
      }
    ],
    fatherName: { type: String, default: '' },
    fatherContact: { type: String, default: '' },
    motherName: { type: String, default: '' },
    motherMobileNumber: { type: String, default: '' },
    parentEmail: { type: String, default: '' },
    primaryContactForNotifications: { type: String, enum: ['father', 'mother', 'guardian', 'both'], default: 'father' },

    // 5️⃣ Medical Information
    medicalInfo: {
      hasConditions: { type: Boolean, default: false },
      details: { type: String, default: '' },
      emergencyContactName: { type: String, default: '' },
      emergencyContactNumber: { type: String, default: '' },
      doctorName: { type: String, default: '' },
      hospital: { type: String, default: '' },
    },

    // 6️⃣ Fee & Financial Details
    feeCategory: { type: String, enum: ['regular', 'rte', 'scholarship'], default: 'regular' },
    feeStructure: { type: String, default: '' },
    discountPercentage: { type: Number, default: 0 },
    scholarshipPercentage: { type: Number, default: 0 },
    paymentModePreference: { type: String, default: '' },

    // 7️⃣ Transport Details
    transportInfo: {
      required: { type: Boolean, default: false },
      route: { type: String, default: '' },
      busNumber: { type: String, default: '' },
      pickupPoint: { type: String, default: '' },
      dropPoint: { type: String, default: '' },
      driverContact: { type: String, default: '' },
    },

    // 8️⃣ Documents
    documents: {
      birthCertificate: { type: String, default: '' },
      aadharCard: { type: String, default: '' },
      previousSchoolTC: { type: String, default: '' },
      parentIdProof: { type: String, default: '' },
      casteCertificate: { type: String, default: '' },
    },

    // 9️⃣ System & Account Settings
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    role: { type: String, enum: ['admin','teacher','student'], default: 'student' },
    phone: { type: String, default: '' },
    loginUsername: { type: String, default: '' },
    password: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, default: '' },
    attendance: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    notificationSettings: {
      newNotice: { type: Boolean, default: true },
      newResult: { type: Boolean, default: true },
      newAssignment: { type: Boolean, default: true },
    },
    fcmToken: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
StudentSchema.pre<IStudent>('save', async function() {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err: any) {
    throw err;
  }
});

// Virtual for full name
StudentSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
});

// Ensure virtual fields are serialized
StudentSchema.set('toJSON', { virtuals: true });
StudentSchema.set('toObject', { virtuals: true });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
