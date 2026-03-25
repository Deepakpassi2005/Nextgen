import mongoose from 'mongoose';
import { Teacher } from './src/models/Teacher';
import { Class } from './src/models/Class';
import { Subject } from './src/models/Subject';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

async function debug() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const teacher = await Teacher.findOne({ email: 'don12@gmail.com' }).populate('subjects classes');
  if (!teacher) {
    console.log('Teacher not found');
  } else {
    console.log('Teacher found:', teacher.name);
    console.log('Role:', teacher.get('role'));
    console.log('Raw classes IDs:', teacher.get('classes', null, { getters: false }));
    console.log('Populated classes:', teacher.classes);
    console.log('Raw subjects IDs:', teacher.get('subjects', null, { getters: false }));
    console.log('Populated subjects:', teacher.subjects);
  }

  const allClasses = await Class.find();
  console.log('All Classes available:', allClasses.map(c => ({ id: c._id, name: c.name })));

  const allSubjects = await Subject.find();
  console.log('All Subjects available:', allSubjects.map(s => ({ id: s._id, name: s.name })));

  await mongoose.disconnect();
}

debug().catch(console.error);
