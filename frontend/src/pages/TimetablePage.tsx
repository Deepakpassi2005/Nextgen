import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Save, Edit2, RotateCcw } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  useClasses,
  useTimetableByClass,
  useTeachers,
  useSubjects,
  useCreateTimetableSlot,
  useDeleteTimetableSlot,
  useTimetableConfig,
  useSaveTimetableConfig,
} from "@/lib/hooks";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { TableSkeleton } from "@/components/shared/LoadingStates";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface TimetableSlot {
  _id: string;
  day: string;
  timeSlot: string;
  subjectId?: { _id: string; name: string };
  teacherId?: { _id: string; name: string };
}

function generateTimeSlots(
  startTime: string,
  duration: number,
  count: number
) {
  const slots: string[] = [];
  const [h, m] = startTime.split(":").map(Number);
  let totalMinutes = h * 60 + m;

  for (let i = 0; i < count; i++) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    const formatted = new Date(0, 0, 0, hour, minute).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    );

    slots.push(formatted);
    totalMinutes += duration;
  }

  return slots;
}

export default function TimetablePage() {
  const { data: classes = [] } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const { data: subjects = [] } = useSubjects();

  const [selectedClass, setSelectedClass] = useState<string>("");

  const [startTime, setStartTime] = useState("09:00");
  const [periodDuration, setPeriodDuration] = useState(60);
  const [periodCount, setPeriodCount] = useState(7);
  const [configMode, setConfigMode] = useState<'view' | 'edit'>('view');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Load saved config when class is selected
  const { data: savedConfig } = useTimetableConfig(selectedClass);
  const { mutate: saveConfig } = useSaveTimetableConfig();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedClass && savedConfig) {
      console.log('Loading saved config:', savedConfig);
      setStartTime(savedConfig.startTime || '09:00');
      setPeriodDuration(savedConfig.periodDuration || 60);
      setPeriodCount(savedConfig.periodCount || 7);
      setConfigMode('view');
    }
  }, [selectedClass, savedConfig]);

  const timeSlots = useMemo(() => {
    return generateTimeSlots(startTime, periodDuration, periodCount);
  }, [startTime, periodDuration, periodCount]);

  const { data: timetable = [], isLoading } =
    useTimetableByClass(selectedClass);

  const { mutate: createSlot, isPending: isCreating } = useCreateTimetableSlot();
  const { mutate: deleteSlot } = useDeleteTimetableSlot();

  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const grouped = useMemo(() => {
    if (!Array.isArray(timetable)) return {};

    return timetable.reduce(
      (acc: Record<string, TimetableSlot[]>, slot: TimetableSlot) => {
        const key = `${slot.day}_${slot.timeSlot}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
      },
      {}
    );
  }, [timetable]);

  // Get only time slots that have assignments
  const usedTimeSlots = useMemo(() => {
    const used = new Set<string>();
    Object.keys(grouped).forEach(key => {
      const [day, time] = key.split('_');
      used.add(time);
    });
    return Array.from(used);
  }, [grouped]);

  // Filter to only show used time slots (or all if in edit mode)
  const displayedTimeSlots = useMemo(() => {
    if (configMode === 'edit') {
      return timeSlots;
    }
    return timeSlots.filter(slot => usedTimeSlots.includes(slot));
  }, [timeSlots, usedTimeSlots, configMode]);

  const openAddDialog = (day: string, time: string) => {
    if (!selectedClass) {
      toast({
        title: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    setSelectedDay(day);
    setSelectedTime(time);
    setDialogOpen(true);
  };

  const handleCreateSlot = () => {
    console.log('Save Slot clicked', { selectedSubject, selectedTeacher });
    
    if (!selectedSubject || !selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select both subject and teacher",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      classId: selectedClass,
      day: selectedDay,
      timeSlot: selectedTime,
      subjectId: selectedSubject,
      teacherId: selectedTeacher,
    };

    console.log('Creating slot with payload:', payload);

    createSlot(payload, {
      onSuccess: (response) => {
        console.log('Slot created successfully:', response);
        toast({
          title: "Success",
          description: "Slot added successfully",
        });
        setDialogOpen(false);
        setSelectedSubject("");
        setSelectedTeacher("");
        setSelectedDay("");
        setSelectedTime("");
      },
      onError: (error: any) => {
        console.error('Error creating slot:', error);
        toast({
          title: "Error",
          description: error?.message || "Failed to add slot",
          variant: "destructive",
        });
      },
    });
  };

  const handleSaveConfig = () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    setIsSavingConfig(true);
    saveConfig(
      {
        classId: selectedClass,
        startTime,
        periodDuration,
        periodCount,
      },
      {
        onSuccess: () => {
          setIsSavingConfig(false);
          toast({
            title: "Success",
            description: "Timetable configuration saved",
          });
          // ensure notification count updates immediately
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          setConfigMode('view');
        },
        onError: (error: any) => {
          setIsSavingConfig(false);
          toast({
            title: "Error",
            description: error?.message || "Failed to save configuration",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading && selectedClass) {
    return <TableSkeleton rows={periodCount} columns={7} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Timetable
        </h1>
        <p className="text-muted-foreground">
          Manage weekly class schedules
        </p>
      </div>

      {/* Compact Controls Row */}
      <div className="flex flex-wrap items-end gap-4 bg-card border p-4 rounded-xl shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">
            Class
          </label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls: any) => (
                <SelectItem key={cls._id} value={cls._id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {configMode === 'view' && selectedClass && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigMode('edit')}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Config
            </Button>
          </>
        )}

        {configMode === 'edit' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-[130px]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Duration (min)
              </label>
              <Input
                type="number"
                value={periodDuration}
                onChange={(e) =>
                  setPeriodDuration(Number(e.target.value) || 60)
                }
                className="w-[110px]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Periods
              </label>
              <Input
                type="number"
                value={periodCount}
                onChange={(e) =>
                  setPeriodCount(Number(e.target.value) || 7)
                }
                className="w-[90px]"
              />
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSavingConfig ? "Saving..." : "Save"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigMode('view')}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}

        {configMode === 'view' && selectedClass && (
          <div className="text-xs text-muted-foreground ml-auto">
            {startTime} • {periodDuration}min • {displayedTimeSlots.length} periods
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      {!selectedClass ? (
        <div className="text-center py-20 text-muted-foreground">
          Select a class to view timetable
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto bg-card shadow-sm">
          <div className="min-w-[900px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b bg-muted/50 font-medium text-sm">
              <div className="p-4 border-r">Time</div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-4 border-r text-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {displayedTimeSlots.map((time) => {
              return (
                <div
                  key={time}
                  className="grid grid-cols-7 border-b text-sm"
                >
                  <div className="p-4 border-r bg-muted/20 text-center font-medium">
                    {time}
                  </div>

                  {DAYS.map((day) => {
                    const key = `${day}_${time}`;
                    const slots = grouped[key] || [];

                    return (
                      <div
                        key={key}
                        className="p-2 border-r min-h-[85px]"
                      >
                        {slots.length > 0 ? (
                          slots.map((slot: any) => (
                            <Card
                              key={slot._id}
                              className="p-2 relative group hover:shadow-md transition"
                            >
                              <div className="font-semibold text-primary text-xs">
                                {slot.subjectId?.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {slot.teacherId?.name}
                              </div>

                              <button
                                onClick={() =>
                                  deleteSlot(slot._id)
                                }
                                className="absolute top-1 right-1 text-destructive opacity-0 group-hover:opacity-100 text-xs"
                              >
                                ✕
                              </button>
                            </Card>
                          ))
                        ) : (
                          <div
                            onClick={() =>
                              openAddDialog(day, time)
                            }
                            className="h-full flex items-center justify-center border-2 border-dashed rounded hover:border-primary cursor-pointer transition"
                          >
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Slot Dialog */}
      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            // Reset form when closing dialog
            setSelectedSubject("");
            setSelectedTeacher("");
            setSelectedDay("");
            setSelectedTime("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Slot</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="font-semibold">
              {selectedDay} - {selectedTime}
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateSlot}
              disabled={isCreating || !selectedSubject || !selectedTeacher}
              className="w-full"
            >
              {isCreating ? "Saving..." : "Save Slot"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
