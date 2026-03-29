import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Timetable } from '../../models/Timetable';
import { Student } from '../../models/Student';
import { sendSuccess, sendError } from '../../utils/response';

export const getMyTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const student = await Student.findById(userId);

    if (!student) {
      return sendError(res, 'Student profile not found', 404);
    }

    const classId = student.classId;
    const slots = await Timetable.find({ classId })
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ timeSlot: 1 });

    return sendSuccess(res, {
      slots,
      studentName: student.firstName + ' ' + (student.lastName || ''),
      className: 'Class ' + student.rollNumber, // Fallback if name not populated
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch timetable');
  }
};
