'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Cpu, 
  Upload, 
  LayoutGrid, 
  LogIn, 
  LogOut, 
  User,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Cpu className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold gradient-text">Model Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/gallery"
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Gallery</span>
            </Link>

            {isAuthenticated && (
              <Link
                href="/upload"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.username}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Link
                href="/gallery"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutGrid className="h-5 w-5" />
                <span>Gallery</span>
              </Link>

              {isAuthenticated && (
                <Link
                  href="/upload"
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Upload className="h-5 w-5" />
                  <span>Upload</span>
                </Link>
              )}

              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>{user?.username}</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
