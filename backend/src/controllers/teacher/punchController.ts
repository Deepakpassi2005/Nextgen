import { Request, Response } from 'express';
import { PunchLog } from '../../models/PunchLog';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authMiddleware';

const toRad = (deg: number) => (deg * Math.PI) / 180;
const distanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const punchIn = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return sendError(res, 'latitude and longitude required', 400);
    }
    let within = false;
    if (process.env.SCHOOL_LAT && process.env.SCHOOL_LNG) {
      const schoolLat = Number(process.env.SCHOOL_LAT);
      const schoolLng = Number(process.env.SCHOOL_LNG);
      const radius = Number(process.env.PUNCH_RADIUS || '100');
      const dist = distanceInMeters(latitude, longitude, schoolLat, schoolLng);
      within = dist <= radius;
    } else {
      // Fallback: Default to within-radius if school GPS is unconfigured
      within = true;
    }
    const authReq = req as AuthRequest;
    const teacherId = authReq.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // check existing same day
    const existing = await PunchLog.findOne({ teacherId, timestamp: { $gte: today } });
    if (existing) {
      return sendError(res, 'Already punched in for today', 409);
    }

    const log = new PunchLog({ teacherId, latitude, longitude, withinRadius: within });
    await log.save();
    return sendSuccess(res, log, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Punch in failed');
  }
};

export const getPunchHistory = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const teacherId = authReq.user!.id;
    const logs = await PunchLog.find({ teacherId }).sort({ timestamp: -1 });
    return sendSuccess(res, logs);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch punch history');
  }
};
