"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from "date-fns";
import { MoreVertical, Download, Trash2, FileText, Image as ImageIcon, Video, Music, File as FileIcon, FileArchive } from "lucide-react";
import type { File as FileData, FileType } from "@/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";

interface FileCardProps {
  file: FileData;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
  onDelete: () => void;
  onDownload: () => void;
}

const fileTypeIcons: Record<FileType, ReactNode> = {
  document: <FileText className="h-10 w-10 text-muted-foreground" />,
  image: <ImageIcon className="h-10 w-10 text-muted-foreground" />,
  video: <Video className="h-10 w-10 text-muted-foreground" />,
  audio: <Music className="h-10 w-10 text-muted-foreground" />,
  other: <FileIcon className="h-10 w-10 text-muted-foreground" />,
};

const getFileIcon = (file: FileData): ReactNode => {
    if (file.name.endsWith('.zip')) {
        return <FileArchive className="h-10 w-10 text-muted-foreground" />;
    }
    return fileTypeIcons[file.type];
}

export function FileCard({ file, isSelected, onSelectionChange, onDelete, onDownload }: FileCardProps) {
  const [formattedDate, setFormattedDate] = useState("");
  const [relativeDate, setRelativeDate] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && file.uploadedAt) {
      let date: Date;
      if (file.uploadedAt instanceof Timestamp) {
        date = file.uploadedAt.toDate();
      } else if (file.uploadedAt instanceof Date) {
        date = file.uploadedAt;
      } else {
        // Fallback for string or number representation, though less likely with Firestore
        date = new Date(file.uploadedAt as any);
      }
      
      if (!isNaN(date.getTime())) {
        setFormattedDate(format(date, "PPP p"));
        setRelativeDate(formatDistanceToNow(date, { addSuffix: true }));
      }
    }
  }, [file.uploadedAt, isMounted]);

  const placeholderData = file.type === 'image' ? PlaceHolderImages.find(p => p.id === file.id) : undefined;
  
  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <div className="relative p-2">
        <div className="absolute top-4 left-4 z-10">
          <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(Boolean(checked))} aria-label={`Select ${file.name}`} />
        </div>
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full bg-background/50 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {placeholderData ? (
          <Image
            src={placeholderData.imageUrl}
            alt={file.name}
            width={400}
            height={200}
            className="aspect-video w-full object-cover rounded-md"
            data-ai-hint={placeholderData.imageHint}
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted rounded-md">
            {getFileIcon(file)}
          </div>
        )}
      </div>
      <CardContent className="pt-4 flex-grow">
        <p className="font-semibold text-sm truncate" title={file.name}>{file.name}</p>
        <p className="text-xs text-muted-foreground">{file.size}</p>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground pt-2">
        {isMounted && relativeDate ? (
            <p title={formattedDate}>{relativeDate}</p>
        ) : (
            <div className="h-4 w-24 bg-muted rounded-md animate-pulse" />
        )}
      </CardFooter>
    </Card>
  );
}
