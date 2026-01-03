'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { parseApiError, getFieldErrors, isValidationError } from '@/lib/utils';

export default function UploadForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    author_name: '',
    github_url: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      
      // Validate file type
      const validTypes = ['.zip', '.rar'];
      const fileExtension = uploadedFile.name.toLowerCase().slice(uploadedFile.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        toast.error('Please upload a ZIP or RAR file');
        return;
      }

      // Validate file size (500MB max)
      const maxSize = 500 * 1024 * 1024;
      if (uploadedFile.size > maxSize) {
        toast.error('File size must be less than 500MB');
        return;
      }

      setFile(uploadedFile);
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
    },
    maxFiles: 1,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.author_name.trim()) {
      newErrors.author_name = 'Author name is required';
    }

    if (!file) {
      newErrors.file = 'Please upload a project ZIP file';
    }

    if (formData.github_url && !formData.github_url.startsWith('https://github.com')) {
      newErrors.github_url = 'Please enter a valid GitHub URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to upload a project');
      router.push('/auth/login');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsUploading(true);

    try {
      const result = await projectsApi.upload({
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        author_name: formData.author_name,
        github_url: formData.github_url || undefined,
        file: file!,
      });

      toast.success('Project uploaded successfully!');
      router.push(`/models/${result.id}`);
    } catch (error: any) {
      // Handle validation errors with field-specific messages
      if (isValidationError(error)) {
        const fieldErrors = getFieldErrors(error);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          toast.error('Please fix the validation errors');
        } else {
          toast.error(parseApiError(error));
        }
      } else {
        toast.error(parseApiError(error));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Image Classifier, Sentiment Analyzer"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.name ? 'border-red-500' : ''
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe what your model does, its capabilities, and how users can interact with it..."
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.description ? 'border-red-500' : ''
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleInputChange}
          placeholder="e.g., computer-vision, classification, pytorch (comma-separated)"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Separate multiple tags with commas
        </p>
      </div>

      {/* Author Name */}
      <div>
        <label htmlFor="author_name" className="block text-sm font-medium text-gray-700 mb-1">
          Author Name *
        </label>
        <input
          type="text"
          id="author_name"
          name="author_name"
          value={formData.author_name}
          onChange={handleInputChange}
          placeholder="Your name or team name"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.author_name ? 'border-red-500' : ''
          }`}
        />
        {errors.author_name && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.author_name}
          </p>
        )}
      </div>

      {/* GitHub URL */}
      <div>
        <label htmlFor="github_url" className="block text-sm font-medium text-gray-700 mb-1">
          GitHub URL (optional)
        </label>
        <input
          type="url"
          id="github_url"
          name="github_url"
          value={formData.github_url}
          onChange={handleInputChange}
          placeholder="https://github.com/username/repository"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.github_url ? 'border-red-500' : ''
          }`}
        />
        {errors.github_url && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.github_url}
          </p>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Bundle (ZIP file) *
        </label>
        
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : errors.file
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
            <p className="mt-4 text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your project ZIP file'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              or click to browse (max 500MB)
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Must contain: app.py (Streamlit entry), requirements.txt, and model files
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-lg p-2">
                  <File className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {errors.file && (
          <p className="mt-1 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.file}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-4 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Project
            </>
          )}
        </button>
      </div>
    </form>
  );
}
