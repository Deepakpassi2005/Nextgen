import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { sendError } from '../../utils/response';

export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { fileUrl, fileName } = req.query;

    if (!fileUrl) {
      return sendError(res, 'File URL is required', 400);
    }

    // Security: Only allow files from the uploads directory
    const normalizedPath = String(fileUrl).replace(/^[/\\]+/, '');
    if (!normalizedPath.startsWith('uploads/')) {
      return sendError(res, 'Unauthorized access to file', 403);
    }

    const filePath = path.join(process.cwd(), '..', normalizedPath);

    if (!fs.existsSync(filePath)) {
      console.error('[downloadFile] File not found:', filePath);
      return sendError(res, 'File not found', 404);
    }

    const downloadName = fileName ? String(fileName) : path.basename(filePath);
    
    // Set explicit attachment disposition to force download
    res.download(filePath, downloadName);
  } catch (err) {
    console.error('[downloadFile] error:', err);
    return sendError(res, 'Failed to download file');
  }
};
