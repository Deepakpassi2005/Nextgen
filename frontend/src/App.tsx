import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import StudentsPage from "@/pages/StudentsPage";
import TeachersPage from "@/pages/TeachersPage";
import ClassesPage from "@/pages/ClassesPage";
import SubjectsPage from "@/pages/SubjectsPage";
import LoginPage from "@/pages/LoginPage";
import TimetablePage from "@/pages/TimetablePage";
import AttendancePage from "@/pages/AttendancePage";
import MarksPage from "@/pages/MarksPage";
import MaterialsPage from "@/pages/MaterialsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ReportsPage from "@/pages/ReportsPage";
import QuizzesPage from "@/pages/QuizzesPage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/students">
        <ProtectedRoute component={StudentsPage} />
      </Route>
      <Route path="/teachers">
        <ProtectedRoute component={TeachersPage} />
      </Route>
      <Route path="/classes">
        <ProtectedRoute component={ClassesPage} />
      </Route>
      <Route path="/subjects">
        <ProtectedRoute component={SubjectsPage} />
      </Route>
      <Route path="/notices">
        <ProtectedRoute component={NotificationsPage} />
      </Route>
      {/* /analytics is now consolidated into /reports */}
      <Route path="/analytics">
        <ProtectedRoute component={ReportsPage} />
      </Route>
      <Route path="/timetable">
        <ProtectedRoute component={TimetablePage} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={AttendancePage} />
      </Route>
      <Route path="/marks">
        <ProtectedRoute component={MarksPage} />
      </Route>
      <Route path="/materials">
        <ProtectedRoute component={MaterialsPage} />
      </Route>
      <Route path="/assignments">
        <ProtectedRoute component={AssignmentsPage} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={NotificationsPage} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} />
      </Route>
      <Route path="/quizzes">
        <ProtectedRoute component={QuizzesPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { initialize } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
