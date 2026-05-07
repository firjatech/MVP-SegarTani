import React from 'react';

export default function AdminOrdersLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans animate-pulse">
      <div className="container mx-auto px-6 max-w-7xl">
        <header className="mb-12">
          <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 rounded w-64"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
            <div className="w-full md:w-80 h-14 bg-gray-200 rounded-2xl"></div>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 h-16">
                  <th className="px-10"></th><th className="px-10"></th><th className="px-10"></th><th className="px-10"></th><th className="px-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="h-24">
                    <td className="px-10 py-8">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex -space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-200 border-4 border-white"></div>
                        <div className="w-12 h-12 rounded-2xl bg-gray-200 border-4 border-white"></div>
                        <div className="w-12 h-12 rounded-2xl bg-gray-200 border-4 border-white"></div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="h-10 bg-gray-200 rounded-2xl w-28"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
