import { Request, Response } from 'express';
import { Subject } from '../models/Subject';
import { Class } from '../models/Class';
import { Teacher } from '../models/Teacher';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import { logActivity } from '../services/activityService';

const subjectRequired = ['name', 'code', 'classId'];

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.classId) filter.classId = req.query.classId;
    const subjects = await Subject.find(filter).populate('classId teacherIds');
    return sendSuccess(res, subjects);
  } catch (err) {
    console.error('[subject.getSubjects]', err);
    return sendError(res, 'Failed to fetch subjects');
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('classId teacherIds');
    if (!subject) return sendError(res, 'Subject not found', 404);
    return sendSuccess(res, subject);
  } catch (err) {
    console.error('[subject.getSubjectById]', err);
    return sendError(res, 'Failed to fetch subject');
  }
};

const syncTeacherSubjects = async (subjectId: string, newTeacherIds: string[], previousTeacherIds: string[] = []) => {
  // Add subject to new teachers
  if (newTeacherIds.length > 0) {
    await Teacher.updateMany(
      { _id: { $in: newTeacherIds } },
      { $addToSet: { subjects: subjectId } }
    );
  }
  // Remove subject from teachers who were removed
  const removedTeachers = previousTeacherIds.filter(id => !newTeacherIds.includes(id));
  if (removedTeachers.length > 0) {
    await Teacher.updateMany(
      { _id: { $in: removedTeachers } },
      { $pull: { subjects: subjectId } }
    );
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, subjectRequired);
    if (err) return sendError(res, err, 400);

    const teacherIds = Array.isArray(req.body.teacherIds) ? req.body.teacherIds : [];
    const uniqueTeacherIds = Array.from(new Set(teacherIds.map(String))) as string[];

    const subject = new Subject({
      name: req.body.name,
      code: req.body.code,
      classId: req.body.classId,
      teacherIds: uniqueTeacherIds,
      status: req.body.status || 'active',
    });

    const saved = await subject.save();
    const populated = await Subject.findById(saved._id).populate('classId teacherIds');

    // Sync Teacher.subjects[] bidirectionally
    syncTeacherSubjects(saved._id.toString(), uniqueTeacherIds).catch(() => {});

    // log activity (non-blocking)
    const authReq = req as any;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'subject_created',
      `Subject Created: ${subject.name}`,
      `Subject "${subject.name}" added to class`,
      userId,
      userName,
      saved._id.toString(),
      'subject'
    ).catch(() => {});

    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[subject.createSubject]', err);
    const msg = err.message || 'Failed to create subject';
    return sendError(res, msg, 400);
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    // Get the old subject first to detect teacher assignment changes
    const oldSubject = await Subject.findById(req.params.id);
    if (!oldSubject) return sendError(res, 'Subject not found', 404);

    let newTeacherIds: string[] = (oldSubject.teacherIds || []).map(String);
    if (req.body.teacherIds && Array.isArray(req.body.teacherIds)) {
      newTeacherIds = Array.from(new Set(req.body.teacherIds.map(String))) as string[];
      req.body.teacherIds = newTeacherIds;
    }

    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('classId teacherIds');
    if (!updated) return sendError(res, 'Subject not found', 404);

    // Sync Teacher.subjects[] bidirectionally
    const previousTeacherIds = (oldSubject.teacherIds || []).map(String);
    syncTeacherSubjects(String(req.params.id), newTeacherIds, previousTeacherIds).catch(() => {});

    // log update
    const authReq = req as any;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'subject_updated',
      `Subject Updated: ${updated.name}`,
      `Subject "${updated.name}" was modified`,
      userId,
      userName,
      updated._id.toString(),
      'subject'
    ).catch(() => {});

    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[subject.updateSubject]', err);
    const msg = err.message || 'Failed to update subject';
    return sendError(res, msg, 400);
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Subject not found', 404);

    // log deletion
    const authReq = req as any;
    const userId = authReq.user?.id || '';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'subject_deleted',
      `Subject Deleted: ${deleted.name}`,
      `Subject "${deleted.name}" has been removed`,
      userId,
      userName,
      deleted._id.toString(),
      'subject'
    ).catch(() => {});

    return sendSuccess(res, { message: 'Subject deleted' });
  } catch (err) {
    console.error('[subject.deleteSubject]', err);
    return sendError(res, 'Failed to delete subject');
  }
};

