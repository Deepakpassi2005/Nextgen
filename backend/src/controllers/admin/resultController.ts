import { Request, Response } from 'express';
import { Result } from '../../models/Result';
import { sendSuccess, sendError } from '../../utils/response';

export const getResultsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { examType } = req.query;
    
    const query: any = { classId };
    if (examType) query.examType = examType;

    let results = await Result.find(query)
      .populate('studentId', 'firstName lastName rollNumber name')
      .populate('teacherId', 'name')
      .populate('marks.subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Robust manual fallback for population if needed
    for (let i = 0; i < results.length; i++) {
        const item = results[i] as any;
        
        // Fix Student Name
        if (item.studentId && (typeof item.studentId === 'string' || !item.studentId.firstName)) {
            const sid = typeof item.studentId === 'string' ? item.studentId : item.studentId._id;
            const Student = (Result.db as any).model('Student');
            const student = await Student.findById(sid).select('firstName lastName rollNumber name').lean();
            if (student) item.studentId = student;
        }
        
        // Fix Subject Name in marks array
        if (item.marks && Array.isArray(item.marks)) {
            for (let j = 0; j < item.marks.length; j++) {
                const m = item.marks[j];
                if (m.subjectId && (typeof m.subjectId === 'string' || !m.subjectId.name)) {
                const Subject = (Result.db as any).model('Subject');
                const subject = await Subject.findById(typeof m.subjectId === 'string' ? m.subjectId : m.subjectId._id)
                    .select('name')
                    .lean();
                if (subject) m.subjectId = subject;
                }
            }
        }
    }

    return sendSuccess(res, results);
  } catch (err) {
    console.error('[Admin.getResultsByClass]', err);
    return sendError(res, 'Failed to fetch class results');
  }
};

export const updateResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await Result.findByIdAndUpdate(id, data, { new: true })
      .populate('studentId', 'firstName lastName rollNumber name')
      .populate('marks.subjectId', 'name');

    if (!updated) return sendError(res, 'Result not found', 404);

    return sendSuccess(res, updated);
  } catch (err) {
    console.error('[Admin.updateResult]', err);
    return sendError(res, 'Failed to update result');
  }
};

export const deleteResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Result.findByIdAndDelete(id);
    if (!deleted) return sendError(res, 'Result not found', 404);

    return sendSuccess(res, { message: 'Result deleted successfully' });
  } catch (err) {
    console.error('[Admin.deleteResult]', err);
    return sendError(res, 'Failed to delete result');
  }
};
