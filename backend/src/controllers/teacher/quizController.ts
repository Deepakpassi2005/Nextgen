import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Quiz } from '../../models/Quiz';
import { Subject } from '../../models/Subject';
import { Class } from '../../models/Class';
import { sendSuccess, sendError } from '../../utils/response';
import { sendToClass } from '../../services/pushNotificationService';

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, classId, subjectId, questions, dueDate, duration, totalMarks } = req.body;
    const teacherId = req.user?.id;
    
    // Ensure both Subject and Class models are loaded before saving/populating
    const quiz = new Quiz({ 
      title, 
      description,
      classId, 
      subjectId,
      questions, 
      dueDate, 
      teacherId,
      duration: duration || 30,
      totalMarks: totalMarks || 0,
      isPublished: true
    });

    await quiz.save();

    // Send Push Notification
    sendToClass(classId, {
      title: 'New Quiz Published',
      body: quiz.title,
      data: { screen: 'QuizAttempt', id: quiz._id.toString() }
    }).catch(e => console.error('Failed to send quiz push:', e));

    return sendSuccess(res, quiz, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to create quiz');
  }
};

export const getQuizzesByClass = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const quizzes = await Quiz.find({ classId }).populate('classId subjectId');
    return sendSuccess(res, quizzes);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch quizzes');
  }
};

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Quiz.findByIdAndUpdate(req.params.quizId, req.body, { new: true });
    if (!updated) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, updated);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to update quiz');
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.quizId);
    if (!deleted) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, { message: 'Quiz deleted' });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to delete quiz');
  }
};

export const getAllTeacherQuizzes = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const quizzes = await Quiz.find({ teacherId }).populate('classId subjectId');
    return sendSuccess(res, quizzes);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch quizzes');
  }
};

// @ts-ignore
import { QuizSubmission } from '../../models/QuizSubmission';
// @ts-ignore
import { Student } from '../../models/Student';

export const getQuizSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.params;
    console.log(`[QuizResults] Fetching submissions for quiz: ${quizId}`);
    
    // 1. Get quiz info (to get classId)
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.error(`[QuizResults] Quiz NOT FOUND for ID: ${quizId}`);
      return sendError(res, `Quiz not found with ID: ${quizId}`, 404);
    }
    
    const classId = quiz.classId;
    
    // 2. Fetch all students in the class
    const allStudents = await Student.find({ classId }).select('firstName lastName rollNumber _id');
    
    // 3. Fetch all submissions for this quiz
    const submissions = await QuizSubmission.find({ quizId }).populate('studentId', 'firstName lastName rollNumber');
    
    // 4. Map students to status
    const submittedStudentIds = new Set(submissions.map(s => s.studentId._id.toString()));
    
    const answered = submissions.map(s => ({
      studentId: s.studentId,
      score: s.score,
      totalMarks: s.totalMarks,
      submittedAt: s.submittedAt,
      status: 'answered'
    }));
    
    const notAnswered = allStudents
      .filter(s => !submittedStudentIds.has(s._id.toString()))
      .map(s => ({
        studentId: s,
        status: 'pending'
      }));
    
    return sendSuccess(res, {
      quiz: {
        title: quiz.title,
        totalMarks: quiz.totalMarks
      },
      answered,
      notAnswered,
      stats: {
        total: allStudents.length,
        submitted: answered.length,
        pending: notAnswered.length
      }
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch quiz submissions');
  }
};
