export default function ShopLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8">
        <div className="h-9 w-52 animate-pulse rounded bg-ink/10" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-ink/5" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[3/4] w-full animate-pulse bg-blush" />
            <div className="p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-ink/10" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-ink/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
