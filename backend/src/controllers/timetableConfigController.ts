import { Request, Response } from 'express';
import { TimetableConfig } from '../models/TimetableConfig';
import { Class } from '../models/Class';
import { sendSuccess, sendError } from '../utils/response';
import { requireFields } from '../utils/validators';
import { logActivity } from '../services/activityService';

export const getTimetableConfig = async (req: Request, res: Response) => {
  try {
    const config = await TimetableConfig.findOne({ classId: req.params.classId });
    if (!config) {
      // Return default config if not found
      return sendSuccess(res, {
        startTime: '09:00',
        periodDuration: 60,
        periodCount: 7,
      });
    }
    return sendSuccess(res, config);
  } catch (err) {
    console.error('[timetable.getTimetableConfig]', err);
    return sendError(res, 'Failed to fetch timetable config');
  }
};

export const saveTimetableConfig = async (req: Request, res: Response) => {
  try {
    const err = requireFields(req.body, [
      'classId',
      'startTime',
      'periodDuration',
      'periodCount',
    ]);
    if (err) return sendError(res, err, 400);

    const { classId, startTime, periodDuration, periodCount } = req.body;

    // Find and update, or create new
    let isNew = false;
    let config = await TimetableConfig.findOne({ classId });
    if (config) {
      config.startTime = startTime;
      config.periodDuration = periodDuration;
      config.periodCount = periodCount;
    } else {
      isNew = true;
      config = new TimetableConfig({
        classId,
        startTime,
        periodDuration,
        periodCount,
      });
    }

    const saved = await config.save();

    // log activity so users see a notification badge
    try {
      const authReq = req as any;
      const userId = authReq.user?.id || '';
      const userName = authReq.user?.name || 'System';
      // fetch class name for nicer message
      const classDoc = await Class.findById(classId);
      const className = classDoc?.name || classId;
      const activityType: any = isNew
        ? 'timetable_config_created'
        : 'timetable_config_updated';

      logActivity(
        activityType,
        `Timetable ${isNew ? 'created' : 'updated'} for ${className}`,
        `Timetable configuration ${isNew ? 'created' : 'updated'} for ${className}`,
        userId,
        userName,
        classId,
        'class'
      ).catch(() => {});
    } catch (e) {
      // ignore activity errors
      console.error('activity log failed', e);
    }

    return sendSuccess(res, saved, 201);
  } catch (err: any) {
    console.error('[timetable.saveTimetableConfig]', err);
    const msg = err.message || 'Failed to save timetable config';
    return sendError(res, msg, 400);
  }
};

export const deleteTimetableConfig = async (req: Request, res: Response) => {
  try {
    const deleted = await TimetableConfig.findOneAndDelete({
      classId: req.params.classId,
    });
    if (!deleted) return sendError(res, 'Config not found', 404);
    return sendSuccess(res, { message: 'Config deleted' });
  } catch (err) {
    console.error('[timetable.deleteTimetableConfig]', err);
    return sendError(res, 'Failed to delete config');
  }
};
