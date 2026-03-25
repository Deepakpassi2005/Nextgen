import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Determine subdirectory based on original URL (contains /student or /teacher prefix)
    const type = req.originalUrl.includes('student') ? 'students' : 'teachers';
    const dir = path.resolve(process.cwd(), "..", "uploads", "profiles", type);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const profileUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});

const assignmentStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.resolve(process.cwd(), "..", "uploads", "assignment-submissions");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
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
