import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

import connectDB from '../src/config/db';
import { Teacher } from '../src/models/Teacher';
import { Student } from '../src/models/Student';
import { Class } from '../src/models/Class';
import { Subject } from '../src/models/Subject';
import { Notice } from '../src/models/Notice';

async function seed() {
  await connectDB();

  // create a default admin teacher if not exists
  // NOTE: The admin login credentials are intentionally fixed for demo/dev use
  const adminEmail = 'admin@gmail.com';
  const teacherEmail = 'teacher@school.test';
  const studentEmail = 'student@school.test';

  const bcrypt = await import('bcrypt');

  let admin = await Teacher.findOne({ email: adminEmail });
  const adminPassword = 'admin123';
  if (!admin) {
    admin = new Teacher({ name: 'Admin User', email: adminEmail, password: adminPassword, role: 'admin' });
    await admin.save();
    console.log('Created admin teacher:', adminEmail);
  } else {
    // Ensure the admin password is always in sync with the expected value for development
    const passwordMatches = await bcrypt.compare(adminPassword, admin.password);
    if (!passwordMatches) {
      admin.password = adminPassword;
      await admin.save();
      console.log('Updated admin password to the default development password');
    } else {
      console.log('Admin teacher already exists');
    }
  }

  let teacher = await Teacher.findOne({ email: teacherEmail });
  if (!teacher) {
    teacher = new Teacher({ name: 'John Teacher', email: teacherEmail, password: 'teacherpass' });
    await teacher.save();
    console.log('Created teacher:', teacherEmail);
  }

  // class
  let cls = await Class.findOne({ name: 'Grade 1' });
  if (!cls) {
    cls = new Class({ name: 'Grade 1', capacity: 40, teacherId: teacher?._id });
    await cls.save();
    console.log('Created class Grade 1');
  }

  // subject
  let subject = await Subject.findOne({ name: 'Mathematics' });
  if (!subject) {
    subject = new Subject({ name: 'Mathematics', code: 'MATH101', classId: cls._id, teacherIds: [teacher?._id] });
    await subject.save();
    console.log('Created subject Mathematics');
  }

  // student
  let student = await Student.findOne({ email: studentEmail });
  if (!student) {
    student = new Student({ admissionNumber: 'ADM001', firstName: 'Jane', lastName: 'Doe', rollNumber: '1', classId: cls._id, email: studentEmail, password: 'studentpass', role: 'student' });
    await student.save();
    console.log('Created student:', studentEmail);
  }

  // notice
  let notice = await Notice.findOne({ title: 'Welcome Notice' });
  if (!notice) {
    notice = new Notice({ title: 'Welcome Notice', content: 'Welcome to the system', author: 'Admin', date: new Date() });
    await notice.save();
    console.log('Created notice');
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
