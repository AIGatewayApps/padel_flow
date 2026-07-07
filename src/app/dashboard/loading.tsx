export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-2xl p-4 bg-white dark:bg-gray-900">
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
