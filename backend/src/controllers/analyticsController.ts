import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Class } from '../models/Class';
import { Notice } from '../models/Notice';
import { Attendance } from '../models/Attendance';
import { TeacherAttendance } from '../models/TeacherAttendance';
import { PunchLog } from '../models/PunchLog';
import { Marks } from '../models/Marks';
import { sendSuccess, sendError } from '../utils/response';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const [totalStudents, totalTeachers, totalClasses, totalNotices] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Notice.countDocuments(),
    ]);

    // Calculate overall attendance rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceRecords = await Attendance.find({ date: { $gte: thirtyDaysAgo } });
    let totalPresent = 0;
    let totalPossible = 0;
    
    attendanceRecords.forEach(record => {
      record.students.forEach(s => {
        totalPossible++;
        if (s.status === 'present') totalPresent++;
      });
    });
    
    const studentAttendanceRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 100;

    // Calculate teacher attendance rate (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const teacherAttendanceRecords = await TeacherAttendance.find({ date: { $gte: sevenDaysAgo } });
    
    let tPresent = 0;
    let tTotal = teacherAttendanceRecords.length;
    teacherAttendanceRecords.forEach(r => {
      if (r.status === 'present' || r.status === 'late') tPresent++;
    });
    
    const teacherAttendanceRate = tTotal > 0 ? Math.round((tPresent / tTotal) * 100) : 100;

    // Calculate average performance
    const allMarks = await Marks.find();
    const avgPerformance =
      allMarks.length > 0
        ? Math.round(allMarks.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks * 100), 0) / allMarks.length)
        : 0;

    // Fetch actual recent activities
    const activities = await PunchLog.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('teacherId', 'name');
      
    const formattedActivities = activities.map(act => ({
      id: act._id,
      type: 'teacher',
      description: `${(act.teacherId as any)?.name || 'Teacher'} punched ${(act as any).type || 'in'}`,
      time: new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: 'calendar',
      color: 'text-blue-500',
    }));

    return sendSuccess(res, {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalNotices,
      studentAttendancePercentage: studentAttendanceRate,
      teacherAttendancePercentage: teacherAttendanceRate,
      avgPerformance,
      activities: formattedActivities.length > 0 ? formattedActivities : [
        {
          id: 1,
          type: 'student',
          description: 'System healthy',
          time: 'Just now',
          icon: 'users',
          color: 'text-blue-500',
        }
      ],
    });
  } catch (err) {
    console.error('[analytics.getDashboardSummary]', err);
    return sendError(res, 'Failed to fetch dashboard summary');
  }
};

