import Link from 'next/link';
import { ArrowRight, Upload, Search, Play, Cpu, Zap, Shield, Code, Users, Globe, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Platform is live • {new Date().getFullYear()}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Share Your AI Models.
              <br />
              <span className="bg-gradient-to-r from-primary-200 to-purple-200 bg-clip-text text-transparent">
                Launch Demos Instantly.
              </span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              AI Model Bazaar is where creators showcase their Streamlit-powered AI demos,
              and users can test them in real-time with just one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/gallery"
                className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg shadow-primary-900/20"
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Models
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-400 transition-all hover:scale-105 border border-primary-400 shadow-lg shadow-primary-900/20"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Your Model
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold">100+</div>
                <div className="text-primary-200 text-sm">AI Models</div>
              </div>
              <div>
                <div className="text-4xl font-bold">500+</div>
                <div className="text-primary-200 text-sm">Demos Launched</div>
              </div>
              <div>
                <div className="text-4xl font-bold">50+</div>
                <div className="text-primary-200 text-sm">Creators</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why AI Model Bazaar?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to share, discover, and test AI models in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <Zap className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">One-Click Demos</h3>
              <p className="text-gray-600 leading-relaxed">
                Launch any model demo instantly. No installation, no configuration, no hassle.
                Just click and interact.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-purple-100 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <Cpu className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Cloud Compute</h3>
              <p className="text-gray-600 leading-relaxed">
                Run models on our servers. No need for expensive hardware or complex setups
                on your local machine.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-green-100 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Isolated</h3>
              <p className="text-gray-600 leading-relaxed">
                Each demo runs in its own isolated virtual environment for maximum security
                and reliability.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-orange-100 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <Code className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Simple Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Just package your Streamlit app with a requirements.txt. We handle
                the rest automatically.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-pink-100 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse models from creators worldwide. Search by tags, categories,
                or explore trending demos.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-cyan-100 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <Globe className="h-7 w-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Sharing</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your demo link with anyone. No sign-up required for testers
                to try your models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Format Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Simple Bundle Format</h2>
              <p className="text-gray-600">
                Your project just needs these essential files in a ZIP archive.
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-2xl p-8 text-white font-mono text-sm overflow-x-auto">
              <pre className="text-gray-300">
{`your-project.zip
├── app.py              # Main Streamlit app (required)
├── requirements.txt    # Python dependencies (required)
├── model.pkl           # Your trained model file
├── utils/              # Optional helper modules
│   └── helpers.py
└── assets/             # Optional static files
    └── sample.png`}
              </pre>
            </div>
            
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Streamlit Entry</p>
                  <p className="text-sm text-gray-600">app.py, main.py, or streamlit_app.py</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Dependencies</p>
                  <p className="text-sm text-gray-600">requirements.txt for pip install</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Model Files</p>
                  <p className="text-sm text-gray-600">.pkl, .pt, .h5, .onnx supported</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to share your AI models?</h2>
              <p className="text-primary-100 mb-8 max-w-xl mx-auto text-lg">
                Join AI Model Bazaar today and let the world experience your creations.
                It's completely free to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:scale-105"
                >
                  Create Free Account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
                <Link
                  href="/gallery"
                  className="inline-flex items-center px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Explore Models First
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
