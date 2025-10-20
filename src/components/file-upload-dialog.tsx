"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { File as FileData, FileType } from "@/types";
import { cn } from "@/lib/utils";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getFileType(file: File): FileType {
    const fileType = file.type.split("/")[0];
    if (["image", "video", "audio"].includes(fileType)) {
        return fileType as "image" | "video" | "audio";
    }
    if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        return 'document';
    }
    return 'other';
}

export function FileUploadDialog({ open, onOpenChange }: FileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

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
    if (!fileToUpload || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    const storage = getStorage();
    const fileId = crypto.randomUUID();
    const storagePath = `users/${user.uid}/files/${fileId}-${fileToUpload.name}`;
    const storageRef = ref(storage, storagePath);

    const fileDocRef = doc(firestore, `users/${user.uid}/files/${fileId}`);
    
    // Create the document first with client-side data
    const initialFileData: FileData = {
        id: fileId,
        name: fileToUpload.name,
        fileName: fileToUpload.name,
        size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
        fileSize: fileToUpload.size,
        type: getFileType(fileToUpload),
        fileType: fileToUpload.type,
        category: getFileType(fileToUpload),
        uploadedAt: new Date(), // Client-side timestamp for immediate UI
        uploadDate: new Date(), // This will be replaced by serverTimestamp
        url: '', // Will be updated later
        storagePath: storagePath,
        userId: user.uid,
    };

    setDocumentNonBlocking(fileDocRef, initialFileData, { merge: true });


    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "Could not upload your file. Please try again.",
        });
        setIsUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        const finalFileData = {
          url: downloadURL,
          uploadDate: serverTimestamp(),
          uploadedAt: serverTimestamp(), // For correct sorting/display
        };
        
        updateDocumentNonBlocking(fileDocRef, finalFileData);

        toast({
          title: "Upload successful",
          description: `${fileToUpload.name} has been uploaded.`,
        });

        setIsUploading(false);
        setTimeout(() => {
          resetAndClose();
        }, 1000);
      }
    );
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
              <p className="text-sm text-center text-muted-foreground mt-2">{uploadProgress.toFixed(0)}%</p>
            </div>
          )}

          {uploadProgress === 100 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Upload Complete!</p>
            </div>
          )}

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={resetAndClose} disabled={isUploading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={!fileToUpload || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
