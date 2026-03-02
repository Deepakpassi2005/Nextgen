import { Request, Response } from 'express';
import { Notice } from '../models/Notice';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import { logActivity } from '../services/activityService';
import { AuthRequest } from '../middlewares/authMiddleware';

const noticeRequired = ['title', 'content', 'author'];

export const getNotices = async (req: Request, res: Response) => {
  try {
    const notices = await Notice.find().sort({ date: -1 });
    return sendSuccess(res, notices);
  } catch (err) {
    console.error('[notice.getNotices]', err);
    return sendError(res, 'Failed to fetch notices');
  }
};

export const getNoticeById = async (req: Request, res: Response) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return sendError(res, 'Notice not found', 404);
    return sendSuccess(res, notice);
  } catch (err) {
    console.error('[notice.getNoticeById]', err);
    return sendError(res, 'Failed to fetch notice');
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, noticeRequired);
    if (err) return sendError(res, err, 400);

    const notice = new Notice({
      title: req.body.title,
      content: req.body.content,
      priority: req.body.priority || 'medium',
      audience: req.body.audience || 'all',
      author: req.body.author,
      date: req.body.date || new Date(),
    });

    const saved = await notice.save();
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || 'system';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'notice_created',
      `New Notice Published: ${notice.title}`,
      `Notice "${notice.title}" has been published`,
      userId,
      userName,
      saved._id.toString(),
      'notice'
    ).catch(() => {});

    
    return sendSuccess(res, saved, 201);
  } catch (err: any) {
    console.error('[notice.createNotice]', err);
    const msg = err.message || 'Failed to create notice';
    return sendError(res, msg, 400);
  }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const updated = await Notice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return sendError(res, 'Notice not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || 'system';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'notice_updated',
      `Notice Updated: ${updated.title}`,
      `Notice "${updated.title}" has been modified`,
      userId,
      userName,
      updated._id.toString(),
      'notice'
    ).catch(() => {});

    
    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('[notice.updateNotice]', err);
    const msg = err.message || 'Failed to update notice';
    return sendError(res, msg, 400);
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const deleted = await Notice.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Notice not found', 404);
    
    // Log activity
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || 'system';
    const userName = authReq.user?.name || 'System';
    logActivity(
      'notice_deleted',
      `Notice Deleted: ${deleted.title}`,
      `Notice "${deleted.title}" has been removed`,
      userId,
      userName,
      deleted._id.toString(),
      'notice'
    ).catch(() => {});

    
    return sendSuccess(res, { message: 'Notice deleted' });
  } catch (err) {
    console.error('[notice.deleteNotice]', err);
    return sendError(res, 'Failed to delete notice');
  }
};

export const getRecentNotices = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const notices = await Notice.find().sort({ date: -1 }).limit(limit);
    return sendSuccess(res, notices);
  } catch (err) {
    console.error('[notice.getRecentNotices]', err);
    return sendError(res, 'Failed to fetch recent notices');
  }
};
