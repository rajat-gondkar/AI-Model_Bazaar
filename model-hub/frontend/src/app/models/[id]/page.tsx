'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import LaunchButton from '@/components/demo/LaunchButton';
import { ModelDetailsSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Github, 
  FileCode, 
  Box, 
  FileText,
  Loader2,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { formatDate, getStatusColor, parseApiError } from '@/lib/utils';

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await projectsApi.delete(projectId);
      toast.success('Project deleted successfully');
      router.push('/gallery');
    } catch (err: any) {
      toast.error(parseApiError(err));
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectsApi.get(projectId);
        setProject(data);
      } catch (err: any) {
        setError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ModelDetailsSkeleton />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This project does not exist.'}</p>
          <Link
            href="/gallery"
            className="inline-flex items-center text-primary-600 hover:text-primary-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === project.created_by;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back link */}
        <Link
          href="/gallery"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Gallery
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl border shadow-sm p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {project.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{project.author_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </div>

              {/* GitHub Link */}
              {project.github_url && (
                <div className="mt-6 pt-6 border-t">
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-gray-700 hover:text-gray-900"
                  >
                    <Github className="h-5 w-5 mr-2" />
                    View on GitHub
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}
            </div>

            {/* Files Card */}
            <div className="bg-white rounded-xl border shadow-sm p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Files</h3>
              
              <div className="space-y-4">
                {/* Main App File */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <FileCode className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{project.files.app_file}</p>
                    <p className="text-sm text-gray-600">Streamlit entry point</p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{project.files.requirements_file}</p>
                    <p className="text-sm text-gray-600">Python dependencies</p>
                  </div>
                </div>

                {/* Model Files */}
                {project.files.model_files.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Model Files</p>
                    <div className="space-y-2">
                      {project.files.model_files.map((file) => (
                        <div key={file} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Box className="h-5 w-5 text-purple-600 mr-3" />
                          <p className="font-medium text-gray-900">{file}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Files */}
                {project.files.other_files.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Other Files</p>
                    <div className="text-sm text-gray-600">
                      {project.files.other_files.slice(0, 5).join(', ')}
                      {project.files.other_files.length > 5 && (
                        <span> and {project.files.other_files.length - 5} more...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Launch Demo Card */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Try This Model</h3>
              <LaunchButton
                projectId={project.id}
                initialStatus={project.status}
                initialDemoUrl={project.demo_url}
                isOwner={!!isOwner}
              />
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-900 mb-3">You own this project</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                    className="w-full py-2 px-4 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Project Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Created</dt>
                  <dd className="font-medium text-gray-900">{formatDate(project.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Updated</dt>
                  <dd className="font-medium text-gray-900">{formatDate(project.updated_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Author</dt>
                  <dd className="font-medium text-gray-900">{project.author_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Status</dt>
                  <dd>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
