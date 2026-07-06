"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={cn(
        "transition-opacity duration-200",
        mounted ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
