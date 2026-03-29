import { Request, Response } from 'express';
import { Class } from '../models/Class';
import { Student } from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import { logActivity } from '../services/activityService';
import { AuthRequest } from '../middlewares/authMiddleware';

const classRequired = ['name', 'capacity'];

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await Class.find().populate('teacherId');
    return sendSuccess(res, classes);
  } catch (err) {
    console.error('[class.getClasses]', err);
    return sendError(res, 'Failed to fetch classes');
  }
};

export const getClassById = async (req: Request, res: Response) => {
  try {
    const cls = await Class.findById(req.params.id).populate('teacherId');
    if (!cls) return sendError(res, 'Class not found', 404);
    return sendSuccess(res, cls);
  } catch (err) {
    console.error('[class.getClassById]', err);
    return sendError(res, 'Failed to fetch class');
  }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, classRequired);
    if (err) return sendError(res, err, 400);

    const cls = new Class({
      name: req.body.name,
      teacherId: req.body.teacherId || null,
      capacity: req.body.capacity,
      status: req.body.status || 'active',
    });

    const saved = await cls.save();
    const populated = await saved.populate('teacherId');
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || ''; // leave empty if missing
    const userName = authReq.user?.name || 'System';
    // fire-and-forget so failure to log doesn't break request
    logActivity(
      'class_created',
      `New Class Created: ${cls.name}`,
      `Class "${cls.name}" with capacity ${cls.capacity} has been created`,
      userId,
      userName,
      saved._id.toString(),
      'class'
    ).catch(() => {});
    
    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[class.createClass]', err);
    const msg = err.message || 'Failed to create class';
    return sendError(res, msg, 400);
  }
};

export const updateClass = async (req: Request, res: Response) => {
  try {
    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('teacherId');
    if (!updated) return sendError(res, 'Class not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'class_updated',
      `Class Updated: ${updated.name}`,
      `Class "${updated.name}" has been updated`,
      userId,
      userName,
      updated._id.toString(),
      'class'
    ).catch(() => {});
    
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[class.updateClass]', err);
    const msg = err.message || 'Failed to update class';
    return sendError(res, msg, 400);
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Class not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'class_deleted',
      `Class Deleted: ${deleted.name}`,
      `Class "${deleted.name}" has been deleted`,
      userId,
      userName,
      deleted._id.toString(),
      'class'
    ).catch(() => {});
    
    return sendSuccess(res, { message: 'Class deleted' });
  } catch (err) {
    console.error('[class.deleteClass]', err);
    return sendError(res, 'Failed to delete class');
  }
};

export const getClassWithStudents = async (req: Request, res: Response) => {
  try {
    const cls = await Class.findById(req.params.id).populate('teacherId');
    if (!cls) return sendError(res, 'Class not found', 404);

    const students = await Student.find({ classId: req.params.id });
    const payload = {
      ...cls.toObject(),
      students,
      studentCount: students.length,
    };
    return sendSuccess(res, payload);
  } catch (err) {
    console.error('[class.getClassWithStudents]', err);
    return sendError(res, 'Failed to fetch class with students');
  }
};