import React, { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useClasses, useStudents, useStudentsByClass, useCreateStudent, useDeleteStudent, useUpdateStudent } from '@/lib/hooks';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';

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
  // admin authentication needed to reveal/edit existing password
  const [isAuthForPassword, setIsAuthForPassword] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<any>();

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
  const onSubmit = async (data: any) => {
    // build payload respecting API required fields
    const payload: any = { ...data };
    // split name into first/last parts
    if (data.name) {
      const parts = data.name.trim().split(/\s+/);
      payload.firstName = parts.shift();
      payload.lastName = parts.join(' ');
    }
    delete payload.name;

    if (editingId) {
      // don't override password if blank
      if (!data.password) delete payload.password;
    } else {
      if (data.password) payload.password = data.password;
      // admissionNumber required on create, enforced by validation above
    }

    try {
      if (editingId) {
        await updateStudent.mutateAsync({ id: editingId, data: payload } as any);
        toast({ title: 'Student updated' });
      } else {
        await createStudent.mutateAsync(payload as any);
        toast({ title: 'Student created' });
        // show the new student by switching filter to its class
        if (payload.classId) setSelectedClassId(payload.classId);
      }
      setIsDialogOpen(false);
      setEditingId(null);
      reset();
    } catch (e: unknown) {
      let message = String((e as Error)?.message || e);
      // catch Mongo duplicate key admissionNumber
      if (/dup key/.test(message) && /admissionNumber/.test(message)) {
        message = 'Admission number already exists';
      }
      toast({ title: editingId ? 'Update failed' : 'Create failed', description: message, variant: 'destructive' });
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

  // When the eye icon is clicked we may need to verify the admin password
  const handlePasswordEyeClick = () => {
    if (editingId && !isAuthForPassword) {
      const ans = prompt('Enter admin password to unlock this field');
      if (ans === 'admin') {
        setIsAuthForPassword(true);
        // field is now unlocked for editing; existing value is hidden for security
        setShowPassword(false); // keep masked since we can't show real password
        toast({ description: 'Password field unlocked – enter a new value to change it.' });
      } else {
        toast({ title: 'Incorrect admin password', variant: 'destructive' });
      }
    } else {
      setShowPassword(p => !p);
    }
  };

  const handleEdit = (student: StudentItem) => {
    setEditingId(student._id);
    // compute display name from parts if necessary
    const displayName = student.name || [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(' ');
    reset({
      name: displayName,
      rollNumber: student.rollNumber,
      email: student.email,
      // the password is available in the object (plain-text in dev mode); we
      // do not populate it here until admin unlocks the field.
      password: '',
      motherName: (student as any).motherName || '',
      guardianName: (student as any).guardianName || '',
      parentMobileNumber: (student as any).parentMobileNumber || '',
      parentEmail: (student as any).parentEmail || '',
      admissionDate: (student as any).admissionDate || '',
      previousSchool: (student as any).previousSchool || '',
      idProofNumber: (student as any).idProofNumber || '',
      category: (student as any).category || '',
    });
    // note: password is hashed by backend, so we don't store it here

    setShowPassword(false);
    setIsAuthForPassword(false);
    setIsDialogOpen(true);
  };

  const tableColumns = useMemo(() => [
    { header: 'Roll', accessorKey: 'roll' as const },
    { header: 'Name', accessorKey: 'name' as const },
    { header: 'Email', accessorKey: 'email' as const },
    { header: 'Class', accessorKey: 'className' as const },
    { header: 'Actions', cell: (row: any) => row.actions },
  ], []);

  const tableData = students.map((s) => ({
    id: s._id,
    roll: s.rollNumber ?? '-',
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
              setIsAuthForPassword(false);
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null);
                setShowPassword(false);
                // if a class is currently selected for filtering, prefill it
                reset({ classId: selectedClassId || '' });
              }}>Add Student</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
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

                <div className="space-y-2 relative">
                  <Label htmlFor="password">Password{editingId ? ' (leave blank to keep)' : ''}</Label>
                  <Input
                    id="password"
                    disabled={editingId && !isAuthForPassword}
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: !editingId })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
                    onClick={handlePasswordEyeClick}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {errors.password && <span className="text-xs text-destructive">Password is required</span>}
                  {editingId && !isAuthForPassword && (
                    <p className="text-xs text-muted-foreground">
                      Password locked. Click the eye and enter admin password to unlock.
                    </p>
                  )}
                  {editingId && isAuthForPassword && (
                    <p className="text-xs text-muted-foreground">
                      Password field unlocked – the current password is hidden for security. Enter a new one to change it.
                    </p>
                  )}
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

                {editingId && (
                  <>
                    {/* additional fields only shown when editing */}
                    <h3 className="text-lg font-semibold pt-4">Personal Info</h3>
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
                    <div className="space-y-2">
                      <Label htmlFor="studentPhoto">Photo URL</Label>
                      <Input id="studentPhoto" {...register('studentPhoto')} placeholder="http://..." />
                    </div>

                    <h3 className="text-lg font-semibold pt-4">Academic Info</h3>
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year</Label>
                      <Input id="academicYear" {...register('academicYear')} placeholder="2025-26" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input id="section" {...register('section')} />
                    </div>

                    <h3 className="text-lg font-semibold pt-4">Contact</h3>
                    <div className="space-y-2">
                      <Label htmlFor="studentMobileNumber">Student Phone</Label>
                      <Input id="studentMobileNumber" {...register('studentMobileNumber')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="residentialAddress">Address</Label>
                      <Input id="residentialAddress" {...register('residentialAddress')} />
                    </div>

                    <h3 className="text-lg font-semibold pt-4">Parent/Guardian</h3>
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father’s Name</Label>
                      <Input id="fatherName" {...register('fatherName')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherName">Mother’s Name</Label>
                      <Input id="motherName" {...register('motherName')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Guardian Name</Label>
                      <Input id="guardianName" {...register('guardianName')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentMobileNumber">Parent Phone</Label>
                      <Input id="parentMobileNumber" {...register('parentMobileNumber')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input id="parentEmail" type="email" {...register('parentEmail')} />
                    </div>

                    <h3 className="text-lg font-semibold pt-4">Official</h3>
                    <div className="space-y-2">
                      <Label htmlFor="admissionDate">Admission Date</Label>
                      <Input id="admissionDate" type="date" {...register('admissionDate')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousSchool">Previous School</Label>
                      <Input id="previousSchool" {...register('previousSchool')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idProofNumber">ID Proof #</Label>
                      <Input id="idProofNumber" {...register('idProofNumber')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" {...register('category')} />
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
    </div>
  );
}
