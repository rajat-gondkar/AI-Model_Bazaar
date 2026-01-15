/**
 * API client for Model Hub backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  Project,
  ProjectListResponse,
  ProjectFilters,
  DemoLaunchResponse,
  DemoStatusResponse,
  StatsResponse,
  UploadFormData,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for most requests
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optionally redirect to login
        // window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post<User>('/api/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },
};

// Projects API
export const projectsApi = {
  list: async (filters?: ProjectFilters): Promise<ProjectListResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tags) params.append('tags', filters.tags);
    if (filters?.author) params.append('author', filters.author);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());

    const response = await api.get<ProjectListResponse>(`/api/projects?${params.toString()}`);
    return response.data;
  },

  get: async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`/api/projects/${id}`);
    return response.data;
  },

  upload: async (data: UploadFormData): Promise<Project> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('tags', data.tags);
    formData.append('author_name', data.author_name);
    if (data.github_url) {
      formData.append('github_url', data.github_url);
    }
    formData.append('file', data.file);

    const response = await api.post<Project>('/api/projects/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },

  myProjects: async (page = 1, perPage = 10): Promise<ProjectListResponse> => {
    const response = await api.get<ProjectListResponse>(
      `/api/projects/my-projects?page=${page}&per_page=${perPage}`
    );
    return response.data;
  },
};

// Demo API
export const demoApi = {
  launch: async (projectId: string): Promise<DemoLaunchResponse> => {
    const response = await api.post<DemoLaunchResponse>(`/api/demo/${projectId}/launch`);
    return response.data;
  },

  status: async (projectId: string): Promise<DemoStatusResponse> => {
    const response = await api.get<DemoStatusResponse>(`/api/demo/${projectId}/status`);
    return response.data;
  },

  stop: async (projectId: string): Promise<void> => {
    await api.post(`/api/demo/${projectId}/stop`);
  },

  cleanup: async (projectId: string): Promise<void> => {
    await api.post(`/api/demo/${projectId}/cleanup`);
  },

  stopAll: async (): Promise<{ demos_stopped: number; ports_freed: number; message: string }> => {
    const response = await api.post('/api/demo/stop-all');
    return response.data;
  },

  getRunning: async (): Promise<{ 
    running_demos: Array<{ 
      project_id: string; 
      project_name: string;
      port: number; 
      demo_url: string;
      started_at: string;
    }>; 
    total: number;
    used_ports: number[];
  }> => {
    const response = await api.get('/api/demo/running');
    return response.data;
  },

  stopPort: async (port: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/demo/stop-port/${port}`);
    return response.data;
  },

  install: async (projectId: string): Promise<{ status: string; message: string }> => {
    const response = await api.post(`/api/demo/${projectId}/install`);
    return response.data;
  },

  run: async (projectId: string): Promise<{ status: string; message: string; demo_url?: string }> => {
    const response = await api.post(`/api/demo/${projectId}/run`);
    return response.data;
  },

  envStatus: async (projectId: string): Promise<{ status: string; message: string }> => {
    const response = await api.get(`/api/demo/${projectId}/env-status`);
    return response.data;
  },
};

// Stats API
export const statsApi = {
  get: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>('/api/stats');
    return response.data;
  },
};

export default api;
