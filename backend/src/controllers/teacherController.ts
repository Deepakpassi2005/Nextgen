import { Request, Response } from 'express';
import { Teacher } from '../models/Teacher';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import { logActivity } from '../services/activityService';
import { AuthRequest } from '../middlewares/authMiddleware';

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