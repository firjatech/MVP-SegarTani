export default function WishlistLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header Skeleton */}
        <header className="mb-12">
          <div className="h-6 w-40 bg-gray-200 rounded-full animate-pulse mb-6" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-44 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-3 w-28 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Wishlist Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-[2.5rem] shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="p-8 space-y-4">
                <div className="h-6 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-7 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex gap-3 pt-4">
                  <div className="flex-1 h-14 bg-gray-100 rounded-2xl animate-pulse" />
                  <div className="h-14 w-14 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
