import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from '../hooks/use-toast';
import { Loader2, Database, RefreshCw, Award } from 'lucide-react';

const MarksPage = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [examType, setExamType] = useState('isa1');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -- Data Fetching --
  const { data: classes, isLoading: classesLoading, refetch: refetchClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: apiClient.classes.getAll,
  });

  const { data: existingResults, isLoading: resultsLoading, refetch: refetchResults } = useQuery({
    queryKey: ['results', 'class', selectedClass, examType],
    queryFn: () => apiClient.results.getByClass(selectedClass, examType),
    enabled: !!selectedClass,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchClasses(), refetchResults()]);
    setIsRefreshing(false);
    toast({ title: 'Refreshed', description: 'Data updated from server' });
  };

  if (classesLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Database className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Records</h1>
            <p className="text-muted-foreground text-sm font-medium">View student performance published by faculty</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-primary/10 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Filter Records</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full bg-muted/50 transition-all hover:bg-muted border-none focus:ring-1 focus:ring-primary"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Exam Category</label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="w-full bg-muted/50 transition-all hover:bg-muted border-none focus:ring-1 focus:ring-primary"><SelectValue placeholder="Exam Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="isa1">ISA 1</SelectItem>
                  <SelectItem value="isa2">ISA 2</SelectItem>
                  <SelectItem value="isa3">ISA 3</SelectItem>
                  <SelectItem value="semester1">Semester 1</SelectItem>
                  <SelectItem value="semester2">Semester 2</SelectItem>
                  <SelectItem value="semester3">Semester 3</SelectItem>
                  <SelectItem value="semester4">Semester 4</SelectItem>
                  <SelectItem value="semester5">Semester 5</SelectItem>
                  <SelectItem value="semester6">Semester 6</SelectItem>
                  <SelectItem value="peer-learning">Peer Learning</SelectItem>
                  <SelectItem value="mid-term">Mid-term</SelectItem>
                  <SelectItem value="final">Final Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="space-y-0">
                {!selectedClass ? (
                  <div className="p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                      <Database className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold">No Records Filtered</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                      Select a class on the left to view existing academic records.
                    </p>
                  </div>
                ) : resultsLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
                ) : existingResults?.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="pl-6 font-bold">Student</TableHead>
                        <TableHead className="font-bold">Exam Type</TableHead>
                        <TableHead className="font-bold">Performance Details</TableHead>
                        <TableHead className="text-center font-bold">Final Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingResults.map((res: any) => (
                        <TableRow key={res._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="font-bold">{res.studentId?.firstName} {res.studentId?.lastName}</div>
                            <div className="text-[10px] uppercase font-black text-muted-foreground bg-muted px-2 py-0.5 rounded w-fit mt-1">Roll: {res.studentId?.rollNumber}</div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="font-mono bg-slate-100 text-slate-700 uppercase">{res.examType}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {res.marks?.map((m: any, i: number) => (
                                <div key={i} className="bg-primary/5 px-2 py-1 rounded-md text-[11px] border border-primary/5">
                                  <span className="font-bold text-primary">{m.subjectId?.name || 'Overall'}</span>
                                  <span className="mx-1 opacity-40">|</span>
                                  <span className="font-black">{m.score}</span>
                                  <span className="opacity-40 ml-0.5">/{m.maxMarks}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center font-black text-xs border-2 ${
                              res.grade === 'F' || res.grade === 'Fail' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-100' : 'bg-green-50 text-green-600 border-green-200 shadow-sm shadow-green-100'
                            }`}>
                              {res.grade}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-20 text-center space-y-3">
                    <div className="flex justify-center"><Award className="w-12 h-12 text-muted-foreground/30" /></div>
                    <p className="text-muted-foreground font-medium">No results found for this selection</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarksPage;