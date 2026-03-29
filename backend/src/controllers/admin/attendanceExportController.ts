import { Request, Response } from 'express';
import { Attendance } from '../../models/Attendance';
import { TeacherAttendance } from '../../models/TeacherAttendance';
import { Student } from '../../models/Student';
import { Teacher } from '../../models/Teacher';
import ExcelJS from 'exceljs';
import { sendError } from '../../utils/response';

export const exportAttendance = async (req: Request, res: Response) => {
  try {
    const { role, classId, startDate, endDate } = req.query as {
      role?: string;
      classId?: string;
      startDate?: string;
      endDate?: string;
    };

    console.log('[exportAttendance] Start:', { role, classId, startDate, endDate });

    if (!role || (role !== 'student' && role !== 'teacher')) {
      console.log('[exportAttendance] Invalid role');
      return sendError(res, 'Invalid role for export. Must be "student" or "teacher".', 400);
    }

    if (!startDate || !endDate) {
      console.log('[exportAttendance] Missing dates');
      return sendError(res, 'Start date and end date are required.', 400);
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${role.charAt(0).toUpperCase() + role.slice(1)} Attendance`);

    // Styling helpers
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } } as ExcelJS.FillPattern,
      alignment: { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment
    };

    // Calculate dates array within range
    const dates: Date[] = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Prepare columns
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'ID / Code', key: 'code', width: 15 },
      { header: 'Name', key: 'name', width: 25 }
    ];

    dates.forEach(d => {
      columns.push({
        header: d.toLocaleDateString(),
        key: d.toISOString().split('T')[0],
        width: 12
      });
    });

    columns.push({ header: 'Total Present', key: 'totalPresent', width: 15 });
    columns.push({ header: 'Total Absent', key: 'totalAbsent', width: 15 });
    
    sheet.columns = columns;

    // Apply header styles
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
    });

    if (role === 'student') {
      if (!classId) return sendError(res, 'classId is required for student export.', 400);

      console.log('[exportAttendance] Fetching students for class:', classId);
      const students = await Student.find({ classId, status: 'active' });
      console.log(`[exportAttendance] Found ${students.length} students`);

      console.log('[exportAttendance] Fetching records');
      const records = await Attendance.find({
        classId,
        date: { $gte: start, $lte: end }
      });
      console.log(`[exportAttendance] Found ${records.length} attendance records`);

      // Process rows
      students.forEach(student => {
        console.log(`[exportAttendance] Processing student: ${student.firstName} ${student.lastName}`);
        const rowData: any = {
          code: student.rollNumber || student.admissionNumber || 'N/A',
          name: `${student.firstName} ${student.lastName}`
        };

        let presentCount = 0;
        let absentCount = 0;

        dates.forEach(d => {
          const dateStr = d.toISOString().split('T')[0];
          const recordForDate = records.find(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
          
          let status = 'N/A';
          if (recordForDate) {
            const studentRecord = recordForDate.students.find(s => String(s.studentId) === String(student._id));
            if (studentRecord) {
              status = studentRecord.status.toUpperCase();
              if (status === 'PRESENT' || status === 'LATE') presentCount++;
              if (status === 'ABSENT') absentCount++;
            }
          }
          rowData[dateStr] = status;
        });

        rowData.totalPresent = presentCount;
        rowData.totalAbsent = absentCount;
        sheet.addRow(rowData);
      });

    } else if (role === 'teacher') {
      const teachers = await Teacher.find({ status: 'active' });
      const records = await TeacherAttendance.find({
        date: { $gte: start, $lte: end }
      });

      teachers.forEach(teacher => {
        const rowData: any = {
          code: teacher.employeeId || 'N/A',
          name: teacher.name
        };

        let presentCount = 0;
        let absentCount = 0;

        dates.forEach(d => {
          const dateStr = d.toISOString().split('T')[0];
          const recordForDate = records.filter(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
          
          let status = 'N/A';
          
          // Check if teacher has record
          const teacherRecord = recordForDate.find(r => String(r.teacherId) === String(teacher._id));
          if (teacherRecord) {
              status = teacherRecord.status.toUpperCase();
              if (status === 'PRESENT' || status === 'LATE') presentCount++;
              else if (status === 'ABSENT') absentCount++;
          }
          rowData[dateStr] = status;
        });

        rowData.totalPresent = presentCount;
        rowData.totalAbsent = absentCount;
        sheet.addRow(rowData);
      });
    }

    // Apply color coding for Present/Absent cells
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      row.eachCell((cell, colNumber) => {
        const value = cell.value?.toString();
        if (value === 'PRESENT' || value === 'LATE') {
          cell.font = { color: { argb: 'FF16A34A' }, bold: true }; // Green
        } else if (value === 'ABSENT') {
          cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red
        } else if (value === 'N/A') {
          cell.font = { color: { argb: 'FF9CA3AF' } }; // Gray
        }
      });
    });

    console.log('[exportAttendance] Writing Excel to response');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${role}-attendance-${startDate}-to-${endDate}.xlsx"`);

    await workbook.xlsx.write(res);
    console.log('[exportAttendance] Excel sent successfully');
    res.end();
  } catch (err) {
    console.error('[exportAttendance] CRASH:', err);
    return sendError(res, 'Failed to export attendance');
  }
};
