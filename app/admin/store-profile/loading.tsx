import React from 'react';

export default function StoreProfileLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-24 font-sans animate-pulse">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header Skeleton */}
        <header className="mb-8">
          <div className="h-4 bg-gray-200 rounded w-32 mb-5"></div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </header>

        {/* Banner Preview Skeleton */}
        <div className="relative w-full h-44 rounded-[2rem] bg-gray-200 mb-6">
          <div className="absolute -bottom-6 left-8 w-20 h-20 rounded-2xl border-4 border-white bg-gray-100"></div>
        </div>

        <div className="mt-10 mb-6 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 h-14">
          <div className="flex-1 bg-gray-100 rounded-xl"></div>
          <div className="flex-1 bg-gray-50 rounded-xl"></div>
          <div className="flex-1 bg-gray-50 rounded-xl"></div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-6">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-14 bg-gray-100 rounded-2xl w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
            <div className="h-32 bg-gray-100 rounded-2xl w-full"></div>
          </div>
        </div>

        {/* Save Button Skeleton */}
        <div className="mt-6">
          <div className="h-16 bg-gray-200 rounded-2xl w-full md:w-64"></div>
        </div>
      </div>
    </div>
  );
}
