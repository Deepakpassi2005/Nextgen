import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { Student } from '../src/models/Student';
import { Teacher } from '../src/models/Teacher';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asset-manager';

async function fixPasswords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const students = await Student.find({});
    console.log(`Found ${students.length} students`);
    
    for (const student of students) {
      if (student.password && !student.password.startsWith('$2')) {
        console.log(`Hashing password for student: ${student.email}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(student.password, salt);
        // Use updateOne to bypass validation for this fix
        await Student.updateOne({ _id: student._id }, { password: hashedPassword });
      }
    }

    const teachers = await Teacher.find({});
    console.log(`Found ${teachers.length} teachers`);

    for (const teacher of teachers) {
      if (teacher.password && !teacher.password.startsWith('$2')) {
        console.log(`Hashing password for teacher: ${teacher.email}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(teacher.password, salt);
        await Teacher.updateOne({ _id: teacher._id }, { password: hashedPassword });
      }
    }

    console.log('Password fix completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing passwords:', err);
    process.exit(1);
  }
}

fixPasswords();
