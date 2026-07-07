export default function CourtsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
            <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
