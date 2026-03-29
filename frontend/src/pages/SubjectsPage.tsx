import { GenericTable } from "@/components/dashboard/GenericTable";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Edit2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  useSubjects, 
  useCreateSubject, 
  useDeleteSubject, 
  useUpdateSubject,
  useClasses,
  useTeachers,
} from "@/lib/hooks";
import { TableSkeleton, EmptyState } from "@/components/shared/LoadingStates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function SubjectsPage() {
  // State management
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  // Hooks
  const { data: classes = [], isLoading: isClassesLoading } = useClasses();
  const { data: subjects = [], isLoading: isSubjectsLoading } = useSubjects(selectedClassId);
  const { data: teachers = [] } = useTeachers();
  const { mutate: createSubject, isPending: isCreating } = useCreateSubject();
  const { mutate: deleteSubject } = useDeleteSubject();
  const { mutate: updateSubject } = useUpdateSubject();
  const { toast } = useToast();

  // Form management
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: {
      name: "",
      code: "",
      status: "active",
    },
  });

  // Filter subjects by search term
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject: any) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);

  // Get selected class object
  const selectedClass = useMemo(() => {
    return classes.find((c: any) => c._id === selectedClassId);
  }, [classes, selectedClassId]);

  // Form submission
  const onSubmit = (data: any) => {
    if (!selectedClassId) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    // Deduplicate teachers
    const uniqueTeachers = Array.from(new Set(selectedTeachers));
    
    console.log('═══════════════════════════════════════');
    console.log('📝 [SubjectsPage.onSubmit] FORM SUBMITTED');
    console.log('═══════════════════════════════════════');
    console.log('Form Data:', data);
    console.log('Selected Teachers (UI State):', selectedTeachers);
    console.log('Deduplicated Teachers:', uniqueTeachers);
    console.log('Selected Class ID:', selectedClassId);

    const payload = {
      ...data,
      classId: selectedClassId,
      teacherIds: uniqueTeachers,
      status: data.status || "active",
    };

    console.log('📤 [SubjectsPage.onSubmit] FINAL PAYLOAD SENDING TO API:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('═══════════════════════════════════════');

    if (editingId) {
      console.log('🔄 [SubjectsPage] UPDATING existing subject:', editingId);
      updateSubject({ id: editingId, data: payload }, {
        onSuccess: (response) => {
          console.log('═══════════════════════════════════════');
          console.log('✅ [SubjectsPage.updateSubject] SUCCESS RESPONSE:');
          console.log(JSON.stringify(response, null, 2));
          console.log('Teachers in response:', response.teacherIds);
          console.log('═══════════════════════════════════════');
          
          toast({
            title: "Success",
            description: "Subject updated successfully",
          });
          setIsDialogOpen(false);
          reset();
          setSelectedTeachers([]);
          setEditingId(null);
        },
        onError: (error: any) => {
          console.error('❌ [SubjectsPage.updateSubject] ERROR:', error);
          toast({
            title: "Error",
            description: "Failed to update subject",
            variant: "destructive",
          });
        },
      });
    } else {
      console.log('✨ [SubjectsPage] CREATING new subject');
      createSubject(payload, {
        onSuccess: (response) => {
          console.log('═══════════════════════════════════════');
          console.log('✅ [SubjectsPage.createSubject] SUCCESS RESPONSE:');
          console.log(JSON.stringify(response, null, 2));
          console.log('Teachers in response:', response.teacherIds);
          console.log('═══════════════════════════════════════');
          
          toast({
            title: "Success",
            description: "Subject created successfully",
          });
          setIsDialogOpen(false);
          reset();
          setSelectedTeachers([]);
        },
        onError: (error: any) => {
          console.error('❌ [SubjectsPage.createSubject] ERROR:', error);
          toast({
            title: "Error",
            description: "Failed to create subject",
            variant: "destructive",
          });
        },
      });
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      deleteSubject(id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Subject deleted successfully",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete subject",
            variant: "destructive",
          });
        },
      });
    }
  };

  // Handle edit
  const handleEdit = (subject: any) => {
    setEditingId(subject._id);
    setValue("name", subject.name);
    setValue("code", subject.code);
    setValue("status", subject.status);
    
    // Set selected teachers
    const teacherIds = subject.teacherIds?.map((t: any) => 
      typeof t === "string" ? t : t._id
    ) || [];
    setSelectedTeachers(teacherIds);
    
    setIsDialogOpen(true);
  };

  // Toggle teacher selection
  const toggleTeacher = (teacherId: string) => {
    console.log('👥 [toggleTeacher] Toggling teacher:', teacherId, 'Current selected:', selectedTeachers);
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        const updated = prev.filter(id => id !== teacherId);
        console.log('➖ [toggleTeacher] Removed. Updated list:', updated);
        return updated;
      } else {
        const updated = [...prev, teacherId];
        console.log('➕ [toggleTeacher] Added. Updated list:', updated);
        return updated;
      }
    });
  };

  // Close dialog handler
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingId(null);
      reset();
      setSelectedTeachers([]);
    }
  };

  // Loading state
  if (isClassesLoading || isSubjectsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-2">Manage subjects by class.</p>
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-2">Manage subjects by class.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button 
              className="shrink-0" 
              onClick={() => {
                console.log('🆕 [SubjectsPage] Opening Add Subject dialog');
                setEditingId(null);
                setSelectedTeachers([]);
                reset();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              {/* Class Selection (Read-only when editing) */}
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                {editingId ? (
                  <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
                    {selectedClass?.name || "Select a class"}
                  </div>
                ) : (
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger id="class">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Subject Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Subject name is required" })}
                  placeholder="Mathematics"
                />
                {errors.name && (
                  <span className="text-xs text-destructive">{errors.name.message}</span>
                )}
              </div>

              {/* Subject Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="MATH101"
                />
                {errors.code && (
                  <span className="text-xs text-destructive">{errors.code.message}</span>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="active" onValueChange={(value) => setValue("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Teacher Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Assign Teachers (Optional)</Label>
                  {selectedTeachers.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {selectedTeachers.length} selected
                    </span>
                  )}
                </div>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                  {teachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No teachers available</p>
                  ) : (
                    teachers.map((teacher: any) => {
                      const isChecked = selectedTeachers.includes(teacher._id);
                      return (
                        <div 
                          key={teacher._id} 
                          className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition ${
                            isChecked ? 'bg-blue-50' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Checkbox
                            id={`teacher-${teacher._id}`}
                            checked={isChecked}
                            onCheckedChange={() => toggleTeacher(teacher._id)}
                          />
                          <Label
                            htmlFor={`teacher-${teacher._id}`}
                            className="cursor-pointer flex-1 m-0"
                          >
                            {teacher.name}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedTeachers.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ✓ {selectedTeachers.length} teacher{selectedTeachers.length !== 1 ? 's' : ''} will be assigned
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || !selectedClassId}>
                  {editingId ? "Update" : "Create"} Subject
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Selection Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select a Class to View Subjects</Label>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Choose a class..." />
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

      {/* No Class Selected State */}
      {!selectedClassId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a class to view and manage its subjects.
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Class Info */}
      {selectedClassId && selectedClass && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">
            Class: <span className="font-bold">{selectedClass.name}</span>
            {selectedClass.teacherId && (
              <>
                {" • Teacher: "}
                <span className="font-semibold">
                  {typeof selectedClass.teacherId === "string"
                    ? selectedClass.teacherId
                    : selectedClass.teacherId?.name || "N/A"}
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Capacity: {selectedClass.capacity || "N/A"} students
          </p>
        </div>
      )}

      {/* Search Bar */}
      {selectedClassId && (
        <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm max-w-sm print:hidden">
          <Search className="h-4 w-4 text-muted-foreground ml-2" />
          <Input
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0"
          />
        </div>
      )}

      {/* Subjects Table */}
      {selectedClassId ? (
        filteredSubjects.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-12 w-12 opacity-20" />}
            title="No Subjects Found"
            description={
              searchTerm
                ? "No subjects match your search."
                : "Start by adding your first subject for this class."
            }
          />
        ) : (
          <GenericTable
            data={filteredSubjects}
            columns={[
              {
                header: "Name",
                accessorKey: "name",
                className: "font-medium",
                cell: (subject: any) => (
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs">
                      {subject.name.charAt(0)}
                    </div>
                    <span>{subject.name}</span>
                  </div>
                ),
              },
              { header: "Code", accessorKey: "code" },
              {
                header: "Class",
                cell: (subject: any) => {
                  const className = typeof subject.classId === "string" 
                    ? subject.classId 
                    : subject.classId?.name || "N/A";
                  return <span>{className}</span>;
                },
              },
              {
                header: "Teachers",
                cell: (subject: any) => {
                  // STRICT DEBUGGING: Log exactly what we receive from API
                  console.log('🎯 [Teachers Column] Raw subject data:', {
                    id: subject._id,
                    name: subject.name,
                    teacherIds: subject.teacherIds,
                    teacherIdsIsArray: Array.isArray(subject.teacherIds),
                    teacherIdsLength: subject.teacherIds?.length,
                    firstTeacher: subject.teacherIds?.[0],
                  });
                  
                  // CRITICAL: Ensure teacherIds is an array
                  const teacherList = Array.isArray(subject.teacherIds) ? subject.teacherIds : [];
                  
                  if (teacherList.length === 0) {
                    console.log('❌ [Teachers Column] No teachers - subject has empty array');
                    return (
                      <span className="text-xs text-muted-foreground font-medium">Unassigned</span>
                    );
                  }

                  // Deduplicate and validate teacher objects
                  const uniqueTeachers = Array.from(
                    new Map(
                      teacherList.map((t: any) => {
                        const id = typeof t === "string" ? t : t?._id;
                        return [id, t];
                      })
                    ).values()
                  );

                  console.log('✅ [Teachers Column] Valid teachers:', {
                    count: uniqueTeachers.length,
                    details: uniqueTeachers.map((t: any) => ({
                      id: typeof t === "string" ? t : t._id,
                      name: typeof t === "string" ? "NAME_NOT_AVAILABLE" : t.name,
                      type: typeof t
                    }))
                  });

                  if (uniqueTeachers.length === 0) {
                    return (
                      <span className="text-xs text-muted-foreground font-medium">Unassigned</span>
                    );
                  }

                  return (
                    <div className="flex flex-wrap gap-1">
                      {uniqueTeachers.slice(0, 2).map((teacher: any) => {
                        const teacherId = typeof teacher === "string" ? teacher : teacher?._id;
                        const teacherName = typeof teacher === "string" ? "Unknown" : (teacher?.name || "Unknown");
                        
                        return (
                          <Badge key={teacherId} variant="secondary" className="text-xs">
                            {teacherName}
                          </Badge>
                        );
                      })}
                      {uniqueTeachers.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{uniqueTeachers.length - 2}
                        </Badge>
                      )}
                    </div>
                  );
                },
              },
              {
                header: "Status",
                cell: (subject: any) => (
                  <Badge variant={subject.status === "active" ? "default" : "secondary"}>
                    {subject.status}
                  </Badge>
                ),
              },
              {
                header: "Actions",
                cell: (subject: any) => (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(subject)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subject._id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Select a class above to view its subjects</p>
        </div>
      )}
    </div>
  );
}
