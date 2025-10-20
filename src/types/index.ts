import { FieldValue } from "firebase/firestore";

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';

export type File = {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploadedAt: Date;
  url: string;
  storagePath: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: FieldValue;
  category: string;
};
