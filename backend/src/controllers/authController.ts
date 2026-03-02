import { Request, Response } from 'express';
// temporary disable type checking for this module until @types added
// @ts-ignore
import jwt from 'jsonwebtoken';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// helper to pick model based on role — prefer actual role field on document
const findUserByEmail = async (email: string) => {
  let user: any = await Teacher.findOne({ email }).lean();
  if (user) return { user, role: (user.role as string) || 'teacher' };
  user = await Student.findOne({ email }).lean();
  if (user) return { user, role: (user.role as string) || 'student' };
  // extendable: check for admin collection when added
  return { user: null, role: null };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return sendError(res, 'name, email, password and role are required', 400);
    }

    const exists = await Teacher.findOne({ email }).lean();
    if (exists) {
      return sendError(res, 'Email already registered', 409);
    }
    const hashed = await import('bcrypt').then((b) => b.hash(password, 10));

    // create according to role
    if (role === 'teacher') {
      const newTeacher = new Teacher({ name, email, password: hashed, role });
      await newTeacher.save();
    } else if (role === 'student') {
      const newStudent = new Student({ name, email, password: hashed, role });
      await newStudent.save();
    } else if (role === 'admin') {
      // TODO: create admin user in dedicated collection if implemented
    }

    return sendSuccess(res, { message: 'registered' }, 201);
  } catch (err: any) {
    console.error('[auth.register]', err);
    return sendError(res, err.message || 'Registration failed', 400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const { user, role } = await findUserByEmail(email);
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const bcrypt = await import('bcrypt');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const payload = {
      sub: String(user._id),
      email: user.email,
      role,
      name: user.name,   // include display name for notifications
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return sendSuccess(res, { token, user: { id: payload.sub, email: user.email, role } });
  } catch (err: any) {
    console.error('[auth.login] Error:', err);
    return sendError(res, 'Login failed');
  }
};

export const authenticatedUser = (req: Request, res: Response) => {
  // authMiddleware should populate req.user
  const authReq = req as any;
  if (!authReq.user) {
    return sendError(res, 'Not authenticated', 401);
  }
  return sendSuccess(res, authReq.user);
};

export default { login, register, authenticatedUser };
