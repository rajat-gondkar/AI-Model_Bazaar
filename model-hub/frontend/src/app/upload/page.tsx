'use client';

import UploadForm from '@/components/forms/UploadForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Upload, FileArchive, FileCode, FileText, Box } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/upload');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Upload className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Model</h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Share your AI project with the community. Upload a ZIP file containing your
              Streamlit app, model files, and requirements.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border shadow-sm p-8">
                <UploadForm />
              </div>
            </div>

            {/* Instructions Sidebar */}
            <div className="space-y-6">
              {/* Bundle Requirements */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">ZIP Bundle Requirements</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <FileCode className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">app.py</p>
                      <p className="text-sm text-gray-600">Main Streamlit entry point</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">requirements.txt</p>
                      <p className="text-sm text-gray-600">Python dependencies</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Box className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Model files</p>
                      <p className="text-sm text-gray-600">.pkl, .pt, .h5, .onnx, etc.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Example Structure */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Example Structure</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                  <div className="flex items-center">
                    <FileArchive className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-gray-700">project.zip</span>
                  </div>
                  <div className="ml-6 mt-2 space-y-1 text-gray-600">
                    <div>├── app.py</div>
                    <div>├── requirements.txt</div>
                    <div>├── model.pkl</div>
                    <div>├── utils/</div>
                    <div>│   └── helpers.py</div>
                    <div>└── assets/</div>
                    <div>    └── image.png</div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Include all necessary model files in the ZIP</li>
                  <li>• Make sure requirements.txt is complete</li>
                  <li>• Test your Streamlit app locally first</li>
                  <li>• Keep file paths relative in your code</li>
                  <li>• Maximum file size: 500MB</li>
                </ul>
              </div>

              {/* Need Help */}
              <div className="bg-gray-50 rounded-xl border p-6 text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Need help structuring your project?
                </p>
                <Link
                  href="/docs/bundle-format"
                  className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                >
                  View Documentation →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
