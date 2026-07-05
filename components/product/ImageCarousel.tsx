"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CarouselImage = { src: string; alt: string };

/**
 * Infinite auto-advancing image carousel.
 * - Slides every `intervalMs` (default 3s); pauses while the user touches/hovers.
 * - Swipe left/right wraps indefinitely (clone-slide technique: [last, ...imgs, first]).
 * - Semi-visible arrow buttons; safe inside a <Link> (clicks are stopped).
 * - Optional clickable thumbnail strip below the main image.
 */
export function ImageCarousel({
  images,
  aspect = "aspect-[3/4]",
  showThumbnails = false,
  intervalMs = 3000,
}: {
  images: CarouselImage[];
  aspect?: string;
  showThumbnails?: boolean;
  intervalMs?: number;
}) {
  const n = images.length;
  // pos indexes the extended track [last, ...images, first]; 1 = first real slide.
  const [pos, setPos] = useState(1);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);

  const next = useCallback(() => {
    setAnim(true);
    setPos((p) => Math.min(p + 1, n + 1));
  }, [n]);

  const prev = useCallback(() => {
    setAnim(true);
    setPos((p) => Math.max(p - 1, 0));
  }, []);

  useEffect(() => {
    if (n < 2 || paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const t = setInterval(next, intervalMs);
    return () => clearInterval(t);
  }, [n, paused, next, intervalMs]);

  // After sliding onto a clone, jump (without animation) to the real slide.
  function onTransitionEnd() {
    if (pos === 0) {
      setAnim(false);
      setPos(n);
    } else if (pos === n + 1) {
      setAnim(false);
      setPos(1);
    }
  }

  // Re-enable the transition one frame after a silent jump.
  useEffect(() => {
    if (!anim) {
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnim(true)),
      );
      return () => cancelAnimationFrame(id);
    }
  }, [anim]);

  if (n === 0) return null;

  if (n === 1) {
    return (
      <div className={`relative ${aspect} w-full overflow-hidden bg-blush`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0].src}
          alt={images[0].alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const extended = [images[n - 1], ...images, images[0]];
  const active = (((pos - 1) % n) + n) % n;

  function goTo(i: number) {
    setAnim(true);
    setPos(i + 1);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
    swiped.current = false;
    setPaused(true);
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current !== null) {
      const delta = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(delta) > 10) swiped.current = true;
      if (delta < -40) next();
      else if (delta > 40) prev();
    }
    touchX.current = null;
    setPaused(false);
  }

  // If the carousel sits inside a <Link>, a swipe must not navigate.
  function onClickCapture(e: React.MouseEvent) {
    if (swiped.current) {
      e.preventDefault();
      e.stopPropagation();
      swiped.current = false;
    }
  }

  const arrowCls =
    "absolute top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/50 text-ink/70 backdrop-blur-sm transition-colors hover:bg-white/80 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold";

  return (
    <div>
      <div
        className={`relative ${aspect} w-full overflow-hidden bg-blush`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClickCapture={onClickCapture}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(-${pos * 100}%)`,
            transition: anim ? "transform 450ms ease" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${img.src}-${i}`}
              src={img.src}
              alt={img.alt}
              draggable={false}
              loading={i === 1 ? "eager" : "lazy"} // pos 1 = first visible slide
              decoding="async"
              className="h-full w-full shrink-0 object-cover"
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous image"
          className={`${arrowCls} left-2`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            prev();
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next image"
          className={`${arrowCls} right-2`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            next();
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {showThumbnails && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={`${img.src}-thumb`}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                i === active
                  ? "border-wine"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
