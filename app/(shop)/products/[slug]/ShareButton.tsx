"use client";

import { useCallback } from "react";

export function ShareButton({ title, slug }: { title: string; slug: string }) {
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/products/${slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // clipboard not available
      }
    }
  }, [title, slug]);

  return (
    <button
      onClick={handleShare}
      className="flex shrink-0 items-center gap-1 rounded-full border border-ink/20 px-3 py-1.5 text-xs text-ink/50 transition-colors hover:border-wine/40 hover:text-wine"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      Share
    </button>
  );
}
