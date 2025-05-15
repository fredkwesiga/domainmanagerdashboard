import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center p-10 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-indigo-100 opacity-30"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-indigo-50 opacity-40"></div>
        
        {/* Broken crown in indigo */}
        <div className="mx-auto w-44 h-44 mb-8 relative">
          <svg viewBox="0 0 512 512" className="text-indigo-900">
            {/* Crown base - solid */}
            <path 
              d="M448 384H64c-17.7 0-32-14.3-32-32v-32c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32v32c0 17.7-14.3 32-32 32z" 
              fill="currentColor"
              opacity="0.9"
            />
            {/* Broken crown points */}
            <path 
              d="M96 160L128 96 160 160 192 96 224 160 256 96 288 160 320 96 352 160 384 96 416 160" 
              stroke="currentColor" 
              strokeWidth="16" 
              strokeLinecap="round" 
              fill="none"
              strokeDasharray="20,10"
              opacity="0.8"
            />
            {/* Gems with one missing */}
            <circle cx="128" cy="96" r="8" fill="#fff" opacity="0.8" />
            <circle cx="256" cy="96" r="8" fill="#fff" opacity="0.8" />
            <circle cx="384" cy="96" r="8" fill="#fff" opacity="0.8" />
            <circle cx="192" cy="96" r="8" fill="transparent" stroke="#fff" strokeWidth="2" opacity="0.8" />
          </svg>
          <div className="absolute -bottom-3 -right-3 bg-indigo-900 text-white text-xs font-bold px-3 py-1 rounded-full">
            404
          </div>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          <span className="text-indigo-900">Lost</span> in the Dashboard
        </h1>
        <p className="text-gray-500 mb-8 text-xs">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        
        <Link 
          to="/"
          className="inline-flex items-center px-8 py-3.5 bg-indigo-900 hover:bg-indigo-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 text-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Return to Dashboard
        </Link>
        
        <div className="mt-10 text-xs text-gray-400 flex justify-center space-x-4">
          <span>Status: 404</span>
          <span>•</span>
          <span>Missing Resource</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;