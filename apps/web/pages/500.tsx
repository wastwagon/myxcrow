import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';

export default function ServerError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">500</h1>
        <p className="text-xl text-gray-600 mb-6">Server Error</p>
        <p className="text-gray-500 mb-8">
          Something went wrong on our end. Please try again later.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Home className="w-5 h-5" />
          Go to Home
        </Link>
      </div>
    </div>
  );
}




