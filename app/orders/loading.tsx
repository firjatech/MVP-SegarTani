export default function OrdersLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header Skeleton */}
        <header className="mb-12">
          <div className="h-6 w-40 bg-gray-200 rounded-full animate-pulse mb-6" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Order Cards Skeleton */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-[2.5rem] shadow-lg border border-gray-100 overflow-hidden p-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-5 w-36 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-3xl p-6 space-y-4 mb-8">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-8 w-36 bg-gray-100 rounded-xl animate-pulse" />
                </div>
                <div className="h-14 w-36 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
