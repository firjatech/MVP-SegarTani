import React from 'react';

export default function CheckoutLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans animate-pulse">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>

        <div className="flex flex-col lg:flex-row gap-12 items-start mt-6">
          {/* Left Form Skeleton */}
          <div className="lg:w-2/3 w-full">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-14 bg-gray-100 rounded-2xl w-full"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-14 bg-gray-100 rounded-2xl w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-32 mb-3"></div>
                  <div className="h-24 bg-gray-100 rounded-2xl w-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16 mb-3"></div>
                    <div className="h-14 bg-gray-100 rounded-2xl w-full"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
                    <div className="h-14 bg-gray-100 rounded-2xl w-full"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-14 bg-gray-100 rounded-2xl w-full"></div>
                  </div>
                </div>
                <div className="pt-6">
                  <div className="h-16 bg-gray-200 rounded-2xl w-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Skeleton */}
          <div className="lg:w-1/3 w-full">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 mb-8">
              <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
              <div className="h-14 bg-gray-100 rounded-2xl w-full"></div>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-48 mb-8"></div>
              <div className="space-y-6 mb-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