export const getPerformanceByClass = async (req: Request, res: Response) => {
  try {
    const classes = await Class.find();
    const performanceData = await Promise.all(
      classes.map(async (cls) => {
        const marks = await Marks.find({ classId: cls._id });
        const avgScore =
          marks.length > 0
            ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks * 100), 0) / marks.length)
            : 0;
        return { name: cls.name, score: avgScore };
      })
    );
    return sendSuccess(res, performanceData);
  } catch (err) {
    console.error('[analytics.getPerformanceByClass]', err);
    return sendError(res, 'Failed to fetch performance data');
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const analyticsType = req.query.type as string;

    if (analyticsType === 'teacher') {
      const teacherId = req.query.teacherId as string;
      if (!teacherId) return sendError(res, 'Teacher ID required', 400);

      const teacher = await Teacher.findById(teacherId);
      if (!teacher) return sendError(res, 'Teacher not found', 404);

      // Build a 30-day attendance trend for this teacher based on TeacherAttendance
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);

      const logs = await TeacherAttendance.find({
        teacherId,
        date: { $gte: startDate, $lte: endDate },
      });

      const dateMap: Record<string, { attended: boolean; total: number }> = {};
      for (let i = 0; i < 30; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        const key = day.toLocaleDateString();
        dateMap[key] = { attended: false, total: 1 };
      }

      logs.forEach((log) => {
        const key = new Date(log.date).toLocaleDateString();
        if (dateMap[key]) {
          dateMap[key].attended = log.status === 'present' || log.status === 'late';
        }
      });

      const attendanceTrend = Object.entries(dateMap).map(([date, { attended }]) => ({
        date,
        attendance: attended ? 100 : 0,
      })).slice(-10);

      const attendedCount = logs.filter(l => l.status === 'present' || l.status === 'late').length;
      const totalPossible = logs.length;
      const teacherAttendancePercent = totalPossible > 0 ? Math.round((attendedCount / totalPossible) * 100) : 0;

      return sendSuccess(res, {
        teacher: { id: teacher._id, name: teacher.name },
        attendance: teacherAttendancePercent,
        monthlyAttendancePercent: teacherAttendancePercent,
        classesCount: teacher.classes?.length || 0,
        subjectsCount: teacher.subjects?.length || 0,
        attendanceTrend,
        performanceData: [],
      });
    }

    if (analyticsType === 'student') {
      const studentId = req.query.studentId as string;
      if (!studentId) return sendError(res, 'Student ID required', 400);

      const student = await Student.findById(studentId);
      if (!student) return sendError(res, 'Student not found', 404);

      const studentMarks = await Marks.find({ studentId }).populate('subjectId');
      const avgPercentage =
        studentMarks.length > 0
          ? Math.round(
              studentMarks.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks * 100), 0) / studentMarks.length
            )
          : 0;

      // Build a 30-day attendance trend for this student
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);

      const attendances = await Attendance.find({
        date: { $gte: startDate, $lte: endDate },
        'students.studentId': studentId,
      });

      const dateMap: Record<string, { present: number; total: number }> = {};
      for (let i = 0; i < 30; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        const key = day.toLocaleDateString();
        dateMap[key] = { present: 0, total: 0 };
      }

      attendances.forEach((att) => {
        const key = new Date(att.date).toLocaleDateString();
        const studentRecord = (att.students || []).find((s: any) =>
          (s.studentId?._id || s.studentId).toString() === studentId
        );
        if (!studentRecord) return;
        dateMap[key].total += 1;
        if (studentRecord.status === 'present') dateMap[key].present += 1;
      });

      const attendanceTrend = Object.entries(dateMap).map(([date, { present, total }]) => ({
        date,
        attendance: total > 0 ? (present > 0 ? 100 : 0) : 0,
      })).slice(-10); // Return last 10 days for cleaner chart

      const totalPossible = attendances.length;
      const totalPresent = attendances.filter(att => 
        att.students.find(s => (s.studentId?._id || s.studentId).toString() === studentId)?.status === 'present'
      ).length;
      
      const studentAttendancePercent = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

      return sendSuccess(res, {
        student: { id: student._id, name: `${student.firstName} ${student.lastName}`, rollNumber: student.rollNumber },
        attendance: studentAttendancePercent,
        averagePercentage: avgPercentage,
        subjectPerformance: studentMarks.slice(0, 5).map((m) => ({
          subjectId: (m.subjectId as any)?.name || 'Subject',
          percentage: Math.round((m.marksObtained / m.maxMarks) * 100),
        })),
        attendanceTrend,
      });
    }

    return sendError(res, 'Invalid analytics type', 400);
  } catch (err) {
    console.error('[analytics.getAnalytics]', err);
    return sendError(res, 'Failed to fetch analytics');
  }
};

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    // Comprehensive dashboard analytics
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();

    // Attendance analytics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const attendanceRecords = await Attendance.find({ date: { $gte: last30Days } });
    const totalAttendanceEntries = attendanceRecords.reduce((sum, att) => sum + att.students.length, 0);
    const presentCount = attendanceRecords.reduce((sum, att) =>
      sum + att.students.filter(s => s.status === 'present').length, 0);
    const attendanceRate = totalAttendanceEntries > 0 ? (presentCount / totalAttendanceEntries * 100) : 0;

    // Performance analytics
    const marksRecords = await Marks.find();
    const avgPerformance = marksRecords.length > 0 ?
      marksRecords.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks * 100), 0) / marksRecords.length : 0;

    // Class-wise performance
    const classPerformance = await Class.aggregate([
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'classId',
          as: 'marks'
        }
      },
      {
        $project: {
          name: 1,
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$marks' }, 0] },
              then: {
                $divide: [
                  { $sum: '$marks.percentage' },
                  { $size: '$marks' }
                ]
              },
              else: 0
            }
          }
        }
      }
    ]);

    return sendSuccess(res, {
      overview: {
        totalStudents,
        totalTeachers,
        totalClasses,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        avgPerformance: Math.round(avgPerformance * 10) / 10
      },
      classPerformance,
      attendanceTrend: [], // Would need more complex aggregation
      performanceTrend: [] // Would need more complex aggregation
    });
  } catch (err) {
    console.error('[analytics.getDashboardAnalytics]', err);
    return sendError(res, 'Failed to fetch dashboard analytics');
  }
};

