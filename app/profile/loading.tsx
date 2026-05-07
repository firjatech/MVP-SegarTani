export default function ProfileLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header Skeleton */}
        <header className="mb-8">
          <div className="h-6 w-36 bg-gray-200 rounded-full animate-pulse mb-4" />
          <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-3 w-64 bg-gray-100 rounded-full animate-pulse mt-2" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Avatar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 text-center border border-gray-100">
              <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-6 animate-pulse" />
              <div className="h-6 w-32 bg-gray-100 rounded-lg mx-auto mb-2 animate-pulse" />
              <div className="h-4 w-40 bg-gray-100 rounded-lg mx-auto mb-8 animate-pulse" />
              <div className="h-14 w-full bg-gray-50 rounded-2xl animate-pulse" />
            </div>
          </div>

          {/* Right: Form Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-14 w-full bg-gray-50 rounded-2xl animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-24 w-full bg-gray-50 rounded-2xl animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-14 w-full bg-gray-50 rounded-2xl animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-16 w-full bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
