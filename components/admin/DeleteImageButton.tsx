"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProductImage } from "@/lib/catalog/actions";

export function DeleteImageButton({
  imageId,
  productId,
  storagePath,
}: {
  imageId: string;
  productId: string;
  storagePath: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteProductImage(imageId, productId, storagePath);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-red-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
      aria-label="Delete image"
      title="Delete image"
    >
      {pending ? (
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      )}
    </button>
  );
}
