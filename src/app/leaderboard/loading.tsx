export default function LeaderboardLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
      <div className="flex justify-center gap-4 mb-10">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border rounded-2xl px-4 py-3 bg-white dark:bg-gray-900">
            <div className="w-7 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="w-10 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
