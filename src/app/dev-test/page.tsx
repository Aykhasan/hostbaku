'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DevTestPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    // Get current dev role from cookie
    const cookies = document.cookie.split('; ');
    const devRoleCookie = cookies.find(row => row.startsWith('dev-role='));
    if (devRoleCookie) {
      setCurrentRole(devRoleCookie.split('=')[1]);
    }
  }, []);

  const setDevRole = (role: 'admin' | 'cleaner' | 'owner') => {
    // Set cookie
    document.cookie = `dev-role=${role}; path=/; max-age=${60 * 60 * 24}`; // 24 hours
    setCurrentRole(role);
    
    // Reload to apply the role
    window.location.href = `/${role === 'admin' ? 'admin' : role === 'cleaner' ? 'cleaner' : 'owner'}?dev=${role}`;
  };

  const clearDevRole = () => {
    document.cookie = 'dev-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setCurrentRole(null);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Development Mode - Test Access</h1>
          <p className="text-stone-600 mb-4">
            This page allows you to test different user roles without logging in. 
            <strong className="text-red-600"> Only works in development mode!</strong>
          </p>
          
          {currentRole && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Current Dev Role:</strong> {currentRole.toUpperCase()}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Admin Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-stone-200">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Admin</h2>
            <p className="text-sm text-stone-600 mb-4">
              Access admin dashboard, manage properties, cleaners, tasks, and more.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setDevRole('admin')}
                className="w-full bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 transition"
              >
                Login as Admin
              </button>
              <Link
                href="/admin?dev=admin"
                className="block text-center text-sm text-brand-600 hover:underline"
              >
                Go to Admin Dashboard →
              </Link>
            </div>
          </div>

          {/* Cleaner Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-stone-200">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Cleaner</h2>
            <p className="text-sm text-stone-600 mb-4">
              View assigned tasks, update task status, and manage cleaning assignments.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setDevRole('cleaner')}
                className="w-full bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 transition"
              >
                Login as Cleaner
              </button>
              <Link
                href="/cleaner?dev=cleaner"
                className="block text-center text-sm text-brand-600 hover:underline"
              >
                Go to Cleaner Dashboard →
              </Link>
            </div>
          </div>

          {/* Owner Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-stone-200">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Owner</h2>
            <p className="text-sm text-stone-600 mb-4">
              View properties, reservations, statements, and maintenance requests.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setDevRole('owner')}
                className="w-full bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 transition"
              >
                Login as Owner
              </button>
              <Link
                href="/owner?dev=owner"
                className="block text-center text-sm text-brand-600 hover:underline"
              >
                Go to Owner Dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/?dev=admin"
              className="text-sm text-brand-600 hover:underline p-2 bg-stone-50 rounded"
            >
              Main Page (as Admin)
            </Link>
            <Link
              href="/admin?dev=admin"
              className="text-sm text-brand-600 hover:underline p-2 bg-stone-50 rounded"
            >
              Admin Dashboard
            </Link>
            <Link
              href="/cleaner?dev=cleaner"
              className="text-sm text-brand-600 hover:underline p-2 bg-stone-50 rounded"
            >
              Cleaner Dashboard
            </Link>
            <Link
              href="/owner?dev=owner"
              className="text-sm text-brand-600 hover:underline p-2 bg-stone-50 rounded"
            >
              Owner Dashboard
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">How to Use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
            <li>Click "Login as [Role]" to set your dev role</li>
            <li>Or add <code className="bg-yellow-100 px-1 rounded">?dev=admin</code> (or cleaner/owner) to any URL</li>
            <li>The role will persist via cookie for 24 hours</li>
            <li>Click "Clear Dev Role" below to return to normal authentication</li>
          </ol>
        </div>

        {currentRole && (
          <div className="mt-6 text-center">
            <button
              onClick={clearDevRole}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            >
              Clear Dev Role (Return to Normal Auth)
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-stone-600 hover:text-stone-900"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

