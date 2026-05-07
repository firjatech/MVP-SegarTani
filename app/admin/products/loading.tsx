import React from 'react';

export default function AdminProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 pb-32 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-2xl w-40"></div>
        </div>

        {/* Search & Filters Skeleton */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-14 bg-gray-100 rounded-xl w-full"></div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm h-[340px] flex flex-col">
              <div className="h-48 bg-gray-100 w-full"></div>
              <div className="p-5 flex-1 flex flex-col space-y-3">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
