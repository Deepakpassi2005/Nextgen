import { Request, Response } from 'express';
import { Timetable } from '../../models/Timetable';
import { Notice } from '../../models/Notice';
import { Attendance } from '../../models/Attendance';
import { Quiz } from '../../models/Quiz';
import { Assignment } from '../../models/Assignment';
import { AssignmentSubmission } from '../../models/AssignmentSubmission';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authMiddleware';
import mongoose from 'mongoose';

import { Teacher } from '../../models/Teacher';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const teacherId = new mongoose.Types.ObjectId(authReq.user!.id);
    
    // Fetch teacher to get profile photo and other details
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return sendError(res, 'Teacher account not found. Please log in again.', 401);
    }

    const teacherName = teacher.name || authReq.user!.name || 'Teacher';
    const profilePhoto = teacher.profilePhoto;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    const todaysTimetable = await Timetable.find({
      teacherId,
      day: currentDay,
    }).populate('classId', 'name')
      .populate('subjectId', 'name')
      .sort({ timeSlot: 1 });

    const importantNotices = await Notice.find({ important: true }).limit(5);

    const classesToday = todaysTimetable.length;

    // monthly attendance % for all classes teacher takes
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const attendanceRecords = await Attendance.find({
      teacherId,
      date: { $gte: monthAgo },
    });
    let total = 0,
      present = 0;
    attendanceRecords.forEach((rec) => {
      if (rec && Array.isArray(rec.students)) {
        rec.students.forEach((s) => {
          total++;
          if (s.status === 'present') present++;
        });
      }
    });
    const monthlyPct = total ? (present / total) * 100 : 0;

    const pendingQuizzes = await Quiz.find({ teacherId, dueDate: { $gte: today } });

    // Latest notice for teacher (important or targeted)
    const latestNotice = await Notice.findOne({ $or: [{ important: true }, { target: 'teachers' }, { target: 'all' }] })
      .sort({ createdAt: -1 }).select('_id createdAt');

    // Latest submission for any assignment created by this teacher
    const teacherAssignments = await Assignment.find({ teacherId }).select('_id');
    const assignmentIds = teacherAssignments.map(a => a._id);
    const latestSubmission = await AssignmentSubmission.findOne({ assignmentId: { $in: assignmentIds } })
      .sort({ createdAt: -1 }).select('_id createdAt');

    return sendSuccess(res, {
      todaysTimetable,
      importantNotices,
      classesToday,
      monthlyAttendancePercent: monthlyPct,
      pendingQuizzes,
      latestNotice,
      latestSubmission,
      teacherName,
      profilePhoto,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to load dashboard');
  }
};
