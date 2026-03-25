import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Timetable } from '../../models/Timetable';
import { Notice } from '../../models/Notice';
import { Attendance } from '../../models/Attendance';
import { Quiz } from '../../models/Quiz';
import { Result } from '../../models/Result';
import { Student } from '../../models/Student';
import { Assignment } from '../../models/Assignment';
import { StudyMaterial } from '../../models/StudyMaterial';
import { sendSuccess, sendError } from '../../utils/response';
import mongoose from 'mongoose';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const student = await Student.findById(userId);
    
    if (!student) {
      return sendError(res, 'Student account not found. Please log in again.', 401);
    }

    const classId = student.classId;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run queries in parallel for better performance
    const [todaysTimetable, notices, attendanceRecords, pendingQuizzes, latestResult, latestAssignment, latestStudyMaterial] = await Promise.all([
      Timetable.find({ classId, day: currentDay })
        .populate('subjectId', 'name')
        .populate('teacherId', 'name')
        .sort({ timeSlot: 1 }),
      
      Notice.find({ 
        $or: [{ classId }, { target: 'all' }, { target: 'students' }]
      }).sort({ createdAt: -1 }).limit(10),
      
      Attendance.find({ classId, 'students.studentId': student._id }),
      
      Quiz.find({ classId, dueDate: { $gte: today } }),
      
      Result.findOne({ studentId: student._id }).sort({ createdAt: -1 }),
      
      Assignment.findOne({ classId: student.classId }).sort({ createdAt: -1 }).select('_id createdAt'),
      
      StudyMaterial.findOne({ classId: student.classId }).sort({ createdAt: -1 }).select('_id createdAt')
    ]);
    
    let total = 0, present = 0;
    attendanceRecords.forEach((rec) => {
      const studentRecord = rec.students.find(s => s.studentId.toString() === student._id.toString());
      if (studentRecord) {
        total++;
        if (studentRecord.status === 'present') present++;
      }
    });
    
    const attendancePct = total ? (present / total) * 100 : 0;

    return sendSuccess(res, {
      todaysTimetable,
      notices,
      attendancePercent: attendancePct || student.attendance || 0,
      pendingQuizzes,
      latestResult,
      latestAssignment,
      latestStudyMaterial,
      studentName: student.firstName + ' ' + (student.lastName || ''),
      studentPhoto: student.studentPhoto,
      averageScore: student.averageScore || 0,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to load dashboard');
  }
};
