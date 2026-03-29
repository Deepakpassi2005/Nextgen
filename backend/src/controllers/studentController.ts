import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import { logActivity } from '../services/activityService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendStudentWelcomeEmail } from '../services/emailService';

const studentRequired = ['admissionNumber', 'firstName', 'rollNumber', 'classId', 'email', 'password'];

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find()
      .populate('classId')
      .sort({ createdAt: -1 });

    return sendSuccess(res, students);
  } catch (err) {
    console.error('[student.getStudents]', err);
    return sendError(res, 'Failed to fetch students');
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id).populate('classId');
    if (!student) return sendError(res, 'Student not found', 404);
    return sendSuccess(res, student);
  } catch (err) {
    console.error('[student.getStudentById]', err);
    return sendError(res, 'Failed to fetch student');
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const error = requireFields(req.body, studentRequired);
    if (error) return sendError(res, error, 400);

    const student = new Student({
      admissionNumber: req.body.admissionNumber,
      firstName: req.body.firstName,
      middleName: req.body.middleName || '',
      lastName: req.body.lastName || '',
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      age: req.body.age,
      bloodGroup: req.body.bloodGroup,
      nationality: req.body.nationality,
      religion: req.body.religion,
      studentPhoto: req.body.studentPhoto,
      academicYear: req.body.academicYear,
      admissionDate: req.body.admissionDate,
      classId: req.body.classId,
      section: req.body.section || '',
      rollNumber: req.body.rollNumber,
      previousSchool: req.body.previousSchool,
      previousClass: req.body.previousClass,
      transferCertificateNumber: req.body.transferCertificateNumber,
      mediumOfInstruction: req.body.mediumOfInstruction,
      studentMobileNumber: req.body.studentMobileNumber,
      parentMobileNumber: req.body.parentMobileNumber,
      alternateMobileNumber: req.body.alternateMobileNumber,
      email: req.body.email,
      residentialAddress: req.body.residentialAddress,
      city: req.body.city,
      state: req.body.state,
      pinCode: req.body.pinCode,
      country: req.body.country,
      guardians: req.body.guardians,
      fatherName: req.body.fatherName,
      fatherContact: req.body.fatherContact,
      motherName: req.body.motherName,
      parentEmail: req.body.parentEmail,
      medicalInfo: req.body.medicalInfo,
      feeCategory: req.body.feeCategory,
      feeStructure: req.body.feeStructure,
      discountPercentage: req.body.discountPercentage,
      scholarshipPercentage: req.body.scholarshipPercentage,
      paymentModePreference: req.body.paymentModePreference,
      transportInfo: req.body.transportInfo,
      documents: req.body.documents,
      status: req.body.status || 'active',
      loginUsername: req.body.loginUsername,
      password: req.body.password,
      remarks: req.body.remarks,
      attendance: req.body.attendance || 0,
      averageScore: req.body.averageScore || 0,
    });

    const saved = await student.save();
    const populated = await saved.populate('classId');
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'student_created',
      `New Student Created: ${student.firstName} ${student.lastName}`,
      `Student "${student.firstName} ${student.lastName}" with admission number ${student.admissionNumber} has been created`,
      userId,
      userName,
      saved._id.toString(),
      'student'
    ).catch(() => {});

    // Send Welcome Email
    if (student.email) {
      sendStudentWelcomeEmail(
        student.email, 
        `${student.firstName} ${student.lastName}`,
        req.body.password
      ).catch(e => console.error('Failed to send welcome email:', e));
    }

    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[student.createStudent]', err);
    const msg = err.message || 'Failed to create student';
    return sendError(res, msg, 400);
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    // If password is provided, hash it manually as findByIdAndUpdate bypasses hooks
    if (typeof req.body.password === 'string' && req.body.password.trim()) {
      const bcrypt = await import('bcrypt');
      req.body.password = await bcrypt.hash(req.body.password.trim(), 10);
    } else {
      delete req.body.password;
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('classId');
    if (!updated) return sendError(res, 'Student not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'student_updated',
      `Student Updated: ${updated.firstName} ${updated.lastName}`,
      `Student "${updated.firstName} ${updated.lastName}" has been updated`,
      userId,
      userName,
      updated._id.toString(),
      'student'
    ).catch(() => {});

    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[student.updateStudent]', err);
    const msg = err.message || 'Failed to update student';
    return sendError(res, msg, 400);
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.user?.id).populate('classId');
    if (!student) return sendError(res, 'Student account not found. Please log in again.', 401);
    return sendSuccess(res, student);
  } catch (err) {
    console.error('[student.getMyProfile]', err);
    return sendError(res, 'Failed to fetch profile');
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Prevent sensitive fields from being updated by student
    const forbidden = ['password', 'role', 'classId', 'admissionNumber', 'rollNumber', 'status', 'email', 'userId'];
    const updateData = { ...req.body };
    forbidden.forEach(field => delete updateData[field]);

    const updated = await Student.findByIdAndUpdate(req.user?.id, updateData, {
      new: true,
    }).populate('classId');
    
    if (!updated) return sendError(res, 'Student not found', 404);
    
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[student.updateMyProfile]', err);
    return sendError(res, err.message || 'Failed to update profile', 400);
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Student not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'student_deleted',
      `Student Deleted: ${deleted.firstName} ${deleted.lastName}`,
      `Student "${deleted.firstName} ${deleted.lastName}" has been deleted`,
      userId,
      userName,
      deleted._id.toString(),
      'student'
    ).catch(() => {});

    
    return sendSuccess(res, { message: 'Student deleted' });
  } catch (err) {
    console.error('[student.deleteStudent]', err);
    return sendError(res, 'Failed to delete student');
  }
};

export const getStudentsByClass = async (req: Request, res: Response) => {
  try {
    const students = await Student.find({ classId: req.params.classId }).populate('classId');
    return sendSuccess(res, students);
  } catch (err) {
    console.error('[student.getStudentsByClass]', err);
    return sendError(res, 'Failed to fetch students by class');
  }
};

export const uploadStudentPhoto = async (req: AuthRequest, res: Response) => {
  try {
    console.log(`[student.uploadPhoto] Starting for user: ${req.user?.id}`);

    if (!req.file) {
      console.warn('[student.uploadPhoto] No file provided in request');
      return sendError(res, 'No photo uploaded', 400);
    }

    // Path should be relative to the 'uploads' directory for static serving
    const photoPath = `uploads/profiles/students/${req.file.filename}`;
    console.log(`[student.uploadPhoto] File saved: ${req.file.path}, DB path: ${photoPath}`);
    
    // Update student record
    const updated = await Student.findByIdAndUpdate(
      req.user?.id,
      { studentPhoto: photoPath },
      { new: true }
    );

    if (!updated) {
      console.error(`[student.uploadPhoto] Student not found: ${req.user?.id}`);
      return sendError(res, 'Student profile not found', 404);
    }

    console.log(`[student.uploadPhoto] Successfully updated student: ${updated.email}`);
    return sendSuccess(res, { photoPath, student: updated });
  } catch (err: any) {
    const errorMsg = `Student Photo Controller Error: ${err.message || 'Unknown failure during DB update or file processing'}`;
    console.error(`[student.uploadPhoto] CRITICAL ERROR: ${errorMsg}`, err);
    return sendError(res, errorMsg, 500);
  }
};
