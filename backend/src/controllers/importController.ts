import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export const importStudents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return sendError(res, 'CSV file is required', 400);

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const students = [];
          const errors = [];

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as any;

            // Validate required fields
            if (!row.admissionNumber || !row.firstName || !row.email || !row.classId) {
              errors.push(`Row ${i + 1}: Missing required fields`);
              continue;
            }

            // Check if student already exists
            const existing = await Student.findOne({ admissionNumber: row.admissionNumber });
            if (existing) {
              errors.push(`Row ${i + 1}: Student with admission number ${row.admissionNumber} already exists`);
              continue;
            }

            const student = new Student({
              admissionNumber: row.admissionNumber,
              firstName: row.firstName,
              middleName: row.middleName || '',
              lastName: row.lastName || '',
              gender: row.gender || 'male',
              dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
              email: row.email,
              phone: row.phone || '',
              residentialAddress: row.residentialAddress || '',
              city: row.city || '',
              state: row.state || '',
              pinCode: row.pinCode || '',
              classId: row.classId,
              rollNumber: row.rollNumber,
              password: row.password || 'default123', // Should be hashed
              status: 'active',
            });

            students.push(student);
          }

          // Bulk insert valid students
          if (students.length > 0) {
            await Student.insertMany(students);
          }

          // Clean up uploaded file
          fs.unlinkSync(filePath);

          return sendSuccess(res, {
            imported: students.length,
            errors,
            total: results.data.length
          });
        } catch (error: any) {
          console.error('Error processing CSV:', error);
          return sendError(res, 'Error processing CSV file');
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        return sendError(res, 'Error parsing CSV file');
      }
    });
  } catch (err) {
    console.error('[import.importStudents]', err);
    return sendError(res, 'Failed to import students');
  }
};

export const importTeachers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return sendError(res, 'CSV file is required', 400);

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const teachers = [];
          const errors = [];

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as any;

            if (!row.name || !row.email || !row.employeeId) {
              errors.push(`Row ${i + 1}: Missing required fields`);
              continue;
            }

            const existing = await Teacher.findOne({ employeeId: row.employeeId });
            if (existing) {
              errors.push(`Row ${i + 1}: Teacher with employee ID ${row.employeeId} already exists`);
              continue;
            }

            const teacher = new Teacher({
              name: row.name,
              email: row.email,
              employeeId: row.employeeId,
              phone: row.phone || '',
              department: row.department || '',
              subjects: row.subjects ? row.subjects.split(',').map((s: string) => s.trim()) : [],
              qualification: row.qualification || '',
              experience: parseInt(row.experience) || 0,
              password: row.password || 'default123',
              status: 'active',
            });

            teachers.push(teacher);
          }

          if (teachers.length > 0) {
            await Teacher.insertMany(teachers);
          }

          fs.unlinkSync(filePath);

          return sendSuccess(res, {
            imported: teachers.length,
            errors,
            total: results.data.length
          });
        } catch (error: any) {
          console.error('Error processing CSV:', error);
          return sendError(res, 'Error processing CSV file');
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        return sendError(res, 'Error parsing CSV file');
      }
    });
  } catch (err) {
    console.error('[import.importTeachers]', err);
    return sendError(res, 'Failed to import teachers');
  }
};

export const exportStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find().populate('classId').lean();

    const csvData = students.map(student => ({
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth?.toISOString().split('T')[0],
      email: student.email,
      phone: student.phone,
      residentialAddress: student.residentialAddress,
      city: student.city,
      state: student.state,
      pinCode: student.pinCode,
      className: (student.classId as any)?.name || '',
      rollNumber: student.rollNumber,
      status: student.status,
    }));

    const csv = Papa.unparse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('students_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('[export.exportStudents]', err);
    return sendError(res, 'Failed to export students');
  }
};

export const exportTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find().lean();

    const csvData = teachers.map(teacher => ({
      name: teacher.name,
      email: teacher.email,
      employeeId: teacher.employeeId,
      phone: (teacher as any).phone || teacher.phoneNumber || '',
      department: teacher.department,
      subjects: teacher.subjects?.join(', '),
      qualification: teacher.qualification,
      experience: teacher.experience,
      status: teacher.status,
    }));

    const csv = Papa.unparse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('teachers_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('[export.exportTeachers]', err);
    return sendError(res, 'Failed to export teachers');
  }
};