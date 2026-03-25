import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { StudyMaterial } from '../models/StudyMaterial';
import { sendSuccess, sendError } from '../utils/response';
import { sendToClass } from '../services/pushNotificationService';
import { requireFields } from '../utils/validators';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// teacherId will be inferred from the authenticated user (or optionally passed in the body)
const materialRequired = ['title', 'subjectId', 'classId'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/study-materials');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export const uploadMaterial = upload.array('files', 15);

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const materials = await StudyMaterial.find({ isActive: true }).populate('subjectId classId teacherId');
    return sendSuccess(res, materials);
  } catch (err) {
    console.error('[material.getMaterials]', err);
    return sendError(res, 'Failed to fetch materials');
  }
};
export const getMaterialsByClass = async (req: Request, res: Response) => {
  try {
    const materials = await StudyMaterial.find({
      classId: req.params.classId,
      isActive: true
    }).populate('subjectId classId teacherId');
    return sendSuccess(res, materials);
  } catch (err) {
    console.error('[material.getMaterialsByClass]', err);
    return sendError(res, 'Failed to fetch class materials');
  }
};

export const getMaterialsByStudent = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return sendError(res, 'Unauthorized', 401);

    // Find student's class
    const { Student } = await import('../models/Student');
    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 'Student not found', 404);

    const materials = await StudyMaterial.find({
      classId: student.classId,
      isActive: true
    }).populate('subjectId classId teacherId');
    return sendSuccess(res, materials);
  } catch (err) {
    console.error('[material.getMaterialsByStudent]', err);
    return sendError(res, 'Failed to fetch student materials');
  }
};

export const getMaterialsByTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) return sendError(res, 'Unauthorized', 401);

    const materials = await StudyMaterial.find({
      teacherId,
      isActive: true
    }).populate('subjectId classId teacherId');
    return sendSuccess(res, materials);
  } catch (err) {
    console.error('[material.getMaterialsByTeacher]', err);
    return sendError(res, 'Failed to fetch teacher materials');
  }
};

export const createMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const err = requireFields(req.body, materialRequired);
    if (err) return sendError(res, err, 400);

    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) return sendError(res, 'At least one file is required', 400);

    const { title, description, subjectId, classId, teacherId: bodyTeacherId } = req.body;
    const teacherId = bodyTeacherId || req.user?.id;
    if (!teacherId) return sendError(res, 'Teacher ID is required', 400);

    const attachments = files.map(file => ({
      fileUrl: `uploads/study-materials/${file.filename}`,
      fileName: file.originalname,
      fileType: path.extname(file.originalname).substring(1),
      fileSize: file.size,
    }));

    const material = new StudyMaterial({
      title,
      description,
      subjectId,
      classId,
      teacherId,
      attachments,
    });

    const saved = await material.save();
    const populated = await saved.populate([
      { path: 'subjectId', select: 'name' },
      { path: 'classId', select: 'name' },
      { path: 'teacherId', select: 'name' }
    ]);

    // Send Push Notification
    sendToClass(classId, {
      title: 'New Study Material Available',
      body: populated.title,
      data: { screen: 'StudyMaterial', id: populated._id.toString() }
    }).catch(e => console.error('Failed to send material push:', e));

    return sendSuccess(res, populated, 201);
  } catch (err: any) {
    console.error('[material.createMaterial]', err);
    const msg = err.message || 'Failed to create material';
    return sendError(res, msg, 400);
  }
};

export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const updated = await StudyMaterial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('subjectId classId teacherId');

    if (!updated) return sendError(res, 'Material not found', 404);
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[material.updateMaterial]', err);
    const msg = err.message || 'Failed to update material';
    return sendError(res, msg, 400);
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return sendError(res, 'Material not found', 404);

    // Delete all attached files from filesystem
    const filePathsToDelete: string[] = [];
    
    // Check legacy field
    if (material.fileUrl) {
      filePathsToDelete.push(path.join(__dirname, '../../../', material.fileUrl));
    }
    
    // Check new attachments
    if (material.attachments && material.attachments.length > 0) {
      material.attachments.forEach(att => {
        filePathsToDelete.push(path.join(__dirname, '../../../', att.fileUrl));
      });
    }

    filePathsToDelete.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        }
      }
    });

    await StudyMaterial.findByIdAndDelete(req.params.id);
    return sendSuccess(res, { message: 'Material deleted' });
  } catch (err) {
    console.error('[material.deleteMaterial]', err);
    return sendError(res, 'Failed to delete material');
  }
};

export const downloadMaterial = async (req: Request, res: Response) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return sendError(res, 'Material not found', 404);

    // Increment download count
    material.downloads += 1;
    await material.save();

    // Ensure we join paths correctly even if fileUrl starts with a slash
    const fileUrl = material.fileUrl?.toString() || '';
    const relativePath = fileUrl.replace(/^[/\\]+/, '');
    const filePath = path.join(__dirname, '../../../', relativePath);

    if (!fs.existsSync(filePath)) {
      console.error('[material.downloadMaterial] missing file path', filePath);
      return sendError(res, 'File not found', 404);
    }

    res.download(filePath, material.title + path.extname(material.fileUrl));
  } catch (err) {
    console.error('[material.downloadMaterial]', err);
    return sendError(res, 'Failed to download material');
  }
};