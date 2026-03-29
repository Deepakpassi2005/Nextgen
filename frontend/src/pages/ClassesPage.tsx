import { GenericTable } from "@/components/dashboard/GenericTable";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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
import { useClasses, useTeachers, useCreateClass, useDeleteClass, useUpdateClass, useStudentsByClass } from "@/lib/hooks";
import { TableSkeleton, EmptyState } from "@/components/shared/LoadingStates";

export default function ClassesPage() {
  const { data: classes = [], isLoading: isClassesLoading } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const { mutate: createClass, isPending: isCreating } = useCreateClass();
  const { mutate: deleteClass } = useDeleteClass();
  const { mutate: updateClass } = useUpdateClass();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const filteredClasses = classes.filter((cls: any) => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      capacity: parseInt(data.capacity),
      // Convert empty string to null for optional teacherId
      teacherId: data.teacherId ? data.teacherId : null,
    };

    if (editingId) {
      updateClass(
        { id: editingId, data: submitData },
        {
          onSuccess: () => {
            toast({
              title: "Class Updated",
              description: `${data.name} has been updated.`,
            });
            setIsDialogOpen(false);
            setEditingId(null);
            reset();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update class",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createClass(submitData, {
        onSuccess: () => {
          toast({
            title: "Class Created",
            description: `${data.name} has been added.`,
          });
          setIsDialogOpen(false);
          reset();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create class",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      deleteClass(id, {
        onSuccess: () => {
          toast({
            title: "Class Deleted",
            description: "The class has been removed from the system.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete class",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleEdit = (cls: any) => {
    setEditingId(cls._id);
    // Extract teacherId - it might be an object or a string
    const teacherId = typeof cls.teacherId === 'string' ? cls.teacherId : cls.teacherId?._id;
    reset({
      name: cls.name,
      teacherId: teacherId || '',
      capacity: cls.capacity,
    });
    setIsDialogOpen(true);
  };

  if (isClassesLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground mt-2">Manage classes and teacher assignments.</p>
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground mt-2">Manage classes and teacher assignments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shrink-0" onClick={() => setEditingId(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input id="name" {...register("name", { required: true })} placeholder="Class 10-C" />
                {errors.name && <span className="text-xs text-destructive">Class name is required</span>}
              </div>
              
              <div className="space-y-2">
                 <Label htmlFor="teacherId">Class Teacher <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                 <select 
                  id="teacherId" 
                  {...register("teacherId")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                 >
                   <option value="">No Teacher</option>
                   {teachers.map((t: any) => (
                     <option key={t._id} value={t._id}>{t.name}</option>
                   ))}
                 </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" {...register("capacity", { required: true, min: 1 })} placeholder="30" />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>{editingId ? "Update" : "Create"} Class</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search classes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0"
        />
      </div>

      {filteredClasses.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-12 w-12 opacity-20" />}
          title="No Classes Found"
          description="Start by creating your first class."
        />
      ) : (
        <GenericTable 
          data={filteredClasses}
          columns={[
            { header: "Class Name", accessorKey: "name", className: "font-medium" },
            { 
              header: "Class Teacher", 
              cell: (cls: any) => {
                // Handle teacherId as both object (populated) and string (ID)
                const teacherId = typeof cls.teacherId === 'string' ? cls.teacherId : cls.teacherId?._id;
                const teacher = teachers.find((t: any) => t._id === teacherId);
                
                return teacher ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                      {teacher.name.charAt(0)}
                    </div>
                    {teacher.name}
                  </div>
                ) : <span className="text-muted-foreground italic">Unassigned</span>;
              }
            },
            { header: "Capacity", accessorKey: "capacity" },
            { 
              header: "Status", 
              cell: () => <Badge variant="outline">Active</Badge>
            },
            {
              header: "Actions",
              cell: (cls: any) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(cls)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cls._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
