import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useStore } from '../lib/store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from '../hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2, UserCheck, Users, RefreshCw, FileText, Download } from 'lucide-react';

type AttendanceType = 'student' | 'teacher';

interface AttendanceRecord {
  id: string;
  name: string;
  code?: string; // student roll number or teacher employeeId
  status: 'present' | 'absent' | 'late';
  remarks: string;
  isPunched?: boolean;
}

const AttendancePage = () => {
  const queryClient = useQueryClient();
  
  // -- State --
  const [attendanceType, setAttendanceType] = useState<AttendanceType | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const lastStudentLoadKey = useRef<string | null>(null);
  const lastTeacherLoadDate = useRef<string | null>(null);

  // -- Export states --
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRole, setExportRole] = useState<'student' | 'teacher'>('student');
  const [exportRange, setExportRange] = useState<'7days' | '30days' | 'custom'>('7days');
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportClassId, setExportClassId] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // -- Queries --
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: apiClient.teachers.getAll,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: apiClient.classes.getAll,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'class', selectedClass],
    queryFn: () => apiClient.students.getByClass(selectedClass),
    enabled: !!selectedClass && attendanceType === 'student',
  });

  const { data: classAttendanceRecords = [], isFetching: fetchingClassRecords, refetch: refetchClassRecords } = useQuery({
    queryKey: ['attendance', 'class', selectedClass],
    queryFn: () => apiClient.attendance.getByClass(selectedClass),
    enabled: !!selectedClass && attendanceType === 'student',
  });

  const { data: teacherAttendanceRecords = [], isFetching: fetchingTeacherAttendance, refetch: refetchTeacherRecords } = useQuery({
    queryKey: ['teacherAttendance', selectedDate],
    queryFn: () => apiClient.teacherAttendance.getByDate(selectedDate),
    enabled: attendanceType === 'teacher' && !!selectedDate,
  });

  const { data: punchLogs = [], isFetching: fetchingPunchLogs, refetch: refetchPunchLogs } = useQuery({
    queryKey: ['punchLogs', selectedDate],
    queryFn: () => apiClient.punch.getAllLogs(),
    enabled: attendanceType === 'teacher',
  });

  // -- Memos --
  const stats = useMemo(() => {
    return {
      present: attendanceData.filter(d => d.status === 'present').length,
      absent: attendanceData.filter(d => d.status === 'absent').length,
      late: attendanceData.filter(d => d.status === 'late').length,
    };
  }, [attendanceData]);

  const existingClassAttendance = useMemo(() => {
    if (!selectedDate || !classAttendanceRecords?.length) return null;
    return (classAttendanceRecords as any[]).find((r) => {
      const date = new Date(r.date);
      return date.toISOString().split('T')[0] === selectedDate;
    });
  }, [classAttendanceRecords, selectedDate]);

  const teacherPunchIds = useMemo(() => {
    const set = new Set<string>();
    if (!punchLogs || !selectedDate) return set;

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    console.log('[AttendancePage DEBUG] Building teacherPunchIds. punchLogs:', punchLogs);
    (punchLogs as any[]).forEach((log) => {
      const ts = new Date(log.timestamp);
      const isToday = ts >= dayStart && ts < dayEnd;
      console.log(`[AttendancePage DEBUG] PunchLog ID ${log._id} for teacher ${log.teacherId?._id || log.teacherId}: ts=${ts.toISOString()} isToday=${isToday} dayStart=${dayStart.toISOString()} dayEnd=${dayEnd.toISOString()} withinRadius=${log.withinRadius}`);
      if (isToday && log.withinRadius) {
        const teacherId = log.teacherId?._id || log.teacherId;
        if (teacherId) set.add(String(teacherId));
      }
    });

    console.log('[AttendancePage DEBUG] Final teacherPunchIds set:', Array.from(set));
    return set;
  }, [punchLogs, selectedDate]);

  // -- Effects --
  useEffect(() => {
    if (students.length === 0) return;

    const key = `${selectedClass}|${selectedDate}|${existingClassAttendance?._id || 'none'}`;
    if (lastStudentLoadKey.current === key) return;

    const initialData = students.map((student: any) => {
      const existingRecord = existingClassAttendance?.students?.find(
        (s: any) => String(s.studentId) === String(student._id) || String(s.studentId?._id) === String(student._id)
      );
      return {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        code: student.rollNumber || 'N/A',
        status: existingRecord?.status || 'present',
        remarks: existingRecord?.remarks || '',
      };
    });

    setAttendanceData(initialData);
    lastStudentLoadKey.current = key;
  }, [students, existingClassAttendance, selectedClass, selectedDate]);

  useEffect(() => {
    if (attendanceType !== 'teacher' || teachers.length === 0) return;
    if (fetchingTeacherAttendance || fetchingPunchLogs) return; // strict guard against hydration race conditions

    const key = selectedDate;
    if (lastTeacherLoadDate.current === key) return;

    const initialData = (teachers as any[]).map((teacher) => {
      const existingRecord = (teacherAttendanceRecords as any[]).find(
        (r) => String(r.teacherId?._id || r.teacherId) === String(teacher._id)
      );
      const isPunched = teacherPunchIds.has(String(teacher._id));
      return {
        id: teacher._id,
        name: teacher.name,
        code: teacher.employeeId || '-',
        status: existingRecord?.status || (isPunched ? 'present' : 'absent'),
        remarks: existingRecord?.remarks || '',
        isPunched,
      };
    });

    setAttendanceData(initialData);
    lastTeacherLoadDate.current = key;
  }, [attendanceType, teachers, teacherAttendanceRecords, teacherPunchIds, selectedDate]);

  const areAttendanceDataEqual = (a: AttendanceRecord[], b: AttendanceRecord[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (
        a[i].id !== b[i].id ||
        a[i].status !== b[i].status ||
        a[i].remarks !== b[i].remarks ||
        a[i].isPunched !== b[i].isPunched
      ) {
        return false;
      }
    }
    return true;
  };

  // -- Mutations --
  const saveStudentAttendance = useMutation({
    mutationFn: (payload: any) => apiClient.attendance.create(payload),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Student attendance saved successfully' });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', selectedClass] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to save attendance', variant: 'destructive' });
    },
  });

  const updateStudentAttendance = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.attendance.update(id, data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Student attendance updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'class', selectedClass] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to update attendance', variant: 'destructive' });
    },
  });

  const saveTeacherAttendance = useMutation({
    mutationFn: (payload: any) => apiClient.teacherAttendance.bulkSave(payload),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Teacher attendance saved successfully' });
      queryClient.invalidateQueries({ queryKey: ['teacherAttendance', selectedDate] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to save teacher attendance', variant: 'destructive' });
    },
  });

  // -- Handlers --
  const handleStatusChange = (index: number, status: AttendanceRecord['status']) => {
    const updated = [...attendanceData];
    updated[index].status = status;
    setAttendanceData(updated);
  };

  const setBulkStatus = (status: AttendanceRecord['status']) => {
    setAttendanceData(prev => prev.map(item => ({ ...item, status })));
  };

  const handleSave = () => {
    if (attendanceData.length === 0) return;

    if (attendanceType === 'student') {
      if (!selectedClass) return;
      const payload = {
        classId: selectedClass,
        date: selectedDate,
        students: attendanceData.map(({ id, status, remarks }) => ({
          studentId: id,
          status,
          remarks,
        })),
      };
      
      if (existingClassAttendance) {
        updateStudentAttendance.mutate({ id: existingClassAttendance._id, data: payload });
      } else {
        saveStudentAttendance.mutate(payload);
      }
      return;
    }

    if (attendanceType === 'teacher') {
      const payload = {
        date: selectedDate,
        records: attendanceData.map(({ id, status, remarks }) => ({
          teacherId: id,
          status,
          remarks,
        })),
      };
      saveTeacherAttendance.mutate(payload);
      return;
    }
  };

  const handleRefresh = async () => {
    if (attendanceType === 'student' && selectedClass) {
      lastStudentLoadKey.current = null;
      await refetchClassRecords();
      toast({ title: 'Refreshed', description: 'Synced real-time student records' });
    } else if (attendanceType === 'teacher' && selectedDate) {
      lastTeacherLoadDate.current = null;
      await Promise.all([
        refetchTeacherRecords(),
        refetchPunchLogs()
      ]);
      toast({ title: 'Refreshed', description: 'Synced real-time teacher punches and records' });
    }
  };

  const calculateDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (exportRange === '7days') {
      start.setDate(end.getDate() - 7);
    } else if (exportRange === '30days') {
      start.setDate(end.getDate() - 30);
    } else {
      return { start: exportStart, end: exportEnd };
    }
    return { 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0] 
    };
  };

  const handleExport = async () => {
    if (exportRole === 'student' && !exportClassId) {
      toast({ title: 'Error', description: 'Please select a class for student export', variant: 'destructive' });
      return;
    }
    const { start, end } = calculateDateRange();
    if (!start || !end) {
      toast({ title: 'Error', description: 'Please define a complete date range', variant: 'destructive' });
      return;
    }

    try {
      setIsExporting(true);
      const blob = await apiClient.attendance.exportData(exportRole, start, end, exportRole === 'student' ? exportClassId : undefined);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportRole}-attendance-${start}-to-${end}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      setIsExportModalOpen(false);
      toast({ title: 'Success', description: 'Export downloaded successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Export failed', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // -- Render Helpers --
  if (teachersLoading || classesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance System</h1>
          <p className="text-muted-foreground">Manage and track daily attendance records.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsExportModalOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
          {attendanceType && (
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5" onClick={() => { setAttendanceType(null); setSelectedClass(''); setShowHistory(false); }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Change Role
            </Button>
          )}
        </div>
      </header>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Generate Attendance Report</CardTitle>
              <CardDescription>Export detailed attendance metrics to an Excel file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase text-muted-foreground">Select Target Group</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setExportRole('student')}
                    className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 transition-colors ${exportRole === 'student' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                  >
                    <Users className={`h-5 w-5 ${exportRole === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-semibold ${exportRole === 'student' ? 'text-primary' : ''}`}>Students</span>
                  </div>
                  <div 
                    onClick={() => setExportRole('teacher')}
                    className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 transition-colors ${exportRole === 'teacher' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                  >
                    <UserCheck className={`h-5 w-5 ${exportRole === 'teacher' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-semibold ${exportRole === 'teacher' ? 'text-primary' : ''}`}>Teachers</span>
                  </div>
                </div>
              </div>

              {exportRole === 'student' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-muted-foreground">Select Class</label>
                  <Select value={exportClassId} onValueChange={setExportClassId}>
                    <SelectTrigger className="w-full font-medium"><SelectValue placeholder="Choose a Class" /></SelectTrigger>
                    <SelectContent className="z-[200]">
                      {classes.map((cls: any) => (
                        <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase text-muted-foreground">Time Period</label>
                <Select value={exportRange} onValueChange={(val: any) => setExportRange(val)}>
                  <SelectTrigger className="w-full font-medium"><SelectValue placeholder="Select Range" /></SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
                    <Input type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">End Date</label>
                    <Input type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
              )}

            </CardContent>
            <div className="flex justify-end gap-3 p-6 border-t bg-muted/10">
              <Button variant="ghost" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
              <Button onClick={handleExport} disabled={isExporting} className="shadow-lg shadow-primary/20">
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Excel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {!attendanceType ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card 
            className="hover:border-primary cursor-pointer transition-all hover:shadow-md"
            onClick={() => setAttendanceType('teacher')}
          >
            <CardHeader className="text-center">
              <UserCheck className="w-12 h-12 mx-auto mb-2 text-primary" />
              <CardTitle>Teacher Portal</CardTitle>
              <CardDescription>Track teacher attendance and punch-in status</CardDescription>
            </CardHeader>
          </Card>
          <Card 
            className="hover:border-primary cursor-pointer transition-all hover:shadow-md"
            onClick={() => setAttendanceType('student')}
          >
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 text-primary" />
              <CardTitle>Student Portal</CardTitle>
              <CardDescription>General student attendance management</CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {attendanceType === 'student' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Class</label>
                    <Select 
                      value={selectedClass} 
                      onValueChange={setSelectedClass}
                    >
                      <SelectTrigger><SelectValue placeholder="Choose Class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input 
                    type="date" 
                    max={new Date().toISOString().split('T')[0]}
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {(attendanceType === 'student' ? selectedClass : attendanceType === 'teacher') && (
            <Card className="animate-in fade-in slide-in-from-bottom-2">
              <CardHeader className="flex flex-row items-center justify-between border-b mb-4">
                <div>
                  <CardTitle>{attendanceType === 'teacher' ? 'Teacher Attendance' : 'Class Roster'}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{stats.present} Present</Badge>
                    <Badge variant="destructive">{stats.absent} Absent</Badge>
                    <Badge variant="outline">{stats.late} Late</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={fetchingClassRecords || fetchingTeacherAttendance || fetchingPunchLogs}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${(fetchingClassRecords || fetchingTeacherAttendance || fetchingPunchLogs) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkStatus('present')}>All Present</Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkStatus('absent')}>All Absent</Button>
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading || fetchingClassRecords ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                        <TableHead className="w-20">{attendanceType === 'student' ? 'Roll' : 'Emp ID'}</TableHead>
                        <TableHead>{attendanceType === 'student' ? 'Student Name' : 'Teacher Name'}</TableHead>
                        <TableHead className="w-40">Status</TableHead>
                        <TableHead>Remarks</TableHead>
                        {attendanceType === 'teacher' && <TableHead className="w-28">Punch</TableHead>}
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.code || '-'}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Select
                                value={item.status}
                                onValueChange={(v: any) => handleStatusChange(index, v)}
                                disabled={item.isPunched}
                              >
                                <SelectTrigger className={
                                  item.status === 'present' ? "text-green-600" : 
                                  item.status === 'absent' ? "text-red-600" : "text-amber-600"
                                }>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {item.status === 'late' ? (
                                <Input
                                  value={item.remarks}
                                  onChange={(e) => {
                                    const updated = [...attendanceData];
                                    updated[index].remarks = e.target.value;
                                    setAttendanceData(updated);
                                  }}
                                  placeholder="Notes..."
                                  className="h-8"
                                  disabled={item.isPunched}
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            {attendanceType === 'teacher' && (
                              <TableCell>
                                {item.isPunched ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Punched
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not punched</span>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-6 flex justify-end items-center gap-4">
                  {existingClassAttendance && (
                    <span className="text-sm text-muted-foreground flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" /> 
                      Existing record found. Saving will overwrite.
                    </span>
                  )}
                  <Button 
                    onClick={handleSave} 
                    disabled={
                      (attendanceType === 'student' ? (saveStudentAttendance.isPending || updateStudentAttendance.isPending) : saveTeacherAttendance.isPending) ||
                      attendanceData.length === 0
                    }
                    className="min-w-[150px]"
                  >
                    {(attendanceType === 'student' ? (saveStudentAttendance.isPending || updateStudentAttendance.isPending) : saveTeacherAttendance.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {existingClassAttendance && attendanceType === 'student' ? 'Update Attendance' : 'Save Attendance'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AttendancePage;