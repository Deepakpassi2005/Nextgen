import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivities } from "@/lib/hooks";
import io, { Socket } from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// derive backend url from environment or same-origin at runtime
const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export function NotificationDropdown() {
  const { data: activities = [], isLoading } = useActivities(10);
  const [realTimeActivities, setRealTimeActivities] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.io server
    const socketIO = io(API_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketIO.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    // Listen for activity events
    socketIO.on('activity', (activity: any) => {
      console.log('New activity received:', activity);
      setRealTimeActivities((prev) => [activity, ...prev.slice(0, 9)]);
    });

    socketIO.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    setSocket(socketIO);

    return () => {
      socketIO.disconnect();
    };
  }, []);

  // Combine real-time activities with fetched activities
  const allActivities = [...realTimeActivities, ...activities].slice(0, 10);
  const unread = allActivities.filter((a: any) => !a.read);

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'class_created': '📚',
      'class_updated': '📝',
      'class_deleted': '🗑️',
      'student_created': '👨‍🎓',
      'student_updated': '👤',
      'student_deleted': '❌',
      'teacher_created': '👨‍🏫',
      'teacher_updated': '✏️',
      'teacher_deleted': '🚪',
      'notice_created': '📢',
      'notice_updated': '📌',
      'notice_published': '📣',
      'notice_deleted': '🗑️',
      'subject_created': '📖',
      'subject_updated': '📕',
      'subject_deleted': '🗑️',
      // timetable configuration events
      'timetable_config_created': '🗓️',
      'timetable_config_updated': '🗓️',
    };
    return icons[type] || '📌';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          {unread.length > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive border border-background animate-pulse"></span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Activities</span>
          {unread.length > 0 && (
            <span className="text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">
              {unread.length} new
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {isLoading && realTimeActivities.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading activities...
          </div>
        ) : allActivities.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No activities yet
          </div>
        ) : (
          <>
            <div className="max-h-[400px] overflow-y-auto">
              {allActivities.map((activity: any) => (
                <DropdownMenuItem
                  key={activity._id}
                  className="flex flex-col items-start py-3 px-3 cursor-pointer hover:bg-accent rounded-md transition-colors"
                >
                  <div className="flex items-start gap-2 w-full">
                    {!activity.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        <p
                          className={`text-sm font-medium line-clamp-2 ${
                            !activity.read ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {activity.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {activity.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.createdAt
                            ? new Date(activity.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center py-2 text-xs text-muted-foreground hover:text-foreground">
              View all activities
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
