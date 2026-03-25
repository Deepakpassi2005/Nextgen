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

    // ensure email is unique across both teachers and students
    const existingTeacher = await Teacher.findOne({ email }).lean();
    const existingStudent = await Student.findOne({ email }).lean();
    if (existingTeacher || existingStudent) {
      return sendError(res, 'Email already registered', 409);
    }

    if (role === 'teacher' || role === 'admin') {
      const newTeacher = new Teacher({ name, email, password, role });
      await newTeacher.save();
    } else if (role === 'student') {
      const newStudent = new Student({ name, email, password, role });
      await newStudent.save();
    } else {
      return sendError(res, 'Invalid role', 400);
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

    // Helpful debug output when running in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth.login] Attempting login for email:', email);
    }

    // Ensure fixed dev admin credentials always work
    const DEV_ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL || 'admin@gmail.com';
    const DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || 'admin123';

    if (email === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
      // Ensure admin user exists in DB so we can issue a proper token
      let admin = await Teacher.findOne({ email: DEV_ADMIN_EMAIL });
      if (!admin) {
        admin = new Teacher({ name: 'Admin User', email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD, role: 'admin' });
        await admin.save();
      }

      const payload = {
        sub: String(admin._id),
        email: admin.email,
        role: 'admin',
        name: admin.name,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      return sendSuccess(res, { token, user: { id: payload.sub, email: payload.email, role: payload.role, name: payload.name } });
    }

    const { user, role } = await findUserByEmail(email);
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth.login] user not found for email:', email);
      }
      return sendError(res, 'Invalid credentials', 401);
    }

    const bcrypt = await import('bcrypt');
    if (!user.password) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth.login] user has no password hash:', email);
      }
      return sendError(res, 'Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth.login] invalid password for email:', email);
      }
      return sendError(res, 'Invalid credentials', 401);
    }

    const payload: any = {
      sub: String(user._id),
      email: user.email,
      role,
      name: user.name,   // include display name for notifications
    };

    if (role === 'student' && user.classId) {
      payload.classId = String(user.classId);
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return sendSuccess(res, { token, user: { id: payload.sub, email: user.email, role, name: payload.name } });
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
