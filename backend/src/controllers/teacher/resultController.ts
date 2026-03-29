import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Result } from '../../models/Result';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { sendSuccess, sendError } from '../../utils/response';
import { sendResultNotification, sendResultNotificationEmail } from '../../services/emailService';
import { sendToStudent } from '../../services/pushNotificationService';

export const createResult = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const teacherId = req.user?.id;
    if (!teacherId) return sendError(res, 'Unauthorized', 401);
    
    const result = new Result({
      ...data,
      teacherId
    });
    await result.save();
    return sendSuccess(res, result, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to create result');
  }
};

export const getResultsByTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    let results = await Result.find({ teacherId })
      .populate('studentId', 'firstName lastName rollNumber name')
      .populate('classId', 'name')
      .populate('marks.subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Robust manual fallback for population if needed
    for (let i = 0; i < results.length; i++) {
      const item = results[i] as any;
      
      // Fix Student Name
      if (item.studentId && (typeof item.studentId === 'string' || !item.studentId.firstName)) {
        const student = await Student.findById(typeof item.studentId === 'string' ? item.studentId : item.studentId._id)
          .select('firstName lastName rollNumber name')
          .lean();
        if (student) item.studentId = student;
      }
      
      // Fix Subject Name in marks array
      if (item.marks && Array.isArray(item.marks)) {
        for (let j = 0; j < item.marks.length; j++) {
          const m = item.marks[j];
          if (m.subjectId && (typeof m.subjectId === 'string' || !m.subjectId.name)) {
            const Subject = (Result.db as any).model('Subject');
            const subject = await Subject.findById(typeof m.subjectId === 'string' ? m.subjectId : m.subjectId._id)
              .select('name')
              .lean();
            if (subject) m.subjectId = subject;
          }
        }
      }
    }

    return sendSuccess(res, results);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch results');
  }
};

export const updateResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const updateData = req.body;

    const result = await Result.findOneAndUpdate(
      { _id: id, teacherId }, // Only allow teacher who created it to update
      updateData,
      { new: true }
    );

    if (!result) return sendError(res, 'Result not found or unauthorized', 404);
    return sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to update result');
  }
};

export const deleteResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const result = await Result.findOneAndDelete({ _id: id, teacherId });
    if (!result) return sendError(res, 'Result not found or unauthorized', 404);

    return sendSuccess(res, { message: 'Result deleted successfully' });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to delete result');
  }
};

export const publishResult = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const updated = await Result.findByIdAndUpdate(id, {
      published: true,
      pdfUrl: `/results/${id}.pdf`, // placeholder
    }, { new: true }).populate('studentId', 'firstName lastName rollNumber name userId');

    if (!updated) return sendError(res, 'Result not found', 404);

    // Send notification to parents/guardians
    try {
      const student = await Student.findById(updated.studentId).populate('userId', 'email');
      if (!student) {
        console.error('Student not found for result notification');
      } else {
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
            await sendResultNotification(target.phone, (student as any).name, updated.examType, updated.grade);
          }
          if (target.email) {
            await sendResultNotificationEmail(target.email, (student as any).name, updated.examType, updated.grade);
          }
        }

        // Also send to student email
        if (student.userId && (student.userId as any).email) {
          await sendResultNotificationEmail((student.userId as any).email, (student as any).name, updated.examType, updated.grade);
        }

        // Send Push Notification
        sendToStudent(student._id.toString(), {
          title: 'Exam Result Published',
          body: `Your result for ${updated.examType} is ready. Grade: ${updated.grade}`,
          data: { screen: 'StudentResult', id: updated._id.toString() }
        }).catch(e => console.error('Failed to send result push:', e));
      }
    } catch (notificationError) {
      console.error('Failed to send result notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return sendSuccess(res, updated);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to publish result');
  }
};
