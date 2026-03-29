import { Request, Response } from 'express';
import { Assignment } from '../../models/Assignment';
import { AssignmentSubmission } from '../../models/AssignmentSubmission';
import { Student } from '../../models/Student';
import { sendSuccess, sendError } from '../../utils/response';
import * as ExcelJS from 'exceljs';
import mongoose from 'mongoose';

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId } = req.query;
    const filter: any = {};
    if (classId) filter.classId = new mongoose.Types.ObjectId(classId as string);
    if (subjectId) filter.subjectId = new mongoose.Types.ObjectId(subjectId as string);

    // Fetch all matching assignments
    const assignments = await Assignment.find(filter)
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Attach statistics (submitted vs total students in class)
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        // Total students in the class
        const totalStudents = await Student.countDocuments({ classId: assignment.classId, status: 'active' });
        // Total submissions for this assignment
        const submittedCount = await AssignmentSubmission.countDocuments({ assignmentId: assignment._id });

        return {
          ...assignment,
          stats: {
            totalStudents,
            submittedCount,
            pendingCount: Math.max(0, totalStudents - submittedCount),
          },
        };
      })
    );

    return sendSuccess(res, assignmentsWithStats);
  } catch (error) {
    console.error('Error fetching admin assignments:', error);
    return sendError(res, 'Failed to fetch assignments');
  }
};

export const exportAssignmentsToExcel = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId } = req.query;
    const filter: any = {};
    if (classId) filter.classId = new mongoose.Types.ObjectId(classId as string);
    if (subjectId) filter.subjectId = new mongoose.Types.ObjectId(subjectId as string);

    const assignments = await Assignment.find(filter)
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Assignments');

    sheet.columns = [
      { header: 'Assignment Title', key: 'title', width: 30 },
      { header: 'Class', key: 'className', width: 20 },
      { header: 'Subject', key: 'subjectName', width: 20 },
      { header: 'Teacher', key: 'teacherName', width: 25 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Total Students', key: 'totalStudents', width: 15 },
      { header: 'Submitted', key: 'submitted', width: 15 },
      { header: 'Pending', key: 'pending', width: 15 },
    ];

    // Style headers
    sheet.getRow(1).font = { bold: true };

    for (const assignment of assignments) {
      const totalStudents = await Student.countDocuments({ classId: assignment.classId, status: 'active' });
      const submittedCount = await AssignmentSubmission.countDocuments({ assignmentId: assignment._id });

      sheet.addRow({
        title: assignment.title,
        className: (assignment.classId as any)?.name || 'N/A',
        subjectName: (assignment.subjectId as any)?.name || 'N/A',
        teacherName: (assignment.teacherId as any)?.name || 'N/A',
        dueDate: assignment.dueDate.toISOString().split('T')[0],
        totalStudents,
        submitted: submittedCount,
        pending: Math.max(0, totalStudents - submittedCount),
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Assignments_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting assignments:', error);
    return sendError(res, 'Failed to export assignments');
  }
};
