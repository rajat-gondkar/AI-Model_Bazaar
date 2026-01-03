'use client';

import { useState, useEffect } from 'react';
import { projectsApi } from '@/lib/api';
import { ProjectListItem, ProjectFilters, ProjectListResponse } from '@/types';
import ModelCard from '@/components/gallery/ModelCard';
import SearchFilter from '@/components/gallery/SearchFilter';
import { ModelCardSkeleton } from '@/components/ui/Skeleton';
import { Loader2, FolderOpen } from 'lucide-react';
import { parseApiError } from '@/lib/utils';

export default function GalleryPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    per_page: 12,
  });
  const [filters, setFilters] = useState<ProjectFilters>({});

  const fetchProjects = async (newFilters?: ProjectFilters, page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: ProjectListResponse = await projectsApi.list({
        ...newFilters,
        page,
        per_page: 12,
      });

      setProjects(response.projects);
      setPagination({
        page: response.page,
        pages: response.pages,
        total: response.total,
        per_page: response.per_page,
      });
    } catch (err: any) {
      setError(parseApiError(err));
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleFilterChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters);
    fetchProjects(newFilters, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchProjects(filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Gallery</h1>
          <p className="text-gray-600">
            Discover and launch AI model demos from our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <SearchFilter onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-gray-600 mb-6">
            {pagination.total === 0
              ? 'No models found'
              : `Showing ${projects.length} of ${pagination.total} models`}
          </p>
        )}

        {/* Loading state - Skeleton Grid */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ModelCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={() => fetchProjects(filters)}
              className="mt-4 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No models found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={() => handleFilterChange({})}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && !error && projects.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ModelCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg ${
                        page === pagination.page
                          ? 'bg-primary-600 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
