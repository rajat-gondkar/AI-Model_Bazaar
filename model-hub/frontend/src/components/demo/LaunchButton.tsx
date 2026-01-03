'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  ExternalLink, 
  Loader2, 
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { demoApi } from '@/lib/api';
import { parseApiError } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LaunchButtonProps {
  projectId: string;
  initialStatus?: string;
  initialDemoUrl?: string | null;
  isOwner?: boolean;
}

type EnvStatus = 'not_prepared' | 'preparing' | 'ready';

export default function LaunchButton({
  projectId,
  initialStatus = 'ready',
  initialDemoUrl = null,
  isOwner = false,
}: LaunchButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [demoUrl, setDemoUrl] = useState<string | null>(initialDemoUrl);
  const [envStatus, setEnvStatus] = useState<EnvStatus>('not_prepared');
  const [envMessage, setEnvMessage] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Check environment status on mount and periodically
  useEffect(() => {
    const checkEnvStatus = async () => {
      try {
        const envData = await demoApi.envStatus(projectId);
        setEnvStatus(envData.status as EnvStatus);
        setEnvMessage(envData.message);
        
        // If ready and we were installing, clear the flag
        if (envData.status === 'ready' && isInstalling) {
          setIsInstalling(false);
          toast.success('Dependencies installed successfully!');
        }
      } catch (error) {
        console.error('Error checking env status:', error);
      }
    };

    checkEnvStatus();
    
    // Poll while preparing
    let interval: NodeJS.Timeout;
    if (envStatus === 'preparing' || isInstalling) {
      interval = setInterval(checkEnvStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectId, envStatus, isInstalling]);

  // Auto-open demo when it becomes available
  useEffect(() => {
    if (status === 'running' && demoUrl && !hasAutoOpened) {
      setHasAutoOpened(true);
      setTimeout(() => {
        window.open(demoUrl, '_blank');
        toast.success('Demo opened in a new tab!');
      }, 1000);
    }
  }, [status, demoUrl, hasAutoOpened]);

  // Poll for demo status when running
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'launching' || isRunning) {
      interval = setInterval(async () => {
        try {
          const statusResponse = await demoApi.status(projectId);
          setStatus(statusResponse.status);
          
          if (statusResponse.demo_url) {
            setDemoUrl(statusResponse.demo_url);
          }

          if (statusResponse.status === 'running' || statusResponse.status === 'error') {
            setIsRunning(false);
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
  }, [status, projectId, isRunning]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const response = await demoApi.install(projectId);
      setEnvStatus('preparing');
      setEnvMessage(response.message);
      toast.success('Installing dependencies...');
    } catch (error: any) {
      const message = parseApiError(error);
      toast.error(message);
      setIsInstalling(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const response = await demoApi.run(projectId);
      setStatus(response.status);
      
      if (response.demo_url) {
        setDemoUrl(response.demo_url);
      }

      if (response.status === 'running') {
        toast.success('Demo is running!');
        setIsRunning(false);
      } else {
        toast.success('Demo is starting up...');
      }
    } catch (error: any) {
      const message = parseApiError(error);
      toast.error(message);
      setIsRunning(false);
    }
  };

  const handleLaunchFull = async () => {
    setIsRunning(true);
    try {
      const response = await demoApi.launch(projectId);
      setStatus(response.status);
      
      if (response.demo_url) {
        setDemoUrl(response.demo_url);
      }

      if (response.status === 'running') {
        toast.success('Demo is running!');
        setIsRunning(false);
      } else {
        toast.success('Demo is starting up...');
        setStatus('launching');
      }
    } catch (error: any) {
      const message = parseApiError(error);
      toast.error(message);
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await demoApi.stop(projectId);
      setStatus('ready');
      setDemoUrl(null);
      setHasAutoOpened(false);
      toast.success('Demo stopped');
    } catch (error: any) {
      const message = parseApiError(error);
      toast.error(message);
    } finally {
      setIsStopping(false);
    }
  };

  const openDemo = () => {
    if (demoUrl) {
      window.open(demoUrl, '_blank');
    }
  };

  const refreshStatus = async () => {
    try {
      const [statusResponse, envData] = await Promise.all([
        demoApi.status(projectId),
        demoApi.envStatus(projectId)
      ]);
      
      setStatus(statusResponse.status);
      setDemoUrl(statusResponse.demo_url || null);
      setEnvStatus(envData.status as EnvStatus);
      setEnvMessage(envData.message);
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  // Pending state
  if (status === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <Loader2 className="h-6 w-6 text-yellow-600 animate-spin mx-auto mb-2" />
        <p className="text-yellow-800 font-medium">Project is being processed...</p>
        <p className="text-yellow-600 text-sm mt-1">Please wait for the upload to complete</p>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
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

  // Running state
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
            disabled={isStopping}
            className="w-full py-3 px-6 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isStopping ? (
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

  // Launching state
  if (status === 'launching' || isRunning) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
          </div>
          <p className="text-blue-800 font-medium">Starting Demo...</p>
          <p className="text-blue-600 text-sm mt-2">
            Launching Streamlit application
          </p>
        </div>
      </div>
    );
  }

  // Default: ready state - show two separate buttons
  return (
    <div className="space-y-4">
      {/* Environment Status */}
      <div className={`rounded-lg p-4 ${
        envStatus === 'ready' 
          ? 'bg-green-50 border border-green-200' 
          : envStatus === 'preparing'
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {envStatus === 'ready' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : envStatus === 'preparing' ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
            ) : (
              <Download className="h-5 w-5 text-gray-500 mr-2" />
            )}
            <div>
              <p className={`font-medium text-sm ${
                envStatus === 'ready' 
                  ? 'text-green-800' 
                  : envStatus === 'preparing'
                  ? 'text-blue-800'
                  : 'text-gray-700'
              }`}>
                {envStatus === 'ready' 
                  ? 'Dependencies Installed' 
                  : envStatus === 'preparing'
                  ? 'Installing...'
                  : 'Not Installed'}
              </p>
              {envStatus === 'preparing' && (
                <p className="text-xs text-blue-600">{envMessage}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Install Dependencies Button */}
      <button
        onClick={handleInstall}
        disabled={isInstalling || envStatus === 'preparing' || envStatus === 'ready'}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
          envStatus === 'ready'
            ? 'bg-gray-100 text-gray-500 border border-gray-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isInstalling || envStatus === 'preparing' ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Installing Dependencies...
          </>
        ) : envStatus === 'ready' ? (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            Dependencies Installed
          </>
        ) : (
          <>
            <Download className="h-5 w-5 mr-2" />
            Install Dependencies
          </>
        )}
      </button>

      {/* Run Demo Button */}
      <button
        onClick={handleRun}
        disabled={envStatus !== 'ready' || isRunning}
        className={`w-full py-4 px-6 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
          envStatus === 'ready'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {isRunning ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            Run Demo
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* One-Click Launch (installs if needed + runs) */}
      <button
        onClick={handleLaunchFull}
        disabled={isRunning || isInstalling}
        className="w-full py-3 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning || isInstalling ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {isInstalling ? 'Installing...' : 'Starting...'}
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            Quick Launch
          </>
        )}
      </button>
      <p className="text-center text-xs text-gray-500">
        Automatically installs dependencies if needed
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
