import { Request, Response } from 'express';
import { Marks } from '../models/Marks';
import { Exam } from '../models/Exam';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';

const marksRequired = ['studentId', 'subjectId', 'classId', 'examType', 'marksObtained', 'maxMarks', 'teacherId'];

export const getMarks = async (req: Request, res: Response) => {
  try {
    const marks = await Marks.find().populate('studentId subjectId classId teacherId');
    return sendSuccess(res, marks);
  } catch (err) {
    console.error('[marks.getMarks]', err);
    return sendError(res, 'Failed to fetch marks');
  }
};

export const getMarksByStudent = async (req: Request, res: Response) => {
  try {
    const marks = await Marks.find({ studentId: req.params.studentId }).populate('subjectId classId teacherId');
    return sendSuccess(res, marks);
  } catch (err) {
    console.error('[marks.getMarksByStudent]', err);
    return sendError(res, 'Failed to fetch student marks');
  }
};

export const getMarksByClass = async (req: Request, res: Response) => {
  try {
    const marks = await Marks.find({ classId: req.params.classId }).populate('studentId subjectId teacherId');
    return sendSuccess(res, marks);
  } catch (err) {
    console.error('[marks.getMarksByClass]', err);
    return sendError(res, 'Failed to fetch class marks');
  }
};

export const createMarksRecord = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, marksRequired);
    if (err) return sendError(res, err, 400);

    const { studentId, subjectId, classId, examType, marksObtained, maxMarks, grade, remarks, teacherId } = req.body;

    const record = new Marks({
      studentId,
      subjectId,
      classId,
      examType,
      marksObtained,
      maxMarks,
      grade,
      remarks,
      teacherId,
    });

    const saved = await record.save();
    const populated = await saved.populate('studentId subjectId classId teacherId');
    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[marks.createMarksRecord]', err);
    const msg = err.message || 'Failed to create marks record';
    return sendError(res, msg, 400);
  }
};

const bulkMarksRequired = ['classId', 'subjectId', 'examType', 'records'];

export const createMarksBulk = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, bulkMarksRequired);
    if (err) return sendError(res, err, 400);

    const { classId, subjectId, examType, records, teacherId: bodyTeacherId } = req.body;
    const teacherId = bodyTeacherId || (req as any).user?.id;
    if (!teacherId) {
      return sendError(res, 'Teacher ID is required', 400);
    }

    // Validate each record
    const docs = records.map((rec: any) => ({
      studentId: rec.studentId,
      subjectId,
      classId,
      examType,
      marksObtained: rec.marksObtained,
      maxMarks: rec.maxMarks,
      grade: rec.grade || '',
      remarks: rec.remarks || '',
      teacherId,
    }));

    const inserted = await Marks.insertMany(docs);
    const populated = await Marks.find({ _id: { $in: inserted.map((i) => i._id) } }).populate('studentId subjectId classId teacherId');
    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[marks.createMarksBulk]', err);
    const msg = err.message || 'Failed to create marks records';
    return sendError(res, msg, 400);
  }
};

export const updateMarksRecord = async (req: Request, res: Response) => {
  try {
    const updated = await Marks.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('studentId subjectId classId teacherId');

    if (!updated) return sendError(res, 'Marks record not found', 404);
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[marks.updateMarksRecord]', err);
    const msg = err.message || 'Failed to update marks record';
    return sendError(res, msg, 400);
  }
};

export const deleteMarksRecord = async (req: Request, res: Response) => {
  try {
    const deleted = await Marks.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Marks record not found', 404);
    return sendSuccess(res, { message: 'Marks record deleted' });
  } catch (err) {
    console.error('[marks.deleteMarksRecord]', err);
    return sendError(res, 'Failed to delete marks record');
  }
};

export const getAverageScore = async (req: Request, res: Response) => {
  try {
    const records = await Marks.find({ studentId: req.params.studentId });
    const average =
      records.length > 0
        ?
            records.reduce((sum, r) => sum + (r.marksObtained / r.maxMarks * 100), 0) / records.length
        :
            0;
    return sendSuccess(res, { average: Math.round(average * 10) / 10 });
  } catch (err) {
    console.error('[marks.getAverageScore]', err);
    return sendError(res, 'Failed to calculate average score');
  }
};

export const getClassPerformance = async (req: Request, res: Response) => {
  try {
    const records = await Marks.find({ classId: req.params.classId }).populate('studentId subjectId');
    return sendSuccess(res, records);
  } catch (err) {
    console.error('[marks.getClassPerformance]', err);
    return sendError(res, 'Failed to fetch class performance');
  }
};


