import { Request, Response, NextFunction } from 'express';

const ev: any = require('express-validator');
const { body, validationResult, param, query } = ev;

export const runValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[Validation Debug] req.body:', JSON.stringify(req.body, null, 2));
    console.log('[Validation Debug] errors:', JSON.stringify(errors.array(), null, 2));
    const errorMessages = errors.array().map((err: any) => err.msg).join(', ');
    return res.status(422).json({ success: false, message: `Validation failed: ${errorMessages}`, data: errors.array() });
  }
  next();
};

// example validators that can be extended per-route
export const authValidators = [
  body('email').isEmail().withMessage('Email is required and must be valid'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Student validators
export const studentValidators = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').optional({ checkFalsy: true }).trim(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('admissionNumber').trim().notEmpty().withMessage('Admission number is required'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('parentMobileNumber').optional({ checkFalsy: true }).isString().withMessage('Invalid parent mobile number'),
  body('motherMobileNumber').optional({ checkFalsy: true }).isString().withMessage('Invalid mother mobile number'),
  body('studentMobileNumber').optional({ checkFalsy: true }).isString().withMessage('Invalid student mobile number'),
];

export const studentUpdateValidators = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').optional({ checkFalsy: true }).trim(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required'),
  body('admissionNumber').optional({ checkFalsy: true }).trim(),
  body('rollNumber').optional({ checkFalsy: true }).trim(),
  body('classId').optional({ checkFalsy: true }),
  body('parentMobileNumber').optional({ checkFalsy: true }).isString().withMessage('Invalid parent mobile number'),
  body('motherMobileNumber').optional({ checkFalsy: true }).isString().withMessage('Invalid mother mobile number'),
  body('studentMobileNumber').optional({ checkFalsy: true }).isString().withMessage('Invalid student mobile number'),
];

// Teacher validators
export const teacherUpdateValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').optional({ checkFalsy: true }).isString().withMessage('Invalid phone number'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const teacherValidators = [
  ...teacherUpdateValidators,
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Quiz validators
export const quizValidators = [
  body('title').trim().notEmpty().withMessage('Quiz title is required'),
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('questions').isArray({ min: 1 }).withMessage('At least 1 question is required'),
  body('questions.*.question').trim().notEmpty().withMessage('Question text is required'),
  body('questions.*.options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
  body('questions.*.answer').notEmpty().withMessage('Answer is required'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be greater than 0'),
  body('duration').isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes'),
];

// Assignment validators
export const assignmentValidators = [
  body('title').trim().notEmpty().withMessage('Assignment title is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('classId').notEmpty().withMessage('Class ID is required'),

  body('dueDate').isISO8601().withMessage('Valid due date is required'),
];

// Attendance validators
export const attendanceValidators = [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('students').isArray({ min: 1 }).withMessage('At least 1 student attendance is required'),
  body('students.*.studentId').notEmpty().withMessage('Student ID is required'),
  body('students.*.status').isIn(['present', 'absent', 'late']).withMessage('Valid attendance status is required'),
];
