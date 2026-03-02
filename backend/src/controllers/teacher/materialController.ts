import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';
import { StudyMaterial } from '../../models/StudyMaterial';
import { sendSuccess, sendError } from '../../utils/response';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/materials'),
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  },
});

export const uploadMiddleware = multer({ storage }).single('file');

export const uploadMaterial = async (req: AuthRequest, res: Response) => {
  uploadMiddleware(req, res, async (err: any) => {
    if (err) {
      console.error(err);
      return sendError(res, 'File upload failed');
    }
    try {
      const { classId, title, description } = req.body;
      const teacherId = req.user?.id;
      if (!req.file) return sendError(res, 'file is required', 400);
      const url = `/uploads/materials/${(req.file as any).filename}`;
      const material = new StudyMaterial({ classId, teacherId, title, description, fileUrl: url });
      await material.save();
      return sendSuccess(res, material, 201);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to save material');
    }
  });
};

export const getMaterialsByClass = async (req: Request, res: Response) => {
  try {
    const classId = req.params.classId;
    const list = await StudyMaterial.find({ classId });
    return sendSuccess(res, list);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch materials');
  }
};
