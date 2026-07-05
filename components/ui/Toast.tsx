"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ToastType } from "@/lib/notifications/ToastProvider";

interface ToastItemData {
  id: number;
  message: string;
  type: ToastType;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

const STYLES: Record<ToastType, string> = {
  success: "border-green-500 bg-green-50 text-green-800",
  error: "border-red-500 bg-red-50 text-red-800",
  info: "border-wine bg-wine/5 text-wine",
};

function ToastItem({
  toast,
  dismiss,
}: {
  toast: ToastItemData;
  dismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in on mount
    const t = requestAnimationFrame(() => setVisible(true));
    // Start fade-out at 3.6s (600ms before auto-dismiss at 4s)
    const fadeTimer = setTimeout(() => setVisible(false), 3600);
    return () => {
      cancelAnimationFrame(t);
      clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-start gap-2 rounded-md border bg-white px-4 py-3 shadow-lg transition-all duration-300",
        STYLES[toast.type],
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
          toast.type === "success" && "bg-green-500",
          toast.type === "error" && "bg-red-500",
          toast.type === "info" && "bg-wine",
        )}
      >
        {ICONS[toast.type]}
      </span>
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => dismiss(toast.id), 300);
        }}
        className="ml-1 shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: ToastItemData[];
  dismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2 sm:right-6 sm:top-6 max-w-sm w-full"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}