export const getClassPerformanceAnalytics = async (req: Request, res: Response) => {
  try {
    const classPerformance = await Class.aggregate([
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'classId',
          as: 'marks'
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'classId',
          as: 'students'
        }
      },
      {
        $project: {
          name: 1,
          studentCount: { $size: '$students' },
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$marks' }, 0] },
              then: {
                $avg: {
                  $map: {
                    input: '$marks',
                    as: 'mark',
                    in: { $divide: ['$$mark.marksObtained', '$$mark.maxMarks'] }
                  }
                }
              },
              else: 0
            }
          }
        }
      }
    ]);

    return sendSuccess(res, classPerformance);
  } catch (err) {
    console.error('[analytics.getClassPerformanceAnalytics]', err);
    return sendError(res, 'Failed to fetch class performance analytics');
  }
};

export const getStudentProgressAnalytics = async (req: Request, res: Response) => {
  try {
    const studentProgress = await Student.aggregate([
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'studentId',
          as: 'marks'
        }
      },
      {
        $lookup: {
          from: 'attendance',
          let: { studentId: '$_id' },
          pipeline: [
            { $unwind: '$students' },
            { $match: { $expr: { $eq: ['$students.studentId', '$$studentId'] } } }
          ],
          as: 'attendance'
        }
      },
      {
        $project: {
          name: { $concat: ['$firstName', ' ', '$lastName'] },
          rollNumber: 1,
          averageMarks: {
            $cond: {
              if: { $gt: [{ $size: '$marks' }, 0] },
              then: { $avg: '$marks.percentage' },
              else: 0
            }
          },
          attendanceRate: {
            $cond: {
              if: { $gt: [{ $size: '$attendance' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$attendance',
                            as: 'att',
                            cond: { $eq: ['$$att.students.status', 'present'] }
                          }
                        }
                      },
                      { $size: '$attendance' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      }
    ]);

    return sendSuccess(res, studentProgress);
  } catch (err) {
    console.error('[analytics.getStudentProgressAnalytics]', err);
    return sendError(res, 'Failed to fetch student progress analytics');
  }
};

export const getAttendanceTrends = async (req: Request, res: Response) => {
  try {
    const { classId, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const matchStage: any = { date: { $gte: startDate } };
    if (classId) matchStage.classId = classId;

    const attendanceTrends = await Attendance.aggregate([
      { $match: matchStage },
      { $unwind: '$students' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$students.status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          present: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'present'] }, '$count', 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'absent'] }, '$count', 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'late'] }, '$count', 0] }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $project: {
          date: '$_id',
          present: 1,
          absent: 1,
          late: 1,
          total: 1,
          attendanceRate: {
            $multiply: [{ $divide: ['$present', '$total'] }, 100]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    return sendSuccess(res, attendanceTrends);
  } catch (err) {
    console.error('[analytics.getAttendanceTrends]', err);
    return sendError(res, 'Failed to fetch attendance trends');
  }
};

export const getClassAttendanceAnalytics = async (req: Request, res: Response) => {
  try {
    const { classId } = req.query;
    if (!classId) return sendError(res, 'classId is required', 400);

    const students = await Student.find({ classId });
    const attendanceRecords = await Attendance.find({ classId });

    const report = students.map(student => {
      const studentId = student._id.toString();
      let presentDays = 0;
      let totalDays = attendanceRecords.length;

      attendanceRecords.forEach(record => {
        const studentStat = record.students.find(s => 
          (s.studentId?._id || s.studentId).toString() === studentId
        );
        if (studentStat && studentStat.status === 'present') {
          presentDays++;
        }
      });

      return {
        id: studentId,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        presentDays,
        totalDays,
        percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
      };
    });

    return sendSuccess(res, report);
  } catch (err) {
    console.error('[analytics.getClassAttendanceAnalytics]', err);
    return sendError(res, 'Failed to fetch class attendance analytics');
  }
};
