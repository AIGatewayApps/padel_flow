export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-2xl p-4 bg-white dark:bg-gray-900 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-2 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
