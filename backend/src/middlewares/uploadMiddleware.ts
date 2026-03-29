import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError';


const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Determine subdirectory based on original URL (contains /student or /teacher prefix)
    const url = req.originalUrl || req.url || '';
    const type = url.includes('student') ? 'students' : 'teachers';
    
    // Use process.cwd() which is reliably the 'backend' folder during development
    // Project root is one level up from 'backend'
    const projectRoot = path.resolve(process.cwd(), "..");
    const dir = path.join(projectRoot, "uploads", "profiles", type);
    
    console.log(`[Multer.destination] URL: ${url}, Type: ${type}, Dir: ${dir}`);

    try {
      if (!fs.existsSync(dir)) {
        console.log(`[Multer.destination] Creating missing dir: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err: any) {
      const errorMsg = `Multer Destination Error: Failed to create or access dir: ${dir}. Error: ${err.message}`;
      console.error(errorMsg, err);
      // Pass the diagnostic message directly so user can see it
      cb(new ApiError(errorMsg, 500), '');
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const profileUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  // Removed strict fileFilter to determine if it was blocking uploads
});


const assignmentStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Project root is one level up from 'backend'
    const projectRoot = path.resolve(process.cwd(), "..");
    const dir = path.join(projectRoot, "uploads", "assignment-submissions");
    
    console.log(`[Multer.assignmentStorage] Resolved dir: ${dir}`);

    try {
      if (!fs.existsSync(dir)) {
        console.log(`[Multer.assignmentStorage] Creating missing dir: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err: any) {
      console.error(`[Multer.assignmentStorage] CRITICAL: Failed to create or access dir: ${dir}`, err);
      cb(new ApiError(`Failed to create assignment upload directory: ${err.message}`, 500), '');
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const assignmentUpload = multer({
  storage: assignmentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype ? (allowedTypes.test(file.mimetype) || file.mimetype.includes('application/octet-stream')) : false;

    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type!'));
    }
  },
});
