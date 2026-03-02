import { Request, Response } from 'express';
import { Result } from '../../models/Result';
import { sendSuccess, sendError } from '../../utils/response';

export const createResult = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = new Result(data);
    await result.save();
    return sendSuccess(res, result, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to create result');
  }
};

export const publishResult = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const updated = await Result.findByIdAndUpdate(id, {
      published: true,
      pdfUrl: `/results/${id}.pdf`, // placeholder
    }, { new: true });
    if (!updated) return sendError(res, 'Result not found', 404);

    // placeholder SMS trigger
    // sms.send(...)

    return sendSuccess(res, updated);
  } catch (err) {
    console.error(err);
    return sendError(res, 'Failed to publish result');
  }
};
