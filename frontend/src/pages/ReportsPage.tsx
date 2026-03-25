import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useDashboardSummary,
  usePerformanceByClass,
  useClassPerformance,
  useTeachers,
  useStudents,
  useStudentsByClass,
  useAnalytics,
  useClasses,
  useAttendanceReport,
} from '../lib/hooks';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Loader2, Download, TrendingUp, Users, BookOpen, Bell, Calendar, Award } from 'lucide-react';

const ReportsPage = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [reportType, setReportType] = useState('overview');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { data: dashboardSummary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: performanceByClass, isLoading: performanceLoading } = usePerformanceByClass();
  const { data: classPerformance, isLoading: classPerfLoading } = useClassPerformance(selectedClass);
  const { data: classAttendance, isLoading: classAttendanceLoading } = useAttendanceReport(selectedClass);

  const { data: classes, isLoading: classesLoading } = useClasses();

  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: studentsByClass, isLoading: studentsByClassLoading } = useStudentsByClass(selectedClass);

  const teacherAnalyticsQuery = useAnalytics('teacher', selectedTeacherId);
  const studentAnalyticsQuery = useAnalytics('student', selectedStudentId);

  const teacherAnalytics = teacherAnalyticsQuery.data;
  const studentAnalytics = studentAnalyticsQuery.data;

  const teacherAttendanceTrend = teacherAnalytics?.attendanceTrend || [];
  const studentAttendanceTrend = studentAnalytics?.attendanceTrend || [];

  const teacherAttendancePercent = Math.round(teacherAnalytics?.monthlyAttendancePercent ?? 0);
  const studentAttendancePercent = studentAnalytics?.attendance ?? 0;

  const studentAverageScore = studentAnalytics?.averagePercentage ?? 0;

  const studentSubjectPerformance = studentAnalytics?.subjectPerformance || [];

  const handleExportReport = () => {
    // In a real implementation, this would generate and download a PDF/Excel report
    alert('Export functionality would be implemented here');
  };

  const attendanceData = [
    { name: 'Present', value: dashboardSummary?.teacherAttendancePercentage || 0, color: '#10b981' },
    { name: 'Absent', value: 100 - (dashboardSummary?.teacherAttendancePercentage || 0), color: '#ef4444' },
  ];

  const performanceChartData = performanceByClass?.map((item: any) => ({
    class: item.name,
    performance: item.score,
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (summaryLoading || performanceLoading || classesLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Real-time data streaming active
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="attendance">Attendance Report</SelectItem>
              <SelectItem value="performance">Performance Report</SelectItem>
              <SelectItem value="students">Student Insights</SelectItem>
              <SelectItem value="teachers">Teacher Insights</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {reportType === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardSummary?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardSummary?.totalTeachers || 0}</div>
                <p className="text-xs text-muted-foreground">Teaching staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardSummary?.totalClasses || 0}</div>
                <p className="text-xs text-muted-foreground">Active classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notices</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardSummary?.totalNotices || 0}</div>
                <p className="text-xs text-muted-foreground">Published notices</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                  <ChartContainer config={{ value: { label: 'Value' } }} className="h-64 w-full aspect-auto">
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Present: {dashboardSummary?.teacherAttendancePercentage || 0}%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm">Absent: {100 - (dashboardSummary?.teacherAttendancePercentage || 0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Performance</CardTitle>
              </CardHeader>
              <CardContent>
                  <ChartContainer config={{ performance: { label: 'Performance' } }} className="h-64 w-full aspect-auto">
                    <BarChart data={performanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="class" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="performance" fill="#8884d8" />
                    </BarChart>
                  </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardSummary?.activities?.map((activity: any) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${activity.color} bg-opacity-10`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="outline">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {reportType === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && classAttendanceLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedClass && classAttendance ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Present Days</TableHead>
                    <TableHead>Total Days</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classAttendance.map((record: any) => (
                    <TableRow key={record.studentId}>
                      <TableCell>{record.studentName}</TableCell>
                      <TableCell>{record.rollNumber}</TableCell>
                      <TableCell>{record.presentDays}</TableCell>
                      <TableCell>{record.totalDays}</TableCell>
                      <TableCell>{record.percentage}%</TableCell>
                      <TableCell>
                        <Badge variant={record.percentage >= 75 ? 'default' : 'destructive'}>
                          {record.percentage >= 75 ? 'Good' : 'Poor'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a class to view attendance report
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === 'performance' && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && classPerfLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedClass && classPerformance ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classPerformance.map((record: any) => (
                    <TableRow key={record._id}>
                      <TableCell>{record.studentId?.firstName} {record.studentId?.lastName}</TableCell>
                      <TableCell>{record.subjectId?.name}</TableCell>
                      <TableCell>{record.marksObtained}</TableCell>
                      <TableCell>{record.maxMarks}</TableCell>
                      <TableCell>{Math.round((record.marksObtained / record.maxMarks) * 100)}%</TableCell>
                      <TableCell>
                        <Badge variant={
                          (record.marksObtained / record.maxMarks * 100) >= 90 ? 'default' :
                          (record.marksObtained / record.maxMarks * 100) >= 80 ? 'secondary' :
                          (record.marksObtained / record.maxMarks * 100) >= 70 ? 'outline' : 'destructive'
                        }>
                          {record.grade || (
                            (record.marksObtained / record.maxMarks * 100) >= 90 ? 'A' :
                            (record.marksObtained / record.maxMarks * 100) >= 80 ? 'B' :
                            (record.marksObtained / record.maxMarks * 100) >= 70 ? 'C' : 'F'
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a class to view performance report
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === 'teachers' && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Teacher</label>
                <Select
                  value={selectedTeacherId}
                  onValueChange={(value) => setSelectedTeacherId(value)}
                  disabled={teachersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.map((teacher: any) => (
                      <SelectItem key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value="month" disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="This Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedTeacherId ? (
              <div className="text-center py-16 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                Select a teacher to view insights and performance metrics.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{teacherAttendancePercent}%</div>
                      <div className="text-xs text-muted-foreground">Last 7 days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Classes Assigned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{teacherAnalytics?.classesCount ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Total classes</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{teacherAnalytics?.subjectsCount ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Assigned subjects</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teacherAttendanceTrend.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No attendance trend data available.</div>
                    ) : (
                      <ChartContainer config={{ attendance: { label: 'Attendance' } }} className="h-60 w-full aspect-auto">
                        <LineChart data={teacherAttendanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} dot />
                        </LineChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === 'students' && (
        <Card>
          <CardHeader>
            <CardTitle>Student Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Class</label>
                <Select value={selectedClass} onValueChange={(value) => {
                    setSelectedClass(value);
                    setSelectedStudentId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls: any) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Student</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsByClass?.map((student: any) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value="month" disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="This Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedStudentId ? (
              <div className="text-center py-16 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                Select a student to view insights and progress metrics.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{studentAttendancePercent}%</div>
                      <div className="text-xs text-muted-foreground">Last 30 days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{studentAverageScore}%</div>
                      <div className="text-xs text-muted-foreground">Across all subjects</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentSubjectPerformance.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No recent data available.</div>
                      ) : (
                        <ul className="space-y-2">
                          {studentSubjectPerformance.slice(0, 5).map((item: any) => (
                            <li key={item.subjectId} className="flex items-center justify-between">
                              <span className="text-sm">{item.subjectId || 'Subject'}</span>
                              <span className="text-sm font-semibold">{item.percentage}%</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentAttendanceTrend.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No attendance trend data available.</div>
                    ) : (
                      <ChartContainer config={{ attendance: { label: 'Attendance' } }} className="h-60 w-full aspect-auto">
                        <LineChart data={studentAttendanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} dot />
                        </LineChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;