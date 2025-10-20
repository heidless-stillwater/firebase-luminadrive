export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';

export type File = {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploadedAt: Date;
  url: string;
};
