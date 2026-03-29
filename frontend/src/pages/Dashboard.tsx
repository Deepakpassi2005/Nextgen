import { StatsCard } from "@/components/dashboard/StatsCard";
import { 
  Users, 
  GraduationCap, 
  School, 
  Bell, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Clock,
  ArrowRight,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { useDashboardSummary, usePerformanceByClass, useRecentNotices } from "@/lib/hooks";
import { CardSkeleton } from "@/components/shared/LoadingStates";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const { data: performanceData = [] } = usePerformanceByClass();
  const { data: recentNotices = [] } = useRecentNotices(5);

  if (isSummaryLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your school overview.</p>
        </div>
        <CardSkeleton count={6} />
      </div>
    );
  }

  const stats = [
    {
      title: "Total Students",
      value: summary?.totalStudents || 0,
      icon: GraduationCap,
      trend: "+12%",
      description: "from last month"
    },
    {
      title: "Total Teachers",
      value: summary?.totalTeachers || 0,
      icon: Users,
      trend: "+2",
      description: "newly joined"
    },
    {
      title: "Total Classes",
      value: summary?.totalClasses || 0,
      icon: School,
      description: "Active sessions"
    },
    {
      title: "Notices",
      value: summary?.totalNotices || 0,
      icon: Bell,
      description: "Posted this month"
    },
    {
      title: "Teacher Attendance",
      value: `${summary?.teacherAttendancePercentage || 94}%`,
      icon: CheckCircle,
      trend: "+3%",
      description: "Present today"
    },
    {
      title: "Avg Performance",
      value: `${summary?.avgPerformance || 82}%`,
      icon: TrendingUp,
      trend: "+5%",
      description: "Class average"
    }
  ];

  const quickActions = [
    { name: "Add Student", icon: Plus, href: "/students", color: "bg-blue-500" },
    { name: "Add Teacher", icon: Plus, href: "/teachers", color: "bg-emerald-500" },
    { name: "Create Class", icon: School, href: "/classes", color: "bg-purple-500" },
    { name: "Timetable", icon: Calendar, href: "/timetable", color: "bg-amber-500" },
    { name: "New Notice", icon: Bell, href: "/notices", color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your school overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center text-xs gap-1">
                  <action.icon className="h-5 w-5" />
                  {action.name}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Average scores by class</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#6366f1">
                      {performanceData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No performance data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Notices */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Notices</span>
                <Link href="/notices">
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentNotices.slice(0, 4).map((notice: any) => (
                <div key={notice._id} className="pb-3 border-b last:border-b-0 last:pb-0">
                  <div className="font-medium text-sm mb-1 line-clamp-2">{notice.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge 
                      variant={notice.priority === 'high' ? 'destructive' : notice.priority === 'medium' ? 'default' : 'secondary'} 
                      className="text-[10px]"
                    >
                      {notice.priority}
                    </Badge>
                    <span>{new Date(notice.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {recentNotices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No notices yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary?.activities && summary.activities.length > 0 ? (
              summary.activities.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
