'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { projectsApi } from '@/lib/api';
import { ProjectListItem } from '@/types';
import ModelCard from '@/components/gallery/ModelCard';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { User, Mail, Calendar, Loader2, FolderOpen, Plus } from 'lucide-react';
import { formatDate, parseApiError } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [myProjects, setMyProjects] = useState<ProjectListItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return;
      
      try {
        const response = await projectsApi.myProjects();
        setMyProjects(response.projects);
      } catch (err: any) {
        toast.error(parseApiError(err));
      } finally {
        setIsLoadingProjects(false);
      }
    };

    if (user) {
      fetchMyProjects();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectsApi.delete(projectId);
      setMyProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (err: any) {
      toast.error(parseApiError(err));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border shadow-sm p-6 sticky top-24">
              {/* User Avatar */}
              <div className="text-center mb-6">
                <div className="mx-auto h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-10 w-10 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>

              {/* User Info */}
              <div className="space-y-3 text-sm border-t pt-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <span>{myProjects.length} projects</span>
                </div>
                {user.created_at && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <Link
                  href="/upload"
                  className="w-full flex items-center justify-center py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New Model
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-4 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-xl border shadow-sm mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'projects'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Projects
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div>
                {isLoadingProjects ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                  </div>
                ) : myProjects.length === 0 ? (
                  <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                    <FolderOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No projects yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You haven&apos;t uploaded any models yet. Get started by uploading your first project.
                    </p>
                    <Link
                      href="/upload"
                      className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Upload Your First Model
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {myProjects.map((project) => (
                      <div key={project.id} className="relative">
                        <ModelCard project={project} />
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors z-10"
                          title="Delete project"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl border shadow-sm p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h3>

                <div className="space-y-6">
                  {/* Profile Info */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={user.username}
                          disabled
                          className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Profile editing is not yet available. Contact support to update your information.
                    </p>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t">
                    <h4 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h4>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={() => alert('Account deletion is not yet implemented')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
