import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMaterials, useMaterialsByClass, useSubjects, useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from '../lib/hooks';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../hooks/use-toast';
import { Loader2, Upload, Download, Edit, Trash2, FileText, Image, Video, File, Eye } from 'lucide-react';

const MaterialsPage = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    file: null as File | null,
    files: [] as File[],
  });

  const queryClient = useQueryClient();

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetch('/api/classes').then(res => res.json()).then(data => data.data || []),
  });

  const { data: subjectsForFilter = [] } = useSubjects(selectedClass === 'all' ? '' : selectedClass);
  const { data: subjectsForUpload = [] } = useSubjects(uploadForm.classId);

  const { data: materials, isLoading: materialsLoading } =
    selectedClass && selectedClass !== 'all'
      ? useMaterialsByClass(selectedClass)
      : useMaterials();

  const createMaterialMutation = useCreateMaterial();
  const updateMaterialMutation = useUpdateMaterial();
  const deleteMaterialMutation = useDeleteMaterial();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setUploadForm(prev => ({ 
        ...prev, 
        files: [...Array.from(selectedFiles)] 
      }));
    }
  };

  const handleUpload = async () => {
    if (uploadForm.files.length === 0 || !uploadForm.title || !uploadForm.classId || !uploadForm.subjectId) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    uploadForm.files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('classId', uploadForm.classId);
    formData.append('subjectId', uploadForm.subjectId);

    try {
      await createMaterialMutation.mutateAsync(formData);
      setIsUploadDialogOpen(false);
      setUploadForm({ title: '', description: '', classId: '', subjectId: '', file: null, files: [] });
      toast({ title: 'Success', description: 'Material uploaded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload material', variant: 'destructive' });
    }
  };

  const handleDownload = async (materialId: string, attachmentUrl: string, fileName?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Missing auth token. Please log in.');

      // We need a proxy or direct link to the file. 
      // Since the frontend is usually on a different port than the backend, 
      // we use the same download logic but with the specific URL.
      // However, the backend's /download/:id increments the counter.
      // For simplicity in Admin, we'll just open the file or use a new endpoint.
      // Let's use the fileUrl directly if it's public.
      
      const response = await fetch(`/${attachmentUrl.replace(/^\/+/, '')}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('[MaterialsPage.handleDownload]', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      try {
        await deleteMaterialMutation.mutateAsync(materialId);
        toast({ title: 'Success', description: 'Material deleted successfully' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete material', variant: 'destructive' });
      }
    }
  };

  const getFileIcon = (fileName?: string) => {
    const safeName = fileName || '';
    const extension = safeName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (classesLoading) return <div className="p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Study Materials</h1>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Study Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter material title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Class *</label>
                <Select
                  value={uploadForm.classId}
                  onValueChange={(value) =>
                    setUploadForm(prev => ({ ...prev, classId: value, subjectId: '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls: any) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Subject *</label>
                <Select
                  value={uploadForm.subjectId}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, subjectId: value }))}
                  disabled={!uploadForm.classId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsForUpload?.map((sub: any) => (
                      <SelectItem key={sub._id} value={sub._id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">File *</label>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                />
                {uploadForm.files.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {uploadForm.files.length} file(s) selected
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={createMaterialMutation.isPending}
                >
                  {createMaterialMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter by Class</CardTitle>
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
          <CardTitle>Study Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {materialsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : materials && materials.length > 0 ? (
            <div className="space-y-4">
              {materials
                .filter((material: any) => {
                  const mClassId = material.classId?._id || material.classId;
                  const mSubjectId = material.subjectId?._id || material.subjectId;
                  
                  const classMatch = selectedClass === 'all' || mClassId === selectedClass;
                  const subjectMatch = selectedSubject === 'all' || mSubjectId === selectedSubject;
                  return classMatch && subjectMatch;
                })
                .map((material: any) => (
                <div key={material._id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  {/* Header Row - Material Metadata */}
                  <div className="bg-gray-50/50 p-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{material.title}</h3>
                        {material.description && <p className="text-sm text-gray-500 line-clamp-1">{material.description}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-end mr-4">
                        <div className="flex space-x-2 mb-1">
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {material.classId?.name || 'Class N/A'}
                          </span>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {material.subjectId?.name || 'Subject N/A'}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-400 font-medium">
                          <span className="mr-2">By: {material.teacherId?.name || 'Admin'}</span>
                          <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0 transition-colors"
                        onClick={() => handleDelete(material._id)}
                        title="Delete Material"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Attachments List */}
                  <div className="p-2 bg-white">
                    {(material.attachments?.length > 0 ? material.attachments : (material.fileUrl ? [material] : [])).map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-blue-50/30 rounded-md transition-all group border-b border-gray-50 last:border-0">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 text-gray-500 rounded group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                            {getFileIcon(att.fileName)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                              {att.fileName || 'Attachment'}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                              {att.fileType || 'File'} • {formatFileSize(att.fileSize)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 flex items-center space-x-1"
                            onClick={() => window.open(`/${att.fileUrl.replace(/^\/+/, '')}`, '_blank')}
                            title="View online"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-xs font-medium hidden md:inline">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100/50 flex items-center space-x-1"
                            onClick={() => handleDownload(material._id, att.fileUrl, att.fileName)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                            <span className="text-xs font-medium hidden md:inline">Download</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50">
              <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No study materials found.</p>
              <p className="text-sm text-gray-400 mt-1">Upload some materials to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsPage;