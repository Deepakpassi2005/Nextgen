import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Download, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import { useSubjects } from '../lib/hooks';

const AssignmentsPage = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await res.json();
      return data.data || [];
    },
  });

  // Fetch subjects (from existing hook, relying on its internal implementation)
  const { data: subjectsForFilter = [] } = useSubjects(selectedClass === 'all' ? '' : selectedClass);

  // Fetch assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', selectedClass, selectedSubject],
    queryFn: async () => {
      let url = '/api/admin/assignments';
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('classId', selectedClass);
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      return data.data || [];
    },
  });

  const handleExport = async () => {
    try {
      let url = '/api/admin/assignments/export';
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('classId', selectedClass);
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject);
      if (params.toString()) url += `?${params.toString()}`;

      const token = localStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Assignments_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast({ title: 'Success', description: 'Export downloaded successfully.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to export assignments', variant: 'destructive' });
    }
  };

  if (classesLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <ClipboardList className="mr-3 h-6 w-6 text-primary" />
          Student Assignments
        </h1>
        <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-400 uppercase mb-1 block">Filter by Class</label>
            <Select 
              value={selectedClass} 
              onValueChange={(val) => {
                setSelectedClass(val);
                setSelectedSubject('all');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map((cls: any) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-medium text-gray-400 uppercase mb-1 block">Filter by Subject</label>
            <Select 
              value={selectedSubject} 
              onValueChange={setSelectedSubject}
              disabled={selectedClass === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedClass === 'all' ? "Select a class first" : "All Subjects"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjectsForFilter?.map((sub: any) => (
                  <SelectItem key={sub._id} value={sub._id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment: any) => (
                <div key={assignment._id} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between transition-all hover:shadow-md">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="font-bold text-lg text-gray-900">{assignment.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">
                        {assignment.classId?.name || 'Unknown Class'}
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded">
                        {assignment.subjectId?.name || 'Unknown Subject'}
                      </span>
                      <span>By: {assignment.teacherId?.name || 'Admin'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Due Date</p>
                      <p className="font-semibold text-gray-900 flex items-center justify-center">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center text-emerald-600 font-bold">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {assignment.stats?.submittedCount || 0}
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase">Submitted</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center text-red-500 font-bold">
                          {assignment.stats?.pendingCount || 0}
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase">Pending</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center text-blue-600 font-bold">
                          {assignment.stats?.totalStudents || 0}
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase">Total</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50">
               <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                 <ClipboardList className="h-8 w-8 text-gray-400" />
               </div>
               <p className="text-gray-500 font-medium">No assignments found.</p>
               <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentsPage;
