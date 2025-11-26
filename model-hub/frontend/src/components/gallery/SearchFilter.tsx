'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ProjectFilters } from '@/types';

interface SearchFilterProps {
  onFilterChange: (filters: ProjectFilters) => void;
  initialFilters?: ProjectFilters;
}

const POPULAR_TAGS = [
  'computer-vision',
  'nlp',
  'classification',
  'object-detection',
  'text-generation',
  'image-generation',
  'sentiment-analysis',
  'regression',
];

export default function SearchFilter({ onFilterChange, initialFilters }: SearchFilterProps) {
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilters?.tags?.split(',').filter(Boolean) || []
  );
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onFilterChange({
      search,
      tags: selectedTags.join(','),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onFilterChange({
      search,
      tags: newTags.join(','),
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTags([]);
    onFilterChange({});
  };

  const hasFilters = search || selectedTags.length > 0;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      {/* Search bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search models by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-3 border rounded-lg transition-colors ${
            showFilters || selectedTags.length > 0
              ? 'bg-primary-50 border-primary-300 text-primary-700'
              : 'hover:bg-gray-50'
          }`}
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
          {selectedTags.length > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
              {selectedTags.length}
            </span>
          )}
        </button>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Filter tags */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Filter by tags</span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active filters display */}
      {hasFilters && !showFilters && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          {search && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-sm">
              Search: {search}
              <button
                onClick={() => {
                  setSearch('');
                  onFilterChange({ search: '', tags: selectedTags.join(',') });
                }}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-primary-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
