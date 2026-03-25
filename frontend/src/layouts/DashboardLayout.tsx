import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Bell,
  LogOut,
  Menu,
  School,
  X,
  CheckCircle,
  Award,
  FileText,
  FileBarChart,
  HelpCircle
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { currentUser, logout } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: GraduationCap },
    { name: 'Teachers', href: '/teachers', icon: Users },
    { name: 'Classes', href: '/classes', icon: School },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Attendance', href: '/attendance', icon: CheckCircle },
    { name: 'Marks', href: '/marks', icon: Award },
    { name: 'Materials', href: '/materials', icon: FileText },
    { name: 'Assignments', href: '/assignments', icon: BookOpen },
    { name: 'Quizzes', href: '/quizzes', icon: HelpCircle },
    { name: 'Timetable', href: '/timetable', icon: Calendar },
    { name: 'Notices', href: '/notifications', icon: Bell },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <School className="h-6 w-6 text-primary mr-2" />
        <span className="font-display font-bold text-xl tracking-tight">EduNexus</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center p-2 rounded-lg bg-sidebar-accent/50 mb-4">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-sidebar-foreground">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser?.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
         <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-2 font-display font-bold text-lg">EduNexus</span>
          </div>
          
          <div className="hidden md:flex flex-1 items-center justify-between">
             <h2 className="text-lg font-semibold text-foreground">
               {navigation.find(n => n.href === location)?.name || 'Dashboard'}
             </h2>
             <div className="flex items-center space-x-4">
               <NotificationDropdown />
             </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
