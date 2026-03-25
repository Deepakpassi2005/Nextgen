import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], default: 'student' },
  },
  { timestamps: true }
);

const UserModel = mongoose.model<IUser>('User', UserSchema);

export default UserModel;
export { UserModel as User };
