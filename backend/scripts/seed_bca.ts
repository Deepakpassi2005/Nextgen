import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import connectDB from '../src/config/db';
import ExcelJS from 'exceljs';

// Import all models
import { Student } from '../src/models/Student';
import { Teacher } from '../src/models/Teacher';
import { Class } from '../src/models/Class';
import { Subject } from '../src/models/Subject';
import { Notice } from '../src/models/Notice';
import { Assignment } from '../src/models/Assignment';
import { AssignmentSubmission } from '../src/models/AssignmentSubmission';
import { Attendance } from '../src/models/Attendance';
import { Activity } from '../src/models/Activity';
import { AuditLog } from '../src/models/AuditLog';
import { Exam } from '../src/models/Exam';
import { Marks } from '../src/models/Marks';
import { Message } from '../src/models/Message';
import { Notification } from '../src/models/Notification';
import { PunchLog } from '../src/models/PunchLog';
import { Quiz } from '../src/models/Quiz';
import { QuizSubmission } from '../src/models/QuizSubmission';
import { Result } from '../src/models/Result';
import { StudyMaterial } from '../src/models/StudyMaterial';
import { TeacherAttendance } from '../src/models/TeacherAttendance';
import { Timetable } from '../src/models/Timetable';
import { TimetableConfig } from '../src/models/TimetableConfig';
import { User } from '../src/models/User';

