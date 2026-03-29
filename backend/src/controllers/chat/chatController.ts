import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { Message } from '../../models/Message';
import { sendSuccess, sendError } from '../../utils/response';

// class chat
export const getClassChat = async (req: Request, res: Response) => {
  try {
    const classId = req.params.classId;
    const messages = await Message.find({ classId }).sort({ createdAt: 1 });
    return sendSuccess(res, messages);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch class chat');
  }
};

export const sendClassMessage = async (req: Request, res: Response) => {
  try {
    const { classId, message, fileUrl } = req.body;
    const senderId = (req as AuthRequest).user?.id;
    const msg = new Message({ classId, senderId, message, fileUrl });
    await msg.save();
    // emit via socket.io if needed
    return sendSuccess(res, msg, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to send message');
  }
};

export const getPersonalChat = async (req: Request, res: Response) => {
  try {
    const senderId = (req as AuthRequest).user?.id;
    const receiverId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });
    return sendSuccess(res, messages);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to fetch personal chat');
  }
};

export const sendPersonalMessage = async (req: Request, res: Response) => {
  try {
    const { receiverId, message, fileUrl } = req.body;
    const senderId = (req as AuthRequest).user?.id;
    const msg = new Message({ senderId, receiverId, message, fileUrl });
    await msg.save();
    return sendSuccess(res, msg, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to send personal message');
  }
};
