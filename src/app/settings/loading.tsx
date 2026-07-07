export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
      <div className="rounded-xl border bg-card divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-4">
            <div className="space-y-1">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
