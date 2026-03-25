import { GenericTable } from "@/components/dashboard/GenericTable";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import { useClasses } from '@/lib/hooks';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  useTeachers,
  useSubjects,
  useCreateTeacher,
  useDeleteTeacher,
  useUpdateTeacher
} from "@/lib/hooks";
import { TableSkeleton, EmptyState } from "@/components/shared/LoadingStates";
import { AdminPasswordPrompt } from "@/components/shared/AdminPasswordPrompt";

export default function TeachersPage() {
  const { data: teachers = [], isLoading: isTeachersLoading } = useTeachers();
  const { data: subjects = [] } = useSubjects();
  const { mutate: createTeacher, isPending: isCreating } = useCreateTeacher();
  const { mutate: deleteTeacher } = useDeleteTeacher();
  const { mutate: updateTeacher } = useUpdateTeacher();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { verifyAdminPassword } = useStore();
  const VIEW_PASSWORD_PLACEHOLDER = '********';

  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordAccess, setPasswordAccess] = useState<'none' | 'view' | 'edit'>('none');

  const [adminPromptOpen, setAdminPromptOpen] = useState(false);
  const [adminPromptMode, setAdminPromptMode] = useState<'view' | 'edit'>('view');
  const [adminPromptError, setAdminPromptError] = useState<string | null>(null);
  const [adminPromptLoading, setAdminPromptLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFullImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_URL || window.location.origin;
    return `${base.replace(/\/$/, '')}/${path}`;
  };

  const classesQuery = useClasses();
  const classes = Array.isArray(classesQuery.data) ? classesQuery.data : [];
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, watch, setError, formState: { errors } } = useForm<any>();

  const filteredTeachers = teachers.filter((teacher: any) => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: any) => {
    // Deduplicate subjects (remove any duplicates)
    const uniqueSubjects = Array.from(new Set(selectedSubjects));
    
    const submitData = {
      ...data,
      subjects: uniqueSubjects,
      classes: selectedClasses,
      status: 'active',
      employeeId: data.employeeId,
      phoneNumber: data.phoneNumber,
      qualification: data.qualification,
      experience: data.experience,
      joiningDate: data.joiningDate,
      dateOfBirth: data.dateOfBirth,
      // use the controlled state value rather than relying on form data
      isClassTeacher,
      department: data.department,
      address: data.address,
      emergencyContact: data.emergencyContact,
      alternatePhone: data.alternatePhone,
    };

    // Handle password logic
    if (editingId) {
      // For editing: only include password if it was changed (not placeholder)
      if (data.password && data.password !== VIEW_PASSWORD_PLACEHOLDER) {
        submitData.password = data.password;
      } else {
        // Don't include password if it's the placeholder or empty
        delete submitData.password;
      }
    } else {
      // For creation: password is required
      if (!data.password) {
        setError('root', { message: 'Password is required for new teachers' });
        return;
      }
      submitData.password = data.password;
    }

    if (editingId) {
      updateTeacher(
        { id: editingId, data: submitData },
        {
          onSuccess: () => {
            toast({
              title: "Teacher Updated",
              description: `${data.name} has been updated.`,
            });
            setIsDialogOpen(false);
            setEditingId(null);
            setSelectedClasses([]);
            setIsClassTeacher(false);
            reset();
          },
          onError: (err: any) => {
            toast({
              title: "Error",
              description: String(err.message || err) || "Failed to update teacher",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createTeacher(submitData, {
        onSuccess: () => {
          toast({
            title: "Teacher Added",
            description: `${data.name} has been added to the faculty.`,
          });
          setIsDialogOpen(false);
          setSelectedClasses([]);
          setIsClassTeacher(false);
          reset();
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: String(err.message || err) || "Failed to create teacher",
            variant: "destructive",
          });
        },
      });
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Photo must be under 2MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const res = await apiClient.teachers.uploadPhoto(file);
      setValue('profilePhoto', res.photoPath);
      toast({ title: 'Photo uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      deleteTeacher(id, {
        onSuccess: () => {
          toast({
            title: "Teacher Deleted",
            description: "The teacher has been removed from the system.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete teacher",
            variant: "destructive",
          });
        },
      });
    }
  };

  const openAdminPasswordPrompt = (mode: 'view' | 'edit') => {
    setAdminPromptError(null);
    setAdminPromptMode(mode);
    setAdminPromptOpen(true);
  };

  const handleConfirmAdminPassword = async (password: string) => {
    setAdminPromptLoading(true);
    setAdminPromptError(null);

    const ok = await verifyAdminPassword(password);
    if (!ok) {
      setAdminPromptError('Invalid admin password');
      setAdminPromptLoading(false);
      return;
    }

    setPasswordAccess(adminPromptMode === 'edit' ? 'edit' : 'view');
    // When editing, show what the user types so they can confirm it
    setShowPassword(adminPromptMode === 'edit');

    if (adminPromptMode === 'edit') {
      setValue('password', '');
      // Force the input to be enabled and in text mode for editing
      setTimeout(() => setShowPassword(true), 0);
    } else {
      setValue('password', VIEW_PASSWORD_PLACEHOLDER);
    }

    setAdminPromptLoading(false);
    setAdminPromptOpen(false);
  };

  const handlePasswordEyeClick = () => {
    if (passwordAccess === 'none') return;
    setShowPassword((p) => !p);
  };

  const handleEdit = (teacher: any) => {
    setEditingId(teacher._id);
    reset({
      name: teacher.name,
      email: teacher.email,
      password: '', // locked until admin auth
      employeeId: (teacher as any).employeeId || '',
      phoneNumber: (teacher as any).phoneNumber || '',
      qualification: (teacher as any).qualification || '',
      experience: (teacher as any).experience || '',
      joiningDate: (teacher as any).joiningDate ? new Date(teacher.joiningDate).toISOString().substr(0,10) : '',
      dateOfBirth: (teacher as any).dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().substr(0,10) : '',
      isClassTeacher: (teacher as any).isClassTeacher || false,
      department: (teacher as any).department || '',
      address: (teacher as any).address || '',
      emergencyContact: (teacher as any).emergencyContact || '',
      alternatePhone: (teacher as any).alternatePhone || '',
      profilePhoto: (teacher as any).profilePhoto || '',
    });
    setShowPassword(false);
    setPasswordAccess('none'); // Start locked
    // don't store the password; it's hashed and not recoverable
    // Extract IDs from subject objects or use IDs directly
    const subjectIds = (teacher.subjects || []).map((s: any) => 
      typeof s === 'string' ? s : s._id
    );
    setSelectedSubjects(subjectIds);
    const classIds = (teacher.classes || []).map((c: any) =>
      typeof c === 'string' ? c : c._id
    );
    setSelectedClasses(classIds);
    setIsClassTeacher((teacher as any).isClassTeacher || false);
    setIsDialogOpen(true);
  };

  if (isTeachersLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-2">Manage faculty members and assignments.</p>
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-2">Manage faculty members and assignments.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setSelectedSubjects([]);
              setSelectedClasses([]);
              setIsClassTeacher(false);
              setPasswordAccess('none');
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="shrink-0" onClick={() => {
                setEditingId(null);
                setSelectedSubjects([]);
                setSelectedClasses([]);
                setIsClassTeacher(false);
                setShowPassword(false);
                setPasswordAccess('edit');
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update the teacher's profile and assignments." : "Register a new faculty member."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                {errors.root && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">{errors.root.message}</div>}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register("name", { required: true })} placeholder="Sarah Wilson" />
                  {errors.name && <span className="text-xs text-destructive">Name is required</span>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email", { required: true })} placeholder="sarah@example.com" />
                  {errors.email && <span className="text-xs text-destructive">Email is required</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePhoto">Passport Size Photo (Max 2MB)</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted overflow-hidden border">
                      {watch('profilePhoto') ? (
                        <img src={getFullImageUrl(watch('profilePhoto'))} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">No Photo</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input 
                        id="profilePhotoInput" 
                        type="file" 
                        accept="image/*" 
                        onChange={onFileChange}
                        disabled={isUploading}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG or JPEG. Max 2MB.</p>
                      {isUploading && <p className="text-[10px] text-primary animate-pulse">Uploading...</p>}
                    </div>
                  </div>
                  <input type="hidden" {...register('profilePhoto')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Login Password{editingId ? ' (leave blank to keep)' : ''}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type={
                        passwordAccess === 'edit' ? 'text' : showPassword ? 'text' : 'password'
                      }
                      disabled={passwordAccess !== 'edit'}
                      {...register("password", { 
                        required: editingId ? false : true,
                        minLength: { value: 6, message: "Password must be at least 6 characters" }
                      })}
                      placeholder={passwordAccess === 'edit' ? 'Enter new password' : '••••••••'}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={() => openAdminPasswordPrompt('edit')}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordAccess === 'edit' ? (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={handlePasswordEyeClick}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {passwordAccess === 'none' && 'Password locked. Use View/Edit to unlock.'}
                      {passwordAccess === 'view' && 'Passwords are stored securely and cannot be shown. Use Edit to set a new one.'}
                      {passwordAccess === 'edit' && 'Type a new password. Click Show to verify it visually.'}
                    </span>
                  </div>
                  {errors.password && <span className="text-xs text-destructive">{(errors.password?.message as string) || "Password is required"}</span>}
                </div>

                <div className="space-y-2">
                  <Label>Assign Subjects</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
                    {subjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No subjects available</p>
                    ) : (
                      subjects.map((subject: any) => (
                        <label key={subject._id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSubjects.includes(subject._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubjects([...selectedSubjects, subject._id]);
                              } else {
                                setSelectedSubjects(selectedSubjects.filter(id => id !== subject._id));
                              }
                            }}
                            className="w-4 h-4 rounded border-input"
                          />
                          <span className="text-sm font-medium">{subject.name} ({subject.code})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {editingId && (
                  <>
                    <hr className="my-4" />
                    <h2 className="text-lg font-medium">Professional Details</h2>

                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input id="employeeId" {...register("employeeId")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input id="qualification" {...register("qualification")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Input id="experience" {...register("experience")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <Input id="joiningDate" type="date" {...register("joiningDate")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="isClassTeacher"
                        type="checkbox"
                        checked={isClassTeacher}
                        onChange={(e) => setIsClassTeacher(e.target.checked)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <Label htmlFor="isClassTeacher">Class Teacher</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Assign Classes</Label>
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
                        {classes.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No classes available</p>
                        ) : (
                          classes.map((cls: any) => (
                            <label key={cls._id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedClasses.includes(cls._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedClasses([...selectedClasses, cls._id]);
                                  } else {
                                    setSelectedClasses(selectedClasses.filter(id => id !== cls._id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-input"
                              />
                              <span className="text-sm font-medium">{cls.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" {...register("department")} />
                    </div>

                    <hr className="my-4" />
                    <h2 className="text-lg font-medium">Contact Details</h2>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" {...register("address")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input id="emergencyContact" {...register("emergencyContact")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alternatePhone">Alternate Phone</Label>
                      <Input id="alternatePhone" {...register("alternatePhone")} />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreating}>{editingId ? "Update" : "Create"} Teacher</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm max-w-sm print:hidden">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search teachers..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0"
        />
      </div>

      {filteredTeachers.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-12 w-12 opacity-20" />}
          title="No Teachers Found"
          description="Start by adding your first teacher to the system."
        />
      ) : (
        <GenericTable 
          data={filteredTeachers}
          columns={[
            { 
              header: "Name", 
              accessorKey: "name", 
              className: "font-medium",
              cell: (teacher: any) => (
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs overflow-hidden border">
                    {teacher.profilePhoto ? (
                      <img src={getFullImageUrl(teacher.profilePhoto)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      teacher.name.charAt(0)
                    )}
                  </div>
                  <span>{teacher.name}</span>
                </div>
              )
            },
            { header: "Email", accessorKey: "email" },
            { header: "Phone", accessorKey: "phoneNumber" },
            { 
              header: "Subjects", 
              cell: (teacher: any) => {
                // Deduplicate subjects and ensure unique display
                const uniqueSubjects = teacher.subjects && teacher.subjects.length > 0
                  ? Array.from(new Map(
                      teacher.subjects.map((sub: any) => {
                        const id = typeof sub === 'string' ? sub : sub._id;
                        const name = typeof sub === 'string' ? sub : sub.name;
                        return [id, { id, name }];
                      })
                    ).values())
                  : [];

                return (
                  <div className="flex gap-1 flex-wrap">
                    {uniqueSubjects.length > 0 ? (
                      uniqueSubjects.map((sub: any) => (
                        <Badge key={sub.id} variant="secondary" className="text-xs">
                          {sub.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                );
              }
            },
            { 
              header: "Status", 
              cell: (teacher: any) => (
                <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {teacher.status}
                </Badge>
              )
            },
            {
              header: "Actions",
              cell: (teacher: any) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(teacher)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(teacher._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}
      <AdminPasswordPrompt
        open={adminPromptOpen}
        mode={adminPromptMode}
        isLoading={adminPromptLoading}
        error={adminPromptError ?? undefined}
        onOpenChange={(open) => {
          setAdminPromptOpen(open);
          if (!open) {
            setAdminPromptError(null);
          }
        }}
        onConfirm={handleConfirmAdminPassword}
      />
    </div>
  );
}
