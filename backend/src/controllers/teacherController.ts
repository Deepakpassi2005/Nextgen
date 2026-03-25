import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Teacher } from '../models/Teacher';
import { Subject } from '../models/Subject';
import { Class } from '../models/Class';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import { logActivity } from '../services/activityService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendTeacherWelcomeEmail } from '../services/emailService';

const teacherRequired = ['name', 'email', 'password'];

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find().populate('subjects classes');
    return sendSuccess(res, teachers);
  } catch (err) {
    console.error('[teacher.getTeachers]', err);
    return sendError(res, 'Failed to fetch teachers');
  }
};

export const getTeacherById = async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('subjects classes');
    if (!teacher) return sendError(res, 'Teacher not found', 404);
    return sendSuccess(res, teacher);
  } catch (err) {
    console.error('[teacher.getTeacherById]', err);
    return sendError(res, 'Failed to fetch teacher');
  }
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, teacherRequired);
    if (err) return sendError(res, err, 400);

    // Hash password is now handled by Teacher model pre-save hook

    // dedupe subjects
    const subjects: string[] = Array.isArray(req.body.subjects)
      ? Array.from(new Set(req.body.subjects))
      : [];

    const teacher = new Teacher({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      subjects,
      classes: Array.isArray(req.body.classes) ? req.body.classes : [],
      status: req.body.status || 'active',
      // optional professional/contact info
      employeeId: req.body.employeeId,
      phoneNumber: req.body.phoneNumber,
      qualification: req.body.qualification,
      experience: req.body.experience,
      joiningDate: req.body.joiningDate,
      dateOfBirth: req.body.dateOfBirth,
      isClassTeacher: req.body.isClassTeacher,
      department: req.body.department,
      address: req.body.address,
      emergencyContact: req.body.emergencyContact,
      alternatePhone: req.body.alternatePhone,
    });

    const saved = await teacher.save();
    const populated = await saved.populate('subjects classes');
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || 'system';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'teacher_created',
      `Teacher Created: ${teacher.name}`,
      `Teacher "${teacher.name}" has been added`,
      userId,
      userName,
      saved._id.toString(),
      'teacher'
    ).catch(() => {});

    // Send Welcome Email
    if (teacher.email) {
      sendTeacherWelcomeEmail(
        teacher.email, 
        teacher.name,
        req.body.password
      ).catch(e => console.error('Failed to send teacher welcome email:', e));
    }
    
    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[teacher.createTeacher]', err);
    const msg = err.message || 'Failed to create teacher';
    return sendError(res, msg, 400);
  }
};

