import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../lib/store';
import { useNotices, useCreateNotice, useUpdateNotice, useDeleteNotice } from '../lib/hooks';
import { apiClient } from '../lib/api';
import { downloadFile } from '../lib/download';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from '../hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Megaphone, Paperclip, X, Download, FileText, Eye } from 'lucide-react';
import { FileViewerModal } from '../components/shared/FileViewerModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const priorityVariant = (p: string): 'destructive' | 'default' | 'secondary' =>
  p === 'high' ? 'destructive' : p === 'medium' ? 'default' : 'secondary';

const defaultForm = { title: '', content: '', priority: 'medium', audience: 'all' };

// Removed PreviewModal in favor of shared FileViewerModal

// ─── AttachmentChip — module-level so React never re-creates its identity ───

function AttachmentChip({
  name, url, onRemove, onPreview
}: { name: string; url?: string; onRemove?: () => void; onPreview?: () => void }) {
  return (
    <div 
      className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs bg-muted/50 group cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={onPreview ? (e) => { e.stopPropagation(); onPreview(); } : undefined}
    >
      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="truncate max-w-[140px]" title={name}>{name}</span>
      {url && (
        <>
          {onPreview && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="text-primary hover:text-primary/70 ml-1"
              title="Preview"
            >
              <Eye className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); downloadFile(`${BASE_URL}/${url}`, name); }}
            className="text-primary hover:text-primary/70 ml-1"
            title="Download"
          >
            <Download className="h-3 w-3" />
          </button>
        </>
      )}
      {onRemove && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-destructive hover:text-destructive/70 ml-1">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

const NoticesPage = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useStore();
  const isStudent = currentUser?.role === 'student';

  const { data: notices = [], isLoading } = useNotices();
  const createMutation = useCreateNotice();
  const updateMutation = useUpdateNotice();
  const deleteMutation = useDeleteNotice();

  const [search, setSearch]             = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [isSaving, setIsSaving]         = useState(false);
  const [viewingNoticeId, setViewingNoticeId] = useState<string | null>(null);

  const viewingNotice = (notices as any[]).find((n) => n._id === viewingNoticeId);

  // Preview state
  const [previewFile, setPreviewFile] = useState<any>(null);

  // Form fields
  const [form, setForm]               = useState(defaultForm);
  // Files to add
  const [newFiles, setNewFiles]       = useState<File[]>([]);
  // Attachment URLs to remove (edit mode)
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm(defaultForm);
    setNewFiles([]);
    setRemovedUrls([]);
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = '';
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      // 1. Create the notice (JSON)
      const saved: any = await createMutation.mutateAsync(form);

      // 2. Upload any attached files separately
      if (newFiles.length > 0 && saved?._id) {
        await apiClient.notices.uploadAttachments(saved._id, newFiles);
      }

      // 3. Manually invalidate after everything is done to ensure files show up
      queryClient.invalidateQueries({ queryKey: ['notices'] });

      setIsCreateOpen(false);
      resetForm();
      toast({ title: 'Notice published!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to publish notice', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (!form.title.trim() || !form.content.trim() || !editingNotice) return;
    setIsSaving(true);
    try {
      // 1. Update metadata (JSON)
      await updateMutation.mutateAsync({ id: editingNotice._id, data: form });

      // 2. Remove attachments one by one
      for (const url of removedUrls) {
        await apiClient.notices.removeAttachment(editingNotice._id, url);
      }

      // 3. Upload new files
      if (newFiles.length > 0) {
        await apiClient.notices.uploadAttachments(editingNotice._id, newFiles);
      }

      // 4. Manually invalidate
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['notices', editingNotice._id] });

      setEditingNotice(null);
      resetForm();
      toast({ title: 'Notice updated!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to update notice', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Notice deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete notice', variant: 'destructive' });
    }
  };

  const openEdit = (notice: any) => {
    setEditingNotice(notice);
    setForm({ title: notice.title, content: notice.content, priority: notice.priority, audience: notice.audience });
    setNewFiles([]);
    setRemovedUrls([]);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = (notices as any[]).filter((n: any) => {
    const q = search.toLowerCase();
    return (
      (n.title ?? '').toLowerCase().includes(q) ||
      (n.content ?? '').toLowerCase().includes(q)
    );
  });

  // ── File picker section (inline, not extracted as component) ───────────────

  const filePicker = (existingAttachments?: any[]) => (
    <div>
      <label className="text-sm font-medium mb-1 block">Attachments</label>

      {existingAttachments && existingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {existingAttachments
            .filter((a: any) => !removedUrls.includes(a.url))
            .map((a: any, i: number) => (
              <AttachmentChip
                key={i}
                name={a.filename}
                url={a.url}
                onPreview={() => setPreviewFile({
                  filename: a.filename,
                  url: `${BASE_URL}/${a.url}`,
                  mimetype: a.mimetype || 'application/octet-stream'
                })}
                onRemove={() => setRemovedUrls((p) => [...p, a.url])}
              />
            ))}
        </div>
      )}

      {newFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {newFiles.map((f, i) => (
            <AttachmentChip
              key={`new-${i}`}
              name={f.name}
              onRemove={() => setNewFiles((p) => p.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.zip"
        onChange={addFiles}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Paperclip className="mr-2 h-4 w-4" />Attach Files
      </Button>
      <p className="text-xs text-muted-foreground mt-1">
        PDF, Word, Excel, PPT, Images, ZIP — max 15 MB each, up to 5 files
      </p>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <FileViewerModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
        <p className="text-muted-foreground mt-1">School announcements visible to all staff and students</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>All Notices</CardTitle>
            <CardDescription>Posted by Admins and Teachers</CardDescription>
          </div>
          <div className="flex gap-3 items-center">
            <Input
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52"
            />
            {!isStudent && (
              <Dialog
                open={isCreateOpen}
                onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}
              >
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />New Notice</Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create Notice</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Notice title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Content *</label>
                      <Textarea
                        value={form.content}
                        onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                        rows={4}
                        placeholder="Notice content..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Priority</label>
                        <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Audience</label>
                        <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Everyone</SelectItem>
                            <SelectItem value="teachers">Teachers Only</SelectItem>
                            <SelectItem value="students">Students Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {filePicker()}
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publish
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((notice: any) => (
                <Card 
                  key={notice._id} 
                  className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 border-muted-foreground/10"
                  onClick={() => setViewingNoticeId(notice._id)}
                >
                  <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1 pr-2">
                       <Badge variant={priorityVariant(notice.priority)} className="capitalize text-[10px] h-5 mb-2">
                        {notice.priority}
                      </Badge>
                      <CardTitle className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {notice.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">
                      {notice.content}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            {(notice.author || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold truncate max-w-[80px]">{notice.author}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{notice.createdByRole || 'admin'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {notice.attachments?.length > 0 && (
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100" title={`${notice.attachments.length} Attachments`}>
                            <Paperclip className="h-4 w-4" />
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(notice.date || notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No notices yet</p>
              {!isStudent && <p className="text-sm mt-1">Create a notice to inform teachers and students.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingNotice}
        onOpenChange={(o) => { if (!o) { setEditingNotice(null); resetForm(); } }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Notice</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content *</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Audience</label>
                <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="teachers">Teachers Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filePicker(editingNotice?.attachments)}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setEditingNotice(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog
        open={!!viewingNoticeId}
        onOpenChange={(o) => { if (!o) setViewingNoticeId(null); }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden border-none shadow-2xl">
          {viewingNotice ? (
            <>
              <div className="bg-primary/5 px-6 py-8 border-b">
                <Badge variant={priorityVariant(viewingNotice.priority)} className="capitalize mb-3">
                  {viewingNotice.priority} Priority
                </Badge>
                <DialogTitle className="text-2xl font-bold leading-tight">{viewingNotice.title}</DialogTitle>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                   <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">
                        {viewingNotice.author?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">{viewingNotice.author}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                      {viewingNotice.createdByRole || 'admin'}
                    </Badge>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span>Audience: </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">
                      {viewingNotice.audience}
                    </Badge>
                  </div>
                  <span>•</span>
                  <span className="text-xs">
                    {new Date(viewingNotice.date || viewingNotice.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/80">
                    {viewingNotice.content}
                  </p>
                </div>

                {viewingNotice.attachments?.length > 0 && (
                  <div className="pt-6 border-t">
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <Paperclip className="h-4 w-4 text-blue-600" />
                      Attachments ({viewingNotice.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingNotice.attachments.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border shadow-sm group-hover:border-primary/30 transition-colors">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate max-w-[140px]" title={a.filename}>{a.filename}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{a.filename.split('.').pop()} File</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full"
                              onClick={() => setPreviewFile({
                                filename: a.filename,
                                url: `${BASE_URL}/${a.url}`,
                                mimetype: a.mimetype || 'application/octet-stream'
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full text-primary"
                              onClick={() => downloadFile(`${BASE_URL}/${a.url}`, a.filename)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isStudent && (
                <div className="p-6 border-t bg-muted/10 flex justify-between items-center">
                   <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { const n = viewingNotice; setViewingNoticeId(null); openEdit(n); }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => { const id = viewingNotice._id; setViewingNoticeId(null); handleDelete(id); }}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={() => setViewingNoticeId(null)}>Close</Button>
                </div>
              )}
              {isStudent && (
                 <div className="p-4 border-t bg-muted/10 flex justify-end">
                    <Button variant="ghost" onClick={() => setViewingNoticeId(null)}>Close</Button>
                 </div>
              )}
            </>
          ) : (
             <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticesPage;