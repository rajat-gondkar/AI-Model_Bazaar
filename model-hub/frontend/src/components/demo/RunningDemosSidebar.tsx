'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  RefreshCw,
  StopCircle,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { demoApi } from '@/lib/api';
import { parseApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface RunningDemo {
  project_id: string;
  project_name: string;
  port: number;
  demo_url: string;
  started_at: string;
}

interface RunningDemosSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RunningDemosSidebar({ isOpen, onClose }: RunningDemosSidebarProps) {
  const [runningDemos, setRunningDemos] = useState<RunningDemo[]>([]);
  const [usedPorts, setUsedPorts] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stoppingPort, setStoppingPort] = useState<number | null>(null);
  const [isStoppingAll, setIsStoppingAll] = useState(false);
  const [showConfirmStopAll, setShowConfirmStopAll] = useState(false);

  const fetchRunningDemos = async () => {
    setIsLoading(true);
    try {
      const data = await demoApi.getRunning();
      setRunningDemos(data.running_demos);
      setUsedPorts(data.used_ports);
    } catch (error) {
      console.error('Error fetching running demos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRunningDemos();
    }
  }, [isOpen]);

  const handleStopPort = async (port: number) => {
    setStoppingPort(port);
    try {
      await demoApi.stopPort(port);
      toast.success(`Stopped demo on port ${port}`);
      fetchRunningDemos();
    } catch (error: any) {
      toast.error(parseApiError(error));
    } finally {
      setStoppingPort(null);
    }
  };

  const handleStopAll = async () => {
    setIsStoppingAll(true);
    try {
      const result = await demoApi.stopAll();
      toast.success(result.message);
      setShowConfirmStopAll(false);
      fetchRunningDemos();
    } catch (error: any) {
      toast.error(parseApiError(error));
    } finally {
      setIsStoppingAll(false);
    }
  };

  const formatStartedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <Radio className="h-5 w-5 text-green-600 mr-2 animate-pulse" />
            <h2 className="font-semibold text-gray-900">Running Demos</h2>
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {runningDemos.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchRunningDemos}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Kill All Button */}
        {runningDemos.length > 0 && (
          <div className="p-3 border-b bg-red-50">
            <button
              onClick={() => setShowConfirmStopAll(true)}
              disabled={isStoppingAll}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isStoppingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Stopping All...
                </>
              ) : (
                <>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop All Demos
                </>
              )}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
          ) : runningDemos.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No demos running</p>
              <p className="text-gray-400 text-sm mt-1">
                Launch a demo from the gallery to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {runningDemos.map((demo) => (
                <div
                  key={demo.port}
                  className="bg-gray-50 rounded-lg p-4 border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/models/${demo.project_id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {demo.project_name}
                      </Link>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-xs">
                          :{demo.port}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{formatStartedAt(demo.started_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <a
                        href={demo.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Open demo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleStopPort(demo.port)}
                        disabled={stoppingPort === demo.port}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Stop demo"
                      >
                        {stoppingPort === demo.port ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Used Ports (if there are orphaned ports) */}
          {usedPorts.length > runningDemos.length && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Other Used Ports
              </h3>
              <div className="flex flex-wrap gap-2">
                {usedPorts
                  .filter(port => !runningDemos.some(d => d.port === port))
                  .map(port => (
                    <button
                      key={port}
                      onClick={() => handleStopPort(port)}
                      disabled={stoppingPort === port}
                      className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-red-100 hover:text-red-700 transition-colors"
                    >
                      <span className="font-mono">:{port}</span>
                      {stoppingPort === port ? (
                        <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      ) : (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Stop All Dialog */}
      {showConfirmStopAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold">Stop All Demos?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will stop all {runningDemos.length} running demos and free up their ports. 
              Any users currently viewing demos will be disconnected.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmStopAll(false)}
                disabled={isStoppingAll}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStopAll}
                disabled={isStoppingAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {isStoppingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