export const updateTeacher = async (req: Request, res: Response) => {
  try {
    // dedupe subjects if present
    if (Array.isArray(req.body.subjects)) {
      req.body.subjects = Array.from(new Set(req.body.subjects));
    }

    // If password is present, model pre-save hook will handle hashing if we save() 
    // BUT findByIdAndUpdate BYPASSES hooks.
    // So we need to either use .save() or handle hashing here for updates.
    // For consistency with the plan, let's keep hashing in update for now or switch to save().
    // Actually, update hooks are available but tricky. 
    // Let's stick to the simplest: if password is changed, hash it if using Update.
    if (typeof req.body.password === 'string') {
      const trimmed = req.body.password.trim();
      if (trimmed && !/^\*+$/.test(trimmed)) {
        const bcrypt = await import('bcrypt');
        req.body.password = await bcrypt.hash(trimmed, 10);
      } else {
        delete req.body.password;
      }
    }

    const updated = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('subjects classes');

    if (!updated) return sendError(res, 'Teacher not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || 'system';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'teacher_updated',
      `Teacher Updated: ${updated.name}`,
      `Teacher "${updated.name}" has been modified`,
      userId,
      userName,
      updated._id.toString(),
      'teacher'
    ).catch(() => {});

    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[teacher.updateTeacher]', err);
    const msg = err.message || 'Failed to update teacher';
    return sendError(res, msg, 400);
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const teacher = await Teacher.findById(teacherId).populate('classes');
    if (!teacher) return sendError(res, 'Teacher not found', 404);

    // Derive subjects from Subject model (source of truth) — the Teacher.subjects[] array
    // is NOT reliably updated when admin assigns a teacher to a subject through the Subjects page.
    const assignedSubjects = await (Subject as any).find({ teacherIds: teacherId }).populate('classId');

    // Sync Teacher.subjects[] to keep it accurate (fire-and-forget)
    const subjectIds = assignedSubjects.map((s: any) => s._id);
    if (JSON.stringify(subjectIds.map(String).sort()) !== JSON.stringify((teacher.subjects || []).map(String).sort())) {
      Teacher.findByIdAndUpdate(teacherId, { subjects: subjectIds }).exec().catch(() => {});
    }

    const result = teacher.toObject() as any;
    result.subjects = assignedSubjects;
    return sendSuccess(res, result);
  } catch (err) {
    console.error('[teacher.getMyProfile]', err);
    return sendError(res, 'Failed to fetch profile');
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Prevent sensitive fields from being updated by teacher themselves
    const updateData = { ...req.body };
    // password, role, status etc should only be updateable by admin or special routes
    // For now keep it simple but protect sensitive ones
    const protectedFields = ['password', 'role', 'status', 'email', 'employeeId', 'joiningDate', 'subjects', 'classes'];
    protectedFields.forEach(field => delete updateData[field]);

    const updated = await Teacher.findByIdAndUpdate(req.user?.id, updateData, {
      new: true,
    }).populate('subjects classes');
    
    if (!updated) return sendError(res, 'Teacher not found', 404);
    
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[teacher.updateMyProfile]', err);
    return sendError(res, err.message || 'Failed to update profile', 400);
  }
};

export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const deleted = await Teacher.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Teacher not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || 'system';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'teacher_deleted',
      `Teacher Deleted: ${deleted.name}`,
      `Teacher "${deleted.name}" has been removed`,
      userId,
      userName,
      deleted._id.toString(),
      'teacher'
    ).catch(() => {});

    
    return sendSuccess(res, { message: 'Teacher deleted' });
  } catch (err) {
    console.error('[teacher.deleteTeacher]', err);
    return sendError(res, 'Failed to delete teacher');
  }
};

export const assignSubjectToTeacher = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) return sendError(res, 'subjectId is required', 400);

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { subjects: subjectId } },
      { new: true }
    ).populate('subjects classes');
    if (!teacher) return sendError(res, 'Teacher not found', 404);
    return sendSuccess(res, teacher);
  } catch (err: any) {
    console.error('[teacher.assignSubjectToTeacher]', err);
    return sendError(res, err.message || 'Failed to assign subject', 400);
  }
};

export const assignClassToTeacher = async (req: Request, res: Response) => {
  try {
    const { classId } = req.body;
    if (!classId) return sendError(res, 'classId is required', 400);

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { classes: classId } },
      { new: true }
    ).populate('subjects classes');
    if (!teacher) return sendError(res, 'Teacher not found', 404);
    return sendSuccess(res, teacher);
  } catch (err: any) {
    console.error('[teacher.assignClassToTeacher]', err);
    return sendError(res, err.message || 'Failed to assign class', 400);
  }
};

export const uploadTeacherPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.file) return sendError(res, 'No photo uploaded', 400);
    const photoPath = `uploads/profiles/teachers/${req.file.filename}`; // Backend serve this via /uploads
    
    // Update the teacher profile in DB
    const authReq = req as AuthRequest;
    await Teacher.findByIdAndUpdate(authReq.user?.id, { profilePhoto: photoPath });

    return sendSuccess(res, { photoPath });
  } catch (err) {
    console.error('[teacher.uploadPhoto]', err);
    return sendError(res, 'Failed to upload photo');
  }
};