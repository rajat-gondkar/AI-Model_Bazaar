'use client';

import { useState } from 'react';
import { StopCircle, Loader2, AlertTriangle } from 'lucide-react';
import { demoApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function StopAllButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStopAll = async () => {
    setIsLoading(true);
    try {
      const result = await demoApi.stopAll();
      toast.success(result.message);
      setShowConfirm(false);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to stop demos';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Stop All Demos?</h3>
          </div>
          <p className="text-gray-600 mb-6">
            This will stop all running Streamlit demos and free up all demo ports (8501-8600). 
            Any users currently viewing demos will be disconnected.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStopAll}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
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
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
      title="Stop all running demos"
    >
      <StopCircle className="h-4 w-4 mr-1" />
      <span className="hidden sm:inline">Stop All Demos</span>
    </button>
  );
}
