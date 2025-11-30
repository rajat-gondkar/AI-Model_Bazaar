'use client';

import { useState, useEffect } from 'react';
import { Play, Square, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { demoApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface LaunchButtonProps {
  projectId: string;
  initialStatus?: string;
  initialDemoUrl?: string | null;
  isOwner?: boolean;
}

export default function LaunchButton({
  projectId,
  initialStatus = 'ready',
  initialDemoUrl = null,
  isOwner = false,
}: LaunchButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [demoUrl, setDemoUrl] = useState<string | null>(initialDemoUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Auto-open demo when it becomes available
  useEffect(() => {
    if (status === 'running' && demoUrl && !hasAutoOpened) {
      setHasAutoOpened(true);
      // Small delay to ensure the server is fully ready
      setTimeout(() => {
        window.open(demoUrl, '_blank');
        toast.success('Demo opened in a new tab!');
      }, 1000);
    }
  }, [status, demoUrl, hasAutoOpened]);

  // Poll for status when launching
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'launching') {
      interval = setInterval(async () => {
        try {
          const statusResponse = await demoApi.status(projectId);
          setStatus(statusResponse.status);
          
          if (statusResponse.demo_url) {
            setDemoUrl(statusResponse.demo_url);
          }

          if (statusResponse.status === 'running' || statusResponse.status === 'error') {
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, projectId]);

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const response = await demoApi.launch(projectId);
      setStatus(response.status);
      
      if (response.demo_url) {
        setDemoUrl(response.demo_url);
      }

      if (response.status === 'running') {
        toast.success('Demo is running!');
      } else {
        toast.success('Demo is starting up...');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to launch demo';
      toast.error(message);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await demoApi.stop(projectId);
      setStatus('ready');
      setDemoUrl(null);
      setHasAutoOpened(false); // Reset so next launch will auto-open
      toast.success('Demo stopped');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to stop demo';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const openDemo = () => {
    if (demoUrl) {
      window.open(demoUrl, '_blank');
    }
  };

  const refreshStatus = async () => {
    try {
      const statusResponse = await demoApi.status(projectId);
      setStatus(statusResponse.status);
      if (statusResponse.demo_url) {
        setDemoUrl(statusResponse.demo_url);
      } else {
        setDemoUrl(null);
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  if (status === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <Loader2 className="h-6 w-6 text-yellow-600 animate-spin mx-auto mb-2" />
        <p className="text-yellow-800 font-medium">Project is being processed...</p>
        <p className="text-yellow-600 text-sm mt-1">Please wait for the upload to complete</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">Error with this project</p>
        <p className="text-red-600 text-sm mt-1">Please check the project files and try re-uploading</p>
        <button
          onClick={refreshStatus}
          className="mt-3 text-red-600 hover:text-red-800 text-sm underline"
        >
          Refresh status
        </button>
      </div>
    );
  }

  if (status === 'launching') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
          </div>
          <p className="text-blue-800 font-medium">Launching Demo...</p>
          <p className="text-blue-600 text-sm mt-2">
            Setting up environment and installing dependencies
          </p>
          <p className="text-blue-500 text-xs mt-2">
            This may take a minute for first-time launches
          </p>
        </div>
      </div>
    );
  }

  if (status === 'running' && demoUrl) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            <span className="ml-2 text-green-700 font-medium">Demo is running</span>
          </div>
          
          <button
            onClick={openDemo}
            className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Open Demo
          </button>

          <p className="text-center text-sm text-gray-500 mt-3">
            Opens in a new tab
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleStop}
            disabled={isLoading}
            className="w-full py-3 px-6 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Square className="h-5 w-5 mr-2" />
            )}
            Stop Demo
          </button>
        )}
      </div>
    );
  }

  // Default: ready state
  return (
    <div className="space-y-4">
      <button
        onClick={handleLaunch}
        disabled={isLoading}
        className="w-full py-4 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <Play className="h-5 w-5 mr-2" />
        )}
        Launch Demo
      </button>
      
      <p className="text-center text-sm text-gray-500">
        Click to start an interactive demo of this model
      </p>

      <button
        onClick={refreshStatus}
        className="w-full text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh status
      </button>
    </div>
  );
}
