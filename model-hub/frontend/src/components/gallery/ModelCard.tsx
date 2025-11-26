'use client';

import Link from 'next/link';
import { ProjectListItem } from '@/types';
import { formatRelativeTime, getStatusColor, truncateText } from '@/lib/utils';
import { User, Calendar, Play } from 'lucide-react';

interface ModelCardProps {
  project: ProjectListItem;
}

export default function ModelCard({ project }: ModelCardProps) {
  return (
    <Link href={`/models/${project.id}`}>
      <div className="bg-white rounded-xl border shadow-sm card-hover p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {project.name}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              project.status
            )}`}
          >
            {project.status}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
          {truncateText(project.description, 150)}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
              +{project.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{project.author_name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatRelativeTime(project.created_at)}</span>
          </div>
        </div>

        {/* Launch indicator */}
        {project.status === 'ready' && (
          <div className="mt-4 flex items-center justify-center text-primary-600 bg-primary-50 rounded-lg py-2">
            <Play className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Click to view & launch demo</span>
          </div>
        )}

        {project.status === 'running' && (
          <div className="mt-4 flex items-center justify-center text-green-600 bg-green-50 rounded-lg py-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="text-sm font-medium">Demo is running</span>
          </div>
        )}
      </div>
    </Link>
  );
}
