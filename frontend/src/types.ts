// Interfaces dos tipos de dados da aplicação

export interface Startup {
  id: string;
  name: string;
  description?: string;
  sector?: string;
  website?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  taskId: string;
  startupId: string;
  fileType: string;
  fileUrl: string;
  fileName: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CONSUMED';
  createdAt: string;
  updatedAt: string;
  result?: any; // Resultado da análise
}

export interface Category {
  'category-name': string;
  'category-grade': string;
  insights: string[];
}

export interface TaskResult {
  taskId: string;
  startupId: string;
  fileType: string;
  fileName: string;
  result: {
    categories: {
      [key: string]: Category;
    };
    'Probability of Recommending Investing': number;
  };
  createdAt: string;
}

export interface FileUploadData {
  fileContent: string; // Base64 encoded file content
  fileType: 'pitch-pdf' | 'pitch-txt' | 'pl-xlsx' | 'pl-xls' | 'pl-csv';
  fileName: string;
  startupId: string;
}

export interface UploadRequest {
  file: File;
  startupId: string;
  fileType: 'pitch-pdf' | 'pitch-txt' | 'pl-xlsx' | 'pl-xls' | 'pl-csv';
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  // Campos para respostas diretas da API Lambda
  taskId?: string;
  startupId?: string;
  fileType?: string;
  status?: string;
}
