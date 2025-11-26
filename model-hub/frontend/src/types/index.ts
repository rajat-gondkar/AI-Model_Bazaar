/**
 * TypeScript type definitions for the Model Hub application
 */

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_creator: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

// Project types
export interface ProjectFiles {
  app_file: string;
  model_files: string[];
  requirements_file: string;
  other_files: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author_name: string;
  github_url?: string;
  created_by: string;
  s3_path: string;
  files: ProjectFiles;
  status: ProjectStatus;
  demo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author_name: string;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

export type ProjectStatus = 'pending' | 'ready' | 'launching' | 'running' | 'stopped' | 'error';

// Upload types
export interface UploadFormData {
  name: string;
  description: string;
  tags: string;
  author_name: string;
  github_url?: string;
  file: File;
}

// Demo types
export interface DemoLaunchResponse {
  status: string;
  message: string;
  demo_url?: string;
  estimated_time?: number;
}

export interface DemoStatusResponse {
  status: string;
  demo_url?: string;
  message?: string;
  started_at?: string;
}

// API Response types
export interface ApiError {
  detail: string;
}

export interface StatsResponse {
  total_users: number;
  total_projects: number;
  running_demos: number;
}

// Filter types
export interface ProjectFilters {
  search?: string;
  tags?: string;
  author?: string;
  status?: ProjectStatus;
  page?: number;
  per_page?: number;
}
