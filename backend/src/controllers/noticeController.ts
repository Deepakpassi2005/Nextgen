import { Response } from 'express';
import { Notice } from '../models/Notice';
import { sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../services/activityService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendToAllAudience } from '../services/pushNotificationService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ─── Multer for notice file uploads (separate endpoint) ──────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(process.cwd(), "..", "uploads", "notices");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const noticeUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

export const uploadNoticeFiles = noticeUpload.array('attachments', 5);

// ─── GET all notices ─────────────────────────────────────────────────────────

export const getNotices = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};
    if (req.user?.role === 'student') {
      query.audience = { $in: ['all', 'students'] };
    } else if (req.user?.role === 'teacher') {
      // Teachers see notices meant for them AND notices they created
      query.$or = [
        { audience: { $in: ['all', 'teachers'] } },
        { authorId: req.user.id },
        { author: req.user.name, authorId: { $exists: false } } // Fallback for legacy notices
      ];
    }
    const notices = await Notice.find(query).sort({ date: -1 });
    return sendSuccess(res, notices);
  } catch (err) {
    console.error('[notice.getNotices]', err);
    return sendError(res, 'Failed to fetch notices');
  }
};

export const getNoticeById = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return sendError(res, 'Notice not found', 404);
    
    // Authorization check for visibility
    if (req.user?.role === 'student' && !['all', 'students'].includes(notice.audience)) {
      return sendError(res, 'Access denied', 403);
    }
    if (req.user?.role === 'teacher' && !['all', 'teachers'].includes(notice.audience)) {
      return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, notice);
  } catch (err) {
    console.error('[notice.getNoticeById]', err);
    return sendError(res, 'Failed to fetch notice');
  }
};

// ─── CREATE notice (JSON body — no files) ────────────────────────────────────

export const createNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, priority, audience } = req.body;
    if (!title || !content) return sendError(res, 'Title and content are required', 400);

    const author = req.user?.name || req.body.author || 'Admin';
    const createdByRole: 'admin' | 'teacher' = req.user?.role === 'teacher' ? 'teacher' : 'admin';

    const notice = new Notice({
      title,
      content,
      priority: priority || 'medium',
      audience: audience || 'all',
      author,
      authorId: req.user?.id,
      createdByRole,
      date: new Date(),
      attachments: [],
    });

    const saved = await notice.save();

    logActivity(
      'notice_created',
      `New Notice Published: ${notice.title}`,
      `Notice "${notice.title}" has been published`,
      req.user?.id || 'system',
      author,
      saved._id.toString(),
      'notice'
    ).catch(() => {});

    // Send Push Notification
    sendToAllAudience(notice.audience as any, {
      title: 'New Notice Published',
      body: notice.title,
      data: { screen: 'NoticeDetail', id: saved._id.toString() }
    }).catch(e => console.error('Failed to send notice push:', e));

    return sendSuccess(res, saved, 201);
  } catch (err: any) {
    console.error('[notice.createNotice]', err);
    return sendError(res, err.message || 'Failed to create notice', 400);
  }
};

// ─── Upload attachments to an existing notice ─────────────────────────────────

export const uploadAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return sendError(res, 'Notice not found', 404);

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return sendError(res, 'No files uploaded', 400);

    const newAttachments = files.map((f) => ({
      filename: f.originalname,
      url: `uploads/notices/${f.filename}`,
      mimetype: f.mimetype,
      size: f.size,
    }));

    notice.attachments.push(...newAttachments);
    const updated = await notice.save();
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[notice.uploadAttachments]', err);
    return sendError(res, err.message || 'Failed to upload attachments', 400);
  }
};

// ─── Remove a single attachment from a notice ────────────────────────────────

export const removeAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return sendError(res, 'Notice not found', 404);

    const { url } = req.body;
    if (!url) return sendError(res, 'Attachment URL required', 400);

    notice.attachments = notice.attachments.filter((a) => {
      if (a.url === url) {
        const filePath = path.join(__dirname, '../../../', a.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return false;
      }
      return true;
    });

    const updated = await notice.save();
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[notice.removeAttachment]', err);
    return sendError(res, err.message || 'Failed to remove attachment', 400);
  }
};

// ─── UPDATE notice (JSON — fields only) ─────────────────────────────────────

export const updateNotice = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[notice.updateNotice] ID:', req.params.id);
    const notice = await Notice.findById(req.params.id);
    console.log('[notice.updateNotice] Found:', !!notice);
    if (!notice) return sendError(res, 'Notice not found', 404);
 
    const { title, content, priority, audience } = req.body;
    if (title) notice.title = title;
    if (content) notice.content = content;
    if (priority) notice.priority = priority;
    if (audience) notice.audience = audience;

    const updated = await notice.save();

    logActivity(
      'notice_updated',
      `Notice Updated: ${updated.title}`,
      `Notice "${updated.title}" has been modified`,
      req.user?.id || 'system',
      req.user?.name || 'Admin',
      updated._id.toString(),
      'notice'
    ).catch(() => {});

    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[notice.updateNotice]', err);
    return sendError(res, err.message || 'Failed to update notice', 400);
  }
};

// ─── DELETE notice ────────────────────────────────────────────────────────────

export const deleteNotice = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Notice.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Notice not found', 404);

    for (const att of deleted.attachments) {
      const filePath = path.join(__dirname, '../../../', att.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    logActivity(
      'notice_deleted',
      `Notice Deleted: ${deleted.title}`,
      `Notice "${deleted.title}" has been removed`,
      req.user?.id || 'system',
      req.user?.name || 'Admin',
      deleted._id.toString(),
      'notice'
    ).catch(() => {});

    return sendSuccess(res, { message: 'Notice deleted' });
  } catch (err) {
    console.error('[notice.deleteNotice]', err);
    return sendError(res, 'Failed to delete notice');
  }
};

export const getRecentNotices = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const query: any = {};
    if (req.user?.role === 'student') {
      query.audience = { $in: ['all', 'students'] };
    } else if (req.user?.role === 'teacher') {
      query.audience = { $in: ['all', 'teachers'] };
    }
    const notices = await Notice.find(query).sort({ date: -1 }).limit(limit);
    return sendSuccess(res, notices);
  } catch (err) {
    console.error('[notice.getRecentNotices]', err);
    return sendError(res, 'Failed to fetch recent notices');
  }
};
