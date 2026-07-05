export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-ink/10" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-ink/10" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-ink/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
