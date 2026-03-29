import { Request, Response } from 'express';
import { Timetable } from '../models/Timetable';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';

const slotRequired = ['classId', 'day', 'timeSlot', 'subjectId', 'teacherId'];

export const getTimetableSlots = async (req: Request, res: Response) => {
  try {
    const slots = await Timetable.find().populate('classId subjectId teacherId');
    return sendSuccess(res, slots);
  } catch (err) {
    console.error('[timetable.getTimetableSlots]', err);
    return sendError(res, 'Failed to fetch timetable');
  }
};

export const getTimetableByClass = async (req: Request, res: Response) => {
  try {
    const slots = await Timetable.find({ classId: req.params.classId })
      .populate('classId subjectId teacherId')
      .sort({ day: 1, timeSlot: 1 });
    return sendSuccess(res, slots);
  } catch (err) {
    console.error('[timetable.getTimetableByClass]', err);
    return sendError(res, 'Failed to fetch timetable for class');
  }
};

export const createTimetableSlot = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, slotRequired);
    if (err) return sendError(res, err, 400);

    const slot = new Timetable({
      classId: req.body.classId,
      day: req.body.day,
      timeSlot: req.body.timeSlot,
      subjectId: req.body.subjectId,
      teacherId: req.body.teacherId,
    });
    const saved = await slot.save();
    const populated = await saved.populate('classId subjectId teacherId');
    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[timetable.createTimetableSlot]', err);
    const msg = err.message || 'Failed to create timetable slot';
    return sendError(res, msg, 400);
  }
};

export const updateTimetableSlot = async (req: Request, res: Response) => {
  try {
    const updated = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('classId subjectId teacherId');
    if (!updated) return sendError(res, 'Timetable slot not found', 404);
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[timetable.updateTimetableSlot]', err);
    const msg = err.message || 'Failed to update timetable slot';
    return sendError(res, msg, 400);
  }
};

export const deleteTimetableSlot = async (req: Request, res: Response) => {
  try {
    const deleted = await Timetable.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Timetable slot not found', 404);
    return sendSuccess(res, { message: 'Timetable slot deleted' });
  } catch (err) {
    console.error('[timetable.deleteTimetableSlot]', err);
    return sendError(res, 'Failed to delete timetable slot');
  }
};
