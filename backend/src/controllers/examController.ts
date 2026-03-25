import { Request, Response } from 'express';
import { Exam } from '../models/Exam';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';

const examRequired = ['name', 'examType', 'classId', 'subjects', 'examDate', 'totalMarks'];

export const getExams = async (req: Request, res: Response) => {
  try {
    const exams = await Exam.find().populate('classId subjects');
    return sendSuccess(res, exams);
  } catch (err) {
    console.error('[exam.getExams]', err);
    return sendError(res, 'Failed to fetch exams');
  }
};

export const getExamById = async (req: Request, res: Response) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('classId subjects');
    if (!exam) return sendError(res, 'Exam not found', 404);
    return sendSuccess(res, exam);
  } catch (err) {
    console.error('[exam.getExamById]', err);
    return sendError(res, 'Failed to fetch exam');
  }
};

export const getExamsByClass = async (req: Request, res: Response) => {
  try {
    const exams = await Exam.find({ classId: req.params.classId }).populate('subjects');
    return sendSuccess(res, exams);
  } catch (err) {
    console.error('[exam.getExamsByClass]', err);
    return sendError(res, 'Failed to fetch class exams');
  }
};

export const createExam = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, examRequired);
    if (err) return sendError(res, err, 400);

    const { name, examType, classId, subjects, examDate, totalMarks, duration, instructions } = req.body;

    const exam = new Exam({
      name,
      examType,
      classId,
      subjects,
      examDate: new Date(examDate),
      totalMarks,
      duration,
      instructions,
    });

    const saved = await exam.save();
    const populated = await saved.populate('classId subjects');
    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[exam.createExam]', err);
    const msg = err.message || 'Failed to create exam';
    return sendError(res, msg, 400);
  }
};

export const updateExam = async (req: Request, res: Response) => {
  try {
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('classId subjects');

    if (!updated) return sendError(res, 'Exam not found', 404);
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[exam.updateExam]', err);
    const msg = err.message || 'Failed to update exam';
    return sendError(res, msg, 400);
  }
};

export const deleteExam = async (req: Request, res: Response) => {
  try {
    const deleted = await Exam.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Exam not found', 404);
    return sendSuccess(res, { message: 'Exam deleted' });
  } catch (err) {
    console.error('[exam.deleteExam]', err);
    return sendError(res, 'Failed to delete exam');
  }
};