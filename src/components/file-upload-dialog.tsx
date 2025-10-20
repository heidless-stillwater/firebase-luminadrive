"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { File as FileData } from "@/types";
import { cn } from "@/lib/utils";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpload: (file: FileData) => void;
}

export function FileUploadDialog({ open, onOpenChange, onFileUpload }: FileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFileToUpload(files[0]);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = () => {
    if (!fileToUpload) return;

    setIsUploading(true);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          const newFile: FileData = {
            id: crypto.randomUUID(),
            name: fileToUpload.name,
            size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
            type: fileToUpload.type.startsWith("image") ? "image" : "document",
            uploadedAt: new Date(),
            url: fileToUpload.type.startsWith("image") ? URL.createObjectURL(fileToUpload) : "#",
          };

          onFileUpload(newFile);
          toast({
            title: "Upload successful",
            description: `${fileToUpload.name} has been uploaded.`,
            variant: 'default',
          });
          resetAndClose();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  const resetAndClose = () => {
    setFileToUpload(null);
    setUploadProgress(0);
    setIsUploading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { if (isUploading) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {!fileToUpload ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">
                Drag & drop a file here, or <span className="font-semibold text-primary">click to browse</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileIcon className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{fileToUpload.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFileToUpload(null)} disabled={isUploading}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground mt-2">{uploadProgress}%</p>
            </div>
          )}

          {uploadProgress === 100 && !isUploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Upload Complete!</p>
            </div>
          )}

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isUploading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={!fileToUpload || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
