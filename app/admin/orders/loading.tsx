export default function AdminOrdersLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header Skeleton */}
        <header className="mb-12">
          <div className="h-6 w-40 bg-gray-200 rounded-full animate-pulse mb-6" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-300 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-56 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-3 w-32 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-14 w-full md:w-80 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </header>

        {/* Table Skeleton */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {['DETAIL', 'PELANGGAN', 'PRODUK', 'TOTAL', 'STATUS'].map((_, i) => (
                    <th key={i} className="px-10 py-8">
                      <div className="h-3 w-20 bg-gray-200 rounded-full animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-3 w-32 bg-gray-100 rounded-full animate-pulse" />
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex -space-x-4">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div key={j} className="w-12 h-12 rounded-2xl bg-gray-100 border-4 border-white animate-pulse" />
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="h-6 w-24 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                    <td className="px-10 py-8">
                      <div className="h-10 w-32 bg-gray-100 rounded-2xl animate-pulse" />
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
