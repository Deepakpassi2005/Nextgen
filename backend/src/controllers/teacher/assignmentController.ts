import { Request, Response } from 'express';
import { Assignment } from '../../models/Assignment';
import { AssignmentSubmission } from '../../models/AssignmentSubmission';
import { Student } from '../../models/Student';
import { Subject } from '../../models/Subject';
import { Teacher } from '../../models/Teacher';
import { sendAssignmentNotification } from '../../services/emailService';
import { sendToClass } from '../../services/pushNotificationService';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authMiddleware';
import mongoose from 'mongoose';

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const teacherId = authReq.user!.id;

    const { title, description, classId, subjectId, dueDate } = req.body;

    const assignment = new Assignment({
      title,
      description,
      classId: new mongoose.Types.ObjectId(classId),
      subjectId: new mongoose.Types.ObjectId(subjectId),
      teacherId,
      dueDate: new Date(dueDate),
      attachments: (req as any).files?.map((file: any) => ({
        filename: file.originalname,
        url: `uploads/assignment-submissions/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      })) || [],
    });

    await assignment.save();
    
    // Background email notifications
    (async () => {
      try {
        const students = await Student.find({ classId, status: 'active', email: { $exists: true, $ne: '' } });
        if (students.length > 0) {
          const teacher = await Teacher.findById(teacherId);
          const subject = await Subject.findById(subjectId);
          
          const teacherName = teacher ? teacher.name : 'Your Teacher';
          const subjectName = subject ? subject.name : 'a subject';
          
          for (const student of students) {
            if (student.email) {
              await sendAssignmentNotification(
                student.email,
                student.firstName,
                teacherName,
                subjectName,
                assignment.title,
                assignment.dueDate
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to send assignment notifications in background:', err);
      }
    })();

    // Send Push Notification
    sendToClass(classId, {
      title: 'New Assignment Posted',
      body: `${assignment.title} for ${subjectId}`, // subject context would be better if populated
      data: { screen: 'AssignmentListMain', id: assignment._id.toString() }
    }).catch(e => console.error('Failed to send assignment push:', e));

    return sendSuccess(res, assignment, 201);
  } catch (error) {
    console.error('Error creating assignment:', error);
    return sendError(res, 'Failed to create assignment');
  }
};

export const getAssignmentsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const assignments = await Assignment.find({ classId }).populate('subjectId', 'name').sort({ createdAt: -1 });
    return sendSuccess(res, assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return sendError(res, 'Failed to fetch assignments');
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }
    if (updates.classId) {
      updates.classId = new mongoose.Types.ObjectId(updates.classId);
    }
    if (updates.subjectId) {
      updates.subjectId = new mongoose.Types.ObjectId(updates.subjectId);
    }
    const assignment = await Assignment.findByIdAndUpdate(id, updates, { new: true });
    if (!assignment) return sendError(res, 'Assignment not found', 404);
    return sendSuccess(res, assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    return sendError(res, 'Failed to update assignment');
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) return sendError(res, 'Assignment not found', 404);
    return sendSuccess(res, { message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return sendError(res, 'Failed to delete assignment');
  }
};

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate('studentId', 'firstName lastName name rollNumber')
      .sort({ submittedAt: -1 });
    return sendSuccess(res, submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return sendError(res, 'Failed to fetch submissions');
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { grade, feedback } = req.body;

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      id,
      {
        grade: parseFloat(grade),
        feedback,
        gradedAt: new Date(),
        gradedBy: authReq.user!.id,
      },
      { new: true }
    ).populate('studentId', 'firstName lastName name');

    if (!submission) return sendError(res, 'Submission not found', 404);
    return sendSuccess(res, submission);
  } catch (error) {
    console.error('Error grading submission:', error);
    return sendError(res, 'Failed to grade submission');
  }
};