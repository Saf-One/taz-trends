"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { addProductImage } from "@/lib/catalog/actions";

// Allowed MIME types for product images
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function ImageUploader({
  productId,
  makePrimary,
}: {
  productId: string;
  makePrimary: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Client-side file validation. Server-side validation is not possible
   * directly in the Supabase storage upload flow, but RLS policies on
   * the storage bucket should also restrict MIME types.
   */
  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) {
      return `Invalid file type: ${file.type || "unknown"}. Only JPEG, PNG, WebP, and AVIF are allowed.`;
    }
    if (file.size > MAX_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 5 MB.`;
    }
    // Reject SVGs (could contain embedded scripts)
    if (file.name.toLowerCase().endsWith(".svg")) {
      return "SVG files are not allowed for security reasons.";
    }
    return null;
  }

  async function uploadFile(
    file: File,
    isPrimary: boolean,
  ): Promise<string | null> {
    const validationError = validateFile(file);
    if (validationError) return validationError;

    const supabase = createSupabaseBrowserClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${productId}/${Date.now()}_${safe}`;

    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) return upErr.message;

    await addProductImage(productId, path, isPrimary);
    router.refresh();
    return null;
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setBusy(true);
    setError(null);

    let firstErr: string | null = null;
    for (let i = 0; i < list.length; i++) {
      const msg = await uploadFile(list[i], makePrimary && i === 0);
      if (msg && !firstErr) firstErr = msg;
    }

    setBusy(false);
    if (firstErr) setError(firstErr);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) await uploadFiles(e.target.files);
    // Reset so re-selecting the same files re-fires onChange
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-wine bg-wine/5"
            : "border-ink/20 bg-transparent hover:border-wine/40 hover:bg-wine/5"
        }`}
      >
        {busy ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse text-wine"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <span className="text-xs text-ink/50">Uploading…</span>
          </div>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 text-ink/30"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="text-sm text-ink/50">
              Click, drop, or paste images here
            </span>
            <span className="mt-1 text-xs text-ink/30">
              JPEG, PNG, WebP, AVIF up to 5MB each - select multiple at once
            </span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={onFile}
          disabled={busy}
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
