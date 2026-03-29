import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileAttachment {
  filename: string;
  url: string;
  mimetype: string;
}

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileAttachment | null;
}

export function FileViewerModal({ isOpen, onClose, file }: FileViewerModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!file) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(file.url);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the file directly. Opening in a new tab.",
        variant: "destructive",
      });
      window.open(file.url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const isImage = file.mimetype.startsWith("image/");
  const isPDF = file.mimetype === "application/pdf";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8 break-all">
            <FileIcon className="h-5 w-5 flex-shrink-0" />
            {file.filename}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-[300px] flex items-center justify-center bg-muted/30 rounded-md border p-4 mt-2">
          {isImage ? (
            <img
              src={file.url}
              alt={file.filename}
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : isPDF ? (
            <iframe
              src={file.url}
              title={file.filename}
              className="w-full h-[60vh] border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 py-12">
              <FileIcon className="h-16 w-16 opacity-50" />
              <p>Preview not available for this file type.</p>
              <p className="text-sm">Please download the file to view it.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleDownload} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download File"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
