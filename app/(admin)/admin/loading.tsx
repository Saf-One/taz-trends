export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-fade-in">
      {/* Title skeleton */}
      <div className="mb-6 h-8 w-40 skeleton" />

      {/* Stat cards skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="mb-1 h-8 w-16 skeleton" />
            <div className="h-3 w-20 skeleton" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card overflow-hidden">
        <div className="bg-blush p-3">
          <div className="h-3 w-24 skeleton" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-t border-ink/10 p-3"
          >
            <div className="h-4 flex-1 skeleton" />
            <div className="h-4 w-16 skeleton" />
            <div className="h-4 w-20 skeleton" />
            <div className="h-4 w-12 skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
