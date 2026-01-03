'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail, Heart, Cpu } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AI Model Bazaar</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Discover, share, and launch AI model demos instantly. 
              Built for the AI community by developers who care.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery" className="hover:text-primary-400 transition-colors">
                  Model Gallery
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-primary-400 transition-colors">
                  Upload Model
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-primary-400 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-primary-400 transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary-400 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary-400 transition-colors"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary-400 transition-colors"
                >
                  Bundle Format Guide
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary-400 transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a 
                href="#" 
                className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="mailto:contact@aimodelbazaar.com" 
                className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Questions? Get in touch!
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {currentYear} AI Model Bazaar. All rights reserved.
            </p>
            <div className="flex items-center text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>for the AI community</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
