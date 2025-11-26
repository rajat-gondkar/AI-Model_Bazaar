import Link from 'next/link';
import { ArrowRight, Upload, Search, Play, Cpu, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Share Your AI Models.
              <br />
              <span className="text-primary-200">Launch Demos Instantly.</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Model Hub is a platform where AI creators upload their Streamlit apps and models,
              and users can browse and launch interactive demos with one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/gallery"
                className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Models
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-400 transition-colors border border-primary-400"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Your Model
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="h-16 bg-white" style={{ 
          clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 100%)',
          marginTop: '-1px'
        }} />
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Model Hub makes it easy to share and test AI models. Whether you're a creator or a tester,
            getting started takes just a few minutes.
          </p>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Creators */}
            <div className="bg-white rounded-2xl border p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 rounded-full p-3 mr-4">
                  <Upload className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-semibold">For Creators</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
                  <div>
                    <p className="font-medium">Package your project</p>
                    <p className="text-sm text-gray-600">Include your Streamlit app, model files, and requirements.txt</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</span>
                  <div>
                    <p className="font-medium">Upload as ZIP</p>
                    <p className="text-sm text-gray-600">Fill in project details and upload your bundle</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</span>
                  <div>
                    <p className="font-medium">Share with the world</p>
                    <p className="text-sm text-gray-600">Your model is now available in the gallery</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* For Testers */}
            <div className="bg-white rounded-2xl border p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold">For Testers</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
                  <div>
                    <p className="font-medium">Browse the gallery</p>
                    <p className="text-sm text-gray-600">Search and filter models by tags, type, or creator</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</span>
                  <div>
                    <p className="font-medium">Click "Launch Demo"</p>
                    <p className="text-sm text-gray-600">We spin up the Streamlit app on our servers</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</span>
                  <div>
                    <p className="font-medium">Interact with the model</p>
                    <p className="text-sm text-gray-600">Test the model in your browser, no setup required</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Model Hub?</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">One-Click Demos</h3>
              <p className="text-gray-600">
                Launch any model demo instantly. No installation, no configuration, no hassle.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cloud Compute</h3>
              <p className="text-gray-600">
                Run models on our GPU-enabled servers. No local resources needed.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Isolated</h3>
              <p className="text-gray-600">
                Each demo runs in its own isolated environment for security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to share your AI models?</h2>
            <p className="text-primary-100 mb-8 max-w-xl mx-auto">
              Join Model Hub today and let others experience your work.
              It's free to get started.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
