import React, { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useClasses, useStudents, useStudentsByClass, useCreateStudent, useDeleteStudent, useUpdateStudent } from '@/lib/hooks';
import { useStore } from '@/lib/store';
import { apiClient, BASE_URL } from '@/lib/api';
import { TableSkeleton, EmptyState } from '@/components/shared/LoadingStates';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenericTable } from '@/components/dashboard/GenericTable';
import { AlertCircle, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { AdminPasswordPrompt } from '@/components/shared/AdminPasswordPrompt';

// Strict typed interfaces used by this page
interface ClassItem {
  _id: string;
  name: string;
  [key: string]: unknown;
}

interface StudentItem {
  _id: string;
  name?: string; // may not be present from backend
  firstName?: string;
  middleName?: string;
  lastName?: string;
  rollNumber?: string;
  classId?: string | ClassItem;
  email?: string;
  // additional properties we may display/edit
  password?: string;
  gender?: string;
  dateOfBirth?: string;
  studentPhoto?: string;
  admissionNumber?: string;
  academicYear?: string;
  section?: string;
  studentMobileNumber?: string;
  residentialAddress?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  parentMobileNumber?: string;
  parentEmail?: string;
  admissionDate?: string;
  previousSchool?: string;
  idProofNumber?: string;
  category?: string;
  [key: string]: unknown;
}

export default function StudentsPage(): React.ReactElement {
  const { toast } = useToast();
  const verifyAdminPassword = useStore((s) => s.verifyAdminPassword);

  const VIEW_PASSWORD_PLACEHOLDER = '********';
  const [passwordAccess, setPasswordAccess] = useState<'none' | 'view' | 'edit'>('none');
  const [isUploading, setIsUploading] = useState(false);

  const getFullImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}/${path.replace(/^\/+/, '')}`;
  };

  // Data hooks (these return unknown-underlying data; we coerce safely)
  const classesQuery = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // always create both queries to satisfy hook order rules
  const allStudentsQuery = useStudents();
  const classStudentsQuery = useStudentsByClass(selectedClassId);
  const studentsQuery = selectedClassId ? classStudentsQuery : allStudentsQuery;

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>();

  const [adminPromptOpen, setAdminPromptOpen] = useState(false);
  const [adminPromptMode, setAdminPromptMode] = useState<'view' | 'edit'>('view');
  const [adminPromptError, setAdminPromptError] = useState<string | null>(null);
  const [adminPromptLoading, setAdminPromptLoading] = useState(false);

  // Safe data extraction with defensive checks
  const classes: ClassItem[] = useMemo(() => {
    return Array.isArray(classesQuery.data) ? classesQuery.data as ClassItem[] : [];
  }, [classesQuery.data]);

  const students: StudentItem[] = useMemo(() => {
    return Array.isArray(studentsQuery.data) ? studentsQuery.data as StudentItem[] : [];
  }, [studentsQuery.data]);

  const isLoading = classesQuery.isLoading || studentsQuery.isLoading;
  const error = classesQuery.error || studentsQuery.error;

  const selectedClass = classes.find((c) => c._id === selectedClassId) || null;

  // form submission handler for both create and update
  const onSubmit = (data: any) => {
    // build payload respecting API required fields
    const payload: any = { ...data };
    // split name into first/last parts
    if (data.name) {
      const parts = data.name.trim().split(/\s+/);
      payload.firstName = parts.shift();
      payload.lastName = parts.join(' ');
    }
    delete payload.name;

    const password = data.password;
    // normalize password behavior when the field is only for showing/hiding
    if (password === VIEW_PASSWORD_PLACEHOLDER) {
      delete payload.password;
    }

    if (editingId) {
      // For editing: only include password if it was changed (not placeholder)
      if (data.password && data.password !== VIEW_PASSWORD_PLACEHOLDER) {
        payload.password = data.password;
      } else {
        // Don't include password if it's the placeholder or empty
        delete payload.password;
      }
    } else {
      // Creation requires a password
      if (!data.password) {
        toast({ title: 'Password is required for new students', variant: 'destructive' });
        return;
      }
      payload.password = data.password;
    }

    if (editingId) {
      updateStudent.mutateAsync({ id: editingId, data: payload } as any).then(() => {
        toast({ title: 'Student updated' });
        setIsDialogOpen(false);
        setEditingId(null);
        reset();
      }).catch((e: unknown) => {
        let message = String((e as Error)?.message || e);
        // catch Mongo duplicate key admissionNumber
        if (/dup key/.test(message) && /admissionNumber/.test(message)) {
          message = 'Admission number already exists';
        }
        toast({ title: 'Update failed', description: message, variant: 'destructive' });
      });
    } else {
      createStudent.mutateAsync(payload as any).then(() => {
        toast({ title: 'Student created' });
        // show the new student by switching filter to its class
        if (payload.classId) setSelectedClassId(payload.classId);
        setIsDialogOpen(false);
        setEditingId(null);
        reset();
      }).catch((e: unknown) => {
        let message = String((e as Error)?.message || e);
        // catch Mongo duplicate key admissionNumber
        if (/dup key/.test(message) && /admissionNumber/.test(message)) {
          message = 'Admission number already exists';
        }
        toast({ title: 'Create failed', description: message, variant: 'destructive' });
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
      const res = await apiClient.students.uploadPhoto(file);
      setValue('studentPhoto', res.photoPath);
      toast({ title: 'Photo uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try {
      await deleteStudent.mutateAsync(id as any);
      toast({ title: 'Student deleted' });
    } catch (e: unknown) {
      toast({ title: 'Delete failed', description: String((e as Error)?.message || e), variant: 'destructive' });
    }
  };

  const requestAdminPassword = async (allowEdit: boolean) => {
    setAdminPromptError(null);
    setAdminPromptMode(allowEdit ? 'edit' : 'view');
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
    setShowPassword(false);

    if (adminPromptMode === 'edit') {
      setValue('password', '');
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

  const handleEdit = (student: StudentItem) => {
    setEditingId(student._id);
    setPasswordAccess('none');

    // compute display name from parts if necessary
    const displayName = student.name || [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(' ');
    reset({
      name: displayName,
      rollNumber: student.rollNumber,
      email: student.email,
      admissionNumber: student.admissionNumber,
      classId: typeof student.classId === 'string' ? student.classId : (student.classId as any)?._id || '',
      password: '',
      motherName: (student as any).motherName || '',
      guardianName: (student as any).guardianName || '',
      parentMobileNumber: (student as any).parentMobileNumber || '',
      parentEmail: (student as any).parentEmail || '',
      admissionDate: (student as any).admissionDate || '',
      previousSchool: (student as any).previousSchool || '',
      idProofNumber: (student as any).idProofNumber || '',
      category: (student as any).category || '',
      studentPhoto: student.studentPhoto || '',
      gender: student.gender || 'male',
      dateOfBirth: (student as any).dateOfBirth ? new Date((student as any).dateOfBirth).toISOString().substring(0, 10) : '',
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const tableColumns = useMemo(() => [
    { 
      header: 'Roll', 
      accessorKey: 'roll' as const,
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0 border">
            {row.photo ? (
              <img src={getFullImageUrl(row.photo)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                {row.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <span>{row.roll}</span>
        </div>
      )
    },
    { header: 'Name', accessorKey: 'name' as const },
    { header: 'Email', accessorKey: 'email' as const },
    { header: 'Class', accessorKey: 'className' as const },
    { header: 'Actions', cell: (row: any) => row.actions },
  ], []);

  const tableData = students.map((s) => ({
    id: s._id,
    roll: s.rollNumber ?? '-',
    photo: s.studentPhoto,
    name: s.name || [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') || '-',
    email: s.email ?? '-',
    className: typeof s.classId === 'string' ? (classes.find(c => c._id === s.classId)?.name ?? '-') : (s.classId && (s.classId as ClassItem).name) || '-',
    actions: (
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => handleEdit(s)}><Edit2 className="h-4 w-4" /></Button>
        <Button variant="ghost" onClick={() => handleDelete(s._id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">Manage students by class.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClassId === '' ? '__all' : selectedClassId} onValueChange={(v) => setSelectedClassId(v === '__all' ? '' : v)}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setPasswordAccess('none');
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null);
                setShowPassword(false);
                setPasswordAccess('edit');
                // if a class is currently selected for filtering, prefill it
                reset({ classId: selectedClassId || '' });
              }}>Add Student</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update the student's information below." : "Create a new student record in the system."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register('name', { required: true })} placeholder="John Doe" />
                  {errors.name && <span className="text-xs text-destructive">Name is required</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionNumber">Admission Number</Label>
                  <Input id="admissionNumber" {...register('admissionNumber', { required: !editingId })} placeholder="A12345" />
                  {errors.admissionNumber && <span className="text-xs text-destructive">Admission number is required</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input id="rollNumber" {...register('rollNumber', { required: true })} placeholder="001" />
                  {errors.rollNumber && <span className="text-xs text-destructive">Roll number is required</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email', { required: !editingId })} placeholder="student@example.com" />
                  {errors.email && <span className="text-xs text-destructive">Email is required</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password{editingId ? ' (leave blank to keep)' : ''}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type={
                        passwordAccess === 'edit' ? 'text' : showPassword ? 'text' : 'password'
                      }
                      disabled={passwordAccess !== 'edit'}
                      {...register('password', { 
                        required: editingId ? false : true,
                        minLength: { value: 6, message: "Password must be at least 6 characters" }
                      })}
                      placeholder={passwordAccess === 'edit' ? 'Enter new password' : '••••••••'}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={() => requestAdminPassword(true)}
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
                      {passwordAccess === 'none' && 'Password locked. Use Edit to unlock.'}
                      {passwordAccess === 'view' && 'Passwords are stored securely and cannot be shown. Use Edit to set a new one.'}
                      {passwordAccess === 'edit' && 'Type a new password. Click Show to verify it visually.'}
                    </span>
                  </div>
                  {errors.password && <span className="text-xs text-destructive">{(errors.password?.message as string) || "Password is required"}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <select
                    id="classId"
                    {...register('classId', { required: true })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.classId && <span className="text-xs text-destructive">Class is required</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentPhoto">Passport Size Photo (Max 2MB)</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted overflow-hidden border">
                      {watch('studentPhoto') ? (
                        <img src={getFullImageUrl(watch('studentPhoto'))} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">No Photo</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input 
                        id="studentPhotoInput" 
                        type="file" 
                        accept="image/*" 
                        onChange={onFileChange}
                        disabled={isUploading}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG or JPEG. Max 2MB.</p>
                      {isUploading && <p className="text-[10px] text-primary animate-pulse">Uploading...</p>}
                    </div>
                  </div>
                  <input type="hidden" {...register('studentPhoto')} />
                </div>

                <h3 className="text-lg font-semibold pt-4">Personal Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      {...register('gender')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentMobileNumber">Student Phone</Label>
                  <Input id="studentMobileNumber" {...register('studentMobileNumber')} placeholder="Phone number" />
                </div>

                <h3 className="text-lg font-semibold pt-4">Parent/Guardian Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father’s Name</Label>
                    <Input id="fatherName" {...register('fatherName')} placeholder="Father's Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother’s Name</Label>
                    <Input id="motherName" {...register('motherName')} placeholder="Mother's Name" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentMobileNumber">Parent Phone</Label>
                    <Input id="parentMobileNumber" {...register('parentMobileNumber')} placeholder="Parent Phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input id="parentEmail" type="email" {...register('parentEmail')} placeholder="parent@example.com" />
                  </div>
                </div>

                {editingId && (
                  <>
                    <h3 className="text-lg font-semibold pt-4">Academic Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="academicYear">Academic Year</Label>
                        <Input id="academicYear" {...register('academicYear')} placeholder="2025-26" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Input id="section" {...register('section')} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="residentialAddress">Address</Label>
                      <Input id="residentialAddress" {...register('residentialAddress')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Guardian Name</Label>
                      <Input id="guardianName" {...register('guardianName')} />
                    </div>

                    <h3 className="text-lg font-semibold pt-4">Official</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admissionDate">Admission Date</Label>
                        <Input id="admissionDate" type="date" {...register('admissionDate')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="previousSchool">Previous School</Label>
                        <Input id="previousSchool" {...register('previousSchool')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="idProofNumber">ID Proof #</Label>
                        <Input id="idProofNumber" {...register('idProofNumber')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" {...register('category')} />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingId ? 'Update' : 'Create'} Student</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error ? (
        <div>
          <p className="text-destructive">Error loading data.</p>
        </div>
      ) : students.length === 0 ? (
        <EmptyState icon={<AlertCircle size={32} />} title={selectedClass ? 'No students in this class' : 'No students available'} description={selectedClass ? 'There are currently no students enrolled in this class.' : 'No students are available. Please add a student to get started.'} />
      ) : (
        <GenericTable
          title={selectedClass ? `${selectedClass.name} — Students` : 'All Students'}
          columns={tableColumns}
          data={tableData}
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



