import React from 'react';

export default function EcommerceLoading() {
  return (
    <div className="bg-white min-h-screen pb-20 font-sans pt-10 animate-pulse">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Filter Bar Skeleton */}
        <div className="max-w-6xl mx-auto py-12 px-0 md:px-6">
          <div className="h-16 bg-gray-100 rounded-3xl w-full"></div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm h-[380px] flex flex-col">
              <div className="w-full h-48 bg-gray-100 relative">
                <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-200"></div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-2xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
