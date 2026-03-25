import { Request, Response } from 'express';
import { Assignment } from '../../models/Assignment';
import { AssignmentSubmission } from '../../models/AssignmentSubmission';
import { Student } from '../../models/Student';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authMiddleware';
import mongoose from 'mongoose';

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const studentId = authReq.user!.id;

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const assignments = await Assignment.find({ classId: student.classId })
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ dueDate: 1 });

    const submissions = await AssignmentSubmission.find({ studentId: student._id });

    const assignmentsWithStatus = assignments.map((assignment: any) => {
      const submission = submissions.find(s => s.assignmentId.toString() === assignment._id.toString());
      const assignmentObj = assignment.toObject();
      if (submission) {
        return {
          ...assignmentObj,
          status: 'submitted',
          grade: submission.grade,
          feedback: submission.feedback,
          submissionId: submission._id
        };
      }
      return {
        ...assignmentObj,
        status: new Date(assignment.dueDate) < new Date() ? 'overdue' : 'pending'
      };
    });

    return sendSuccess(res, assignmentsWithStatus);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return sendError(res, 'Failed to fetch assignments');
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const studentId = authReq.user!.id;
    const { assignmentId, content } = req.body;
    console.log('[AssignmentSubmit] Body:', req.body);
    console.log('[AssignmentSubmit] Files:', (req as any).files);

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({ assignmentId, studentId: student._id });
    if (existingSubmission) return sendError(res, 'Assignment already submitted', 400);

    const submission = new AssignmentSubmission({
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
      studentId: student._id,
      content,
      attachments: (req as any).files?.map((file: any) => ({
        filename: file.originalname,
        url: `uploads/assignment-submissions/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      })) || [],
    });

    await submission.save();
    return sendSuccess(res, submission);
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return sendError(res, 'Failed to submit assignment');
  }
};

export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const studentId = authReq.user!.id;

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const submissions = await AssignmentSubmission.find({ studentId: student._id })
      .populate({
        path: 'assignmentId',
        populate: { path: 'subjectId', select: 'name' }
      })
      .sort({ submittedAt: -1 });

    return sendSuccess(res, submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return sendError(res, 'Failed to fetch submissions');
  }
};