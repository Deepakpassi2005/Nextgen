import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Attendance } from '../../models/Attendance';
import { Student } from '../../models/Student';
import { sendSuccess, sendError } from '../../utils/response';
import { sendAttendanceNotification, sendAttendanceAlert } from '../../services/emailService';
import { sendToStudent } from '../../services/pushNotificationService';

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, date, students } = req.body;
    if (!classId || !date || !Array.isArray(students)) {
      return sendError(res, 'classId, date and students array required', 400);
    }
    // prevent duplicate per class+date
    const existing = await Attendance.findOne({ classId, date });
    if (existing) {
      return sendError(res, 'Attendance already marked for this date', 409);
    }
    const teacherId = req.user?.id;
    const record = new Attendance({ classId, date, students, teacherId });
    await record.save();

    // Send notifications to parents/guardians
    try {
      for (const studentAttendance of students) {
        const student = await Student.findById(studentAttendance.studentId).populate('userId', 'email');
        if (!student) continue;

        const notificationTargets = [];

        // Collect all guardian contacts
        if (student.guardians && Array.isArray(student.guardians)) {
          student.guardians.forEach((guardian: any) => {
            if (guardian.contactNumber) {
              notificationTargets.push({
                phone: guardian.contactNumber,
                email: guardian.email,
                name: guardian.name,
              });
            }
          });
        }

        // Also include single parent numbers if set
        if (student.parentMobileNumber && !notificationTargets.some(t => t.phone === student.parentMobileNumber)) {
          notificationTargets.push({
            phone: student.parentMobileNumber,
            email: '',
            name: 'Parent',
          });
        }

        if (student.motherMobileNumber && !notificationTargets.some(t => t.phone === student.motherMobileNumber)) {
          notificationTargets.push({
            phone: student.motherMobileNumber,
            email: '',
            name: 'Mother',
          });
        }

        // Send notifications to all guardians
        for (const target of notificationTargets) {
          if (target.phone) {
            await sendAttendanceNotification(target.phone, (student as any).name, date, studentAttendance.status);
          }
          if (target.email) {
            await sendAttendanceAlert(target.email, (student as any).name, date, studentAttendance.status);
          }
        }

        // Also send to student email
        if (student?.userId && (student.userId as any).email) {
          await sendAttendanceAlert((student.userId as any).email, (student as any).name, date, studentAttendance.status);
        }

        // Send Push Notification
        sendToStudent(student._id.toString(), {
          title: 'Attendance Marked',
          body: `You have been marked ${studentAttendance.status} for ${new Date(date).toLocaleDateString()}`,
          data: { screen: 'StudentHome' }
        }).catch(e => console.error('Failed to send attendance push:', e));
      }
    } catch (notificationError) {
      console.error('Failed to send attendance notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return sendSuccess(res, record, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to mark attendance');
  }
};

export const getAttendanceByClass = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const list = await Attendance.find({ classId });
    return sendSuccess(res, list);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch attendance');
  }
};
