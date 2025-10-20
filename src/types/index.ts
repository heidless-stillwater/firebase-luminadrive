import { FieldValue, Timestamp } from "firebase/firestore";

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';

export type File = {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploadedAt?: Date | Timestamp | FieldValue;
  url?: string;
  storagePath: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate?: Date | FieldValue;
  category: string;
};
