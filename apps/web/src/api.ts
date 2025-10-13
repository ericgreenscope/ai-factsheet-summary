/**
 * API client for ESG Factsheet backend
 */
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorData = error.response?.data as any;
    const message = errorData?.detail || errorData?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// Types
export interface FileRecord {
  id: string;
  company_name?: string;
  original_filename: string;
  storage_path_original: string;
  storage_path_regenerated?: string;
  language: string;
  created_at: string;
}

export interface Job {
  id: string;
  file_id: string;
  type: 'ANALYZE' | 'REGENERATE';
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  file_id: string;
  model_name: string;
  raw_model_output: any;
  strengths: string;
  weaknesses: string;
  action_plan: string;
  created_at: string;
}

export interface Review {
  id: string;
  file_id: string;
  suggestion_id?: string;
  editor_notes?: string;
  strengths_final: string;
  weaknesses_final: string;
  action_plan_final: string;
  status: 'DRAFT' | 'APPROVED';
  created_at: string;
  updated_at: string;
}

export interface FileDetail {
  id: string;
  company_name?: string;
  original_filename: string;
  created_at: string;
  suggestion?: Suggestion;
  review?: Review;
  jobs: Job[];
  download_url_original?: string;
  download_url_regenerated?: string;
}

export interface ReviewRequest {
  suggestion_id: string;
  strengths_final: string;
  weaknesses_final: string;
  action_plan_final: string;
  editor_notes?: string;
}

// API Functions

export async function uploadFiles(files: File[], companyName?: string): Promise<FileRecord[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (companyName) {
    formData.append('company_name', companyName);
  }

  const response = await apiClient.post<FileRecord[]>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function analyzeFile(fileId: string): Promise<Suggestion> {
  const response = await apiClient.post<Suggestion>(`/analyze/${fileId}`);
  return response.data;
}

export async function saveReview(fileId: string, review: ReviewRequest): Promise<Review> {
  const response = await apiClient.post<Review>(`/review/${fileId}`, review);
  return response.data;
}

export async function approveAndRegenerate(fileId: string): Promise<FileRecord> {
  const response = await apiClient.post<FileRecord>(`/approve/${fileId}`);
  return response.data;
}

export async function getFile(fileId: string): Promise<FileDetail> {
  const response = await apiClient.get<FileDetail>(`/file/${fileId}`);
  return response.data;
}

export async function listFiles(): Promise<FileRecord[]> {
  const response = await apiClient.get<FileRecord[]>('/files');
  return response.data;
}

export function getExportExcelUrl(): string {
  return `${API_BASE_URL}/export/excel`;
}

export async function healthCheck(): Promise<{ ok: boolean }> {
  const response = await apiClient.get<{ ok: boolean }>('/healthz');
  return response.data;
}

