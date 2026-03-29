import mongoose from 'mongoose';
import { Teacher } from './src/models/Teacher';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

async function debugRaw() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const teacher = await Teacher.findOne({ email: 'don12@gmail.com' });
  if (!teacher) {
    console.log('Teacher not found');
  } else {
    console.log('Teacher found:', teacher.name);
    console.log('Role:', teacher.role);
    console.log('Raw classes field:', teacher.classes);
    console.log('Raw subjects field:', teacher.subjects);
  }

  await mongoose.disconnect();
}

debugRaw().catch(console.error);
