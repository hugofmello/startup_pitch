// Interfaces para os tipos de dados usados na aplicação

export interface Startup {
  id: string;
  name: string;
  description?: string;
  website?: string;
  sector?: string;
  foundingDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  taskId: string;
  startupId: string;
  fileType: string;
  fileName: string;
  fileUrl?: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CONSUMED';
  createdAt: string;
  updatedAt?: string;
  result?: any;
}

export interface Result {
  taskId: string;
  startupId: string;
  data: any;
  createdAt: string;
}

export interface Category {
  'category-name': string;
  'category-grade': string;
  insights: string[];
}

export type FileType = 'pitch-pdf' | 'pitch-txt' | 'pl-xlsx' | 'pl-xls' | 'pl-csv' | 'PDF' | 'EXCEL' | 'TXT';

export interface FileUploadData {
  fileContent: string;
  fileType: FileType;
  fileName: string;
  startupId: string;
}

export interface UploadRequest {
  startupId: string;
  fileType: string;
  file: File;
}