async function seed() {
  await connectDB();
  console.log('🧹 Starting database cleanup...');

  const modelsToClear = [
    Student, Class, Subject, Notice, Assignment, AssignmentSubmission,
    Attendance, Activity, AuditLog, Exam, Marks, Message, Notification,
    PunchLog, Quiz, QuizSubmission, Result, StudyMaterial, TeacherAttendance,
    Timetable, TimetableConfig
  ];

  for (const model of modelsToClear) {
    await (model as any).deleteMany({});
    console.log(`Cleared ${(model as any).modelName}`);
  }

  const adminEmail = 'admin@gmail.com';
  await Teacher.deleteMany({ email: { $ne: adminEmail } });
  await User.deleteMany({ email: { $ne: adminEmail } });
  console.log('Cleared Teachers and Users (except admin)');

  let admin = await Teacher.findOne({ email: adminEmail });
  if (!admin) {
    admin = new Teacher({
      name: 'Admin User',
      email: adminEmail,
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('Re-created admin teacher');
  }

  console.log('🌱 Starting BCA data seeding...');

  // 1. Create 10 Teachers
  const teacherRecords = [];
  for (let i = 1; i <= 10; i++) {
    const password = `teacher${i}123`;
    const teacher = new Teacher({
      name: `Teacher ${i}`,
      email: `teacher${i}@bca.com`,
      password: password,
      role: 'teacher',
      status: 'active'
    });
    await teacher.save();
    teacherRecords.push({ model: teacher, password });
    console.log(`Created teacher: ${teacher.email}`);
  }

  // 2. Define Subjects
  const subjectsByClass: Record<string, string[]> = {
    'FYBCA': ['Digital Electronics', 'C Programming', 'Financial Accounting', 'Mathematical Statistics', 'Business Communication'],
    'SYBCA': ['Data Structures', 'Database Management', 'Computer Networks', 'Software Engineering', 'PHP'],
    'TYBCA': ['Java Programming', 'Web Technologies', 'Software Testing', 'Python', 'Network Security']
  };

  // 3. Create Classes, Subjects and Assignments
  const classNames = ['FYBCA', 'SYBCA', 'TYBCA'];
  const classes = [];
  const subjects = [];
  
  let teacherPtr = 0;

  for (const className of classNames) {
    // Assign Class Teacher
    const classTeacherWrap = teacherRecords[teacherPtr % teacherRecords.length];
    const classTeacher = classTeacherWrap.model;
    
    const cls = new Class({ 
      name: className, 
      capacity: 60, 
      status: 'active',
      teacherId: classTeacher._id
    });
    await cls.save();
    classes.push(cls);
    
    // Update teacher record
    classTeacher.classes = classTeacher.classes || [];
    classTeacher.classes.push(cls._id as any);
    classTeacher.isClassTeacher = true;
    await classTeacher.save();

    console.log(`Class ${className}: Teacher ${classTeacher.email}`);

    // Create Subjects
    const subs = subjectsByClass[className];
    for (let j = 0; j < subs.length; j++) {
      const subTeacherWrap = teacherRecords[(teacherPtr + j) % teacherRecords.length];
      const subTeacher = subTeacherWrap.model;
      
      const subject = new Subject({
        name: subs[j],
        code: `${className}-${(j + 1).toString().padStart(2, '0')}`,
        classId: cls._id,
        teacherIds: [subTeacher._id]
      });
      await subject.save();
      subjects.push(subject);

      // Update teacher subjects
      subTeacher.subjects = subTeacher.subjects || [];
      subTeacher.subjects.push(subject._id as any);
      await subTeacher.save();
    }
    
    teacherPtr += 2;
  }

  // 4. Create Students
  const studentRecords = [];
  for (const cls of classes) {
    for (let i = 1; i <= 10; i++) {
      const rollNumber = `${cls.name}-${i.toString().padStart(3, '0')}`;
      const password = `student${cls.name}${i}123`.toLowerCase();
      const email = `student.${rollNumber.toLowerCase()}@bca.com`;
      
      const student = new Student({
        admissionNumber: `ADM-${rollNumber}`,
        firstName: `Student ${i}`,
        lastName: cls.name,
        rollNumber,
        classId: cls._id,
        email,
        password,
        role: 'student',
        status: 'active'
      });
      await student.save();
      studentRecords.push({ model: student, password, className: cls.name });
    }
  }

  // 5. Create Timetables (Ensuring ALL classes are covered)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00 AM', '10:00 AM', '11:15 AM', '12:15 PM'];
  const timetableRecords = [];

  for (const cls of classes) {
    const classSubs = subjects.filter(s => s.classId.toString() === cls._id.toString());
    console.log(`Generating timetable for ${cls.name} (${classSubs.length} subjects found)`);
    
    for (const day of days) {
      for (let sIdx = 0; sIdx < timeSlots.length; sIdx++) {
        const subject = classSubs[sIdx % classSubs.length];
        const teacherId = subject.teacherIds![0];
        
        const slot = new Timetable({
          classId: cls._id,
          day,
          timeSlot: timeSlots[sIdx],
          subjectId: subject._id,
          teacherId
        });
        await slot.save();
        timetableRecords.push(slot);
      }
    }
  }

  console.log('📊 Generating Comprehensive Excel report...');
  const workbook = new ExcelJS.Workbook();
  
  const setupSheet = (name: string, columns: any[]) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    return sheet;
  };

  // 1. Teachers Sheet
  const tSheet = setupSheet('Teachers', [
    { header: 'Teacher Name', key: 'name', width: 25 },
    { header: 'Email ID', key: 'email', width: 35 },
    { header: 'Password', key: 'password', width: 20 },
    { header: 'Subjects Taught', key: 'subjects', width: 50 },
    { header: 'Is Class Teacher', key: 'isClassTeacher', width: 15 },
  ]);
  
  for (const tWrap of teacherRecords) {
    const t = await Teacher.findById(tWrap.model._id).populate('subjects');
    const subNames = (t?.subjects as any[] || []).map(s => s.name).join(', ');
    tSheet.addRow({
      name: t?.name,
      email: t?.email,
      password: tWrap.password,
      subjects: subNames,
      isClassTeacher: t?.isClassTeacher ? 'Yes' : 'No'
    });
  }

  // 2. Students Sheet
  const sSheet = setupSheet('Students', [
    { header: 'Roll Number', key: 'roll', width: 15 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Class', key: 'class', width: 15 },
    { header: 'Email ID', key: 'email', width: 35 },
    { header: 'Password', key: 'password', width: 20 },
  ]);
  
  studentRecords.sort((a,b) => {
    if (a.className !== b.className) return a.className.localeCompare(b.className);
    return a.model.rollNumber.localeCompare(b.model.rollNumber);
  }).forEach(s => {
    sSheet.addRow({
      roll: s.model.rollNumber,
      name: `${s.model.firstName} ${s.model.lastName}`,
      class: s.className,
      email: s.model.email,
      password: s.password
    });
  });

  // 3. Classes Sheet
  const cSheet = setupSheet('Classes', [
    { header: 'Class Name', key: 'name', width: 15 },
    { header: 'Class Teacher', key: 'teacher', width: 25 },
    { header: 'Capacity', key: 'capacity', width: 10 },
  ]);
  
  for (const cls of classes) {
    const ct = await Teacher.findById(cls.teacherId);
    cSheet.addRow({
      name: cls.name,
      teacher: ct ? ct.name : 'N/A',
      capacity: cls.capacity
    });
  }

  // 4. Subjects Sheet
  const subSheet = setupSheet('Subjects', [
    { header: 'Subject Name', key: 'name', width: 30 },
    { header: 'Code', key: 'code', width: 15 },
    { header: 'Class', key: 'class', width: 15 },
    { header: 'Assigned Teacher', key: 'teacher', width: 25 },
  ]);
  
  for (const sub of subjects) {
    const cls = classes.find(c => c._id.toString() === sub.classId.toString());
    const teach = await Teacher.findById(sub.teacherIds![0]);
    subSheet.addRow({
      name: sub.name,
      code: sub.code,
      class: cls?.name,
      teacher: teach?.name
    });
  }

  // 5. Timetable Sheet
  const ttSheet = setupSheet('Timetable', [
    { header: 'Class', key: 'class', width: 15 },
    { header: 'Day', key: 'day', width: 15 },
    { header: 'Time Slot', key: 'slot', width: 15 },
    { header: 'Subject', key: 'subject', width: 30 },
    { header: 'Teacher', key: 'teacher', width: 25 },
  ]);
  
  // Sort timetable by Class, Day (custom order), Time
  const dayOrder: Record<string, number> = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
  
  const ttDatas = [];
  for (const tt of timetableRecords) {
    const cls = classes.find(c => c._id.toString() === tt.classId.toString());
    const sub = subjects.find(s => s._id.toString() === tt.subjectId.toString());
    const teach = await Teacher.findById(tt.teacherId);
    ttDatas.push({
      class: cls?.name,
      day: tt.day,
      slot: tt.timeSlot,
      subject: sub?.name,
      teacher: teach?.name
    });
  }
  
  ttDatas.sort((a,b) => {
    if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '');
    if (a.day !== b.day) return dayOrder[a.day] - dayOrder[b.day];
    return a.slot.localeCompare(b.slot);
  }).forEach(row => ttSheet.addRow(row));

  const excelPath = path.join(process.cwd(), 'BCA_Login_Credentials.xlsx');
  await workbook.xlsx.writeFile(excelPath);
  console.log(`✅ Final Comprehensive Excel sheet generated at: ${excelPath}`);

  console.log('✨ Data Seeding and Report Generation Complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed', err);
  process.exit(1);
});
