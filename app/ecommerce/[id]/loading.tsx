export default function ProductDetailLoading() {
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Back button skeleton */}
        <div className="h-10 w-48 bg-gray-200 rounded-full animate-pulse mb-2" />

        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-gray-100">
          <div className="flex flex-col lg:flex-row items-start">
            {/* Image Skeleton */}
            <div className="lg:w-1/2 p-8 md:p-12 bg-white border-b lg:border-b-0 lg:border-r border-gray-50">
              <div className="aspect-square w-full max-w-md bg-gray-100 rounded-[2rem] animate-pulse" />
            </div>

            {/* Info Skeleton */}
            <div className="lg:w-1/2 p-8 md:p-16 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-7 w-14 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 w-3/4 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-10 w-1/2 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-px bg-gray-100 w-full" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              <div className="flex gap-4 pt-6">
                <div className="flex-1 h-16 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="h-16 w-16 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
