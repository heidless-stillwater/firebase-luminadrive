"use client";

import { useState, useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { File as FileData, FileType } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileCard } from "@/components/file-card";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { useToast } from "@/hooks/use-toast";
import { HardDrive, Upload, Trash2, X, FileText, Image as ImageIcon, Video, Music, File as FileIcon, Folder } from 'lucide-react';

const categories: { value: FileType | 'all'; label: string, icon: ReactNode }[] = [
  { value: 'all', label: 'All Files', icon: <Folder className="h-4 w-4" /> },
  { value: 'document', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { value: 'image', label: 'Images', icon: <ImageIcon className="h-4 w-4" /> },
  { value: 'video', label: 'Videos', icon: <Video className="h-4 w-4" /> },
  { value: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <FileIcon className="h-4 w-4" /> },
];

export function FileManager({ initialFiles }: { initialFiles: FileData[] }) {
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [activeCategory, setActiveCategory] = useState<FileType | 'all'>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const filteredFiles = useMemo(() => {
    if (activeCategory === 'all') return files;
    return files.filter(file => file.type === activeCategory);
  }, [files, activeCategory]);

  const handleSelectionChange = (fileId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedFiles);
    if (isSelected) {
      newSelection.add(fileId);
    } else {
      newSelection.delete(fileId);
    }
    setSelectedFiles(newSelection);
  };
  
  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  }

  const handleDelete = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    let deletedCount = 0;
    if (fileToDelete) {
      setFiles(files.filter(f => f.id !== fileToDelete));
      deletedCount = 1;
    } else if (selectedFiles.size > 0) {
      setFiles(files.filter(f => !selectedFiles.has(f.id)));
      deletedCount = selectedFiles.size;
      setSelectedFiles(new Set());
    }

    toast({
      title: "File(s) deleted",
      description: `${deletedCount} file(s) have been permanently deleted.`,
    });
    setFileToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleDownload = (file: FileData) => {
    toast({
      title: "Preparing download...",
      description: `Your download for ${file.name} will start shortly.`,
    });
    // In a real app, this would trigger a file download.
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (newFile: FileData) => {
    setFiles([newFile, ...files]);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <HardDrive className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">LuminaDrive</h1>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </header>

      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as FileType | 'all')} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          {categories.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="flex-col sm:flex-row sm:gap-2 h-14 sm:h-10">
              {cat.icon}
              <span>{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <AnimatePresence>
        {selectedFiles.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mb-6 bg-card border rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedFiles(new Set())}>
                <X className="h-5 w-5" />
              </Button>
              <span className="font-medium">{selectedFiles.size} selected</span>
            </div>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isSelected={selectedFiles.has(file.id)}
              onSelectionChange={(isSelected) => handleSelectionChange(file.id, isSelected)}
              onDelete={() => handleDelete(file.id)}
              onDownload={() => handleDownload(file)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {filteredFiles.length === 0 && (
        <div className="text-center py-20 bg-muted/50 rounded-lg">
          <p className="text-lg font-medium">No files here yet</p>
          <p className="text-muted-foreground mt-2">Upload your first file to get started.</p>
        </div>
      )}

      <FileUploadDialog open={isUploadOpen} onOpenChange={setUploadOpen} onFileUpload={handleFileUpload} />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected file(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
