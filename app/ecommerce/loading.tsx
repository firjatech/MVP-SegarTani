export default function EcommerceLoading() {
  return (
    <div className="bg-white min-h-screen pb-20 font-sans pt-10">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Search Bar Skeleton */}
        <div className="max-w-6xl mx-auto py-12 px-0 md:px-6">
          <div className="h-16 md:h-[68px] bg-gray-100 rounded-3xl animate-pulse" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden"
            >
              {/* Image Skeleton */}
              <div className="aspect-square w-full bg-gray-100 animate-pulse" />
              {/* Content Skeleton */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-10 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-12 w-12 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
