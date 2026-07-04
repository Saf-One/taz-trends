"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { addProductImage } from "@/lib/catalog/actions";

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

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${productId}/${Date.now()}_${safe}`;

    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });

    if (upErr) {
      setBusy(false);
      setError(upErr.message);
      return;
    }

    await addProductImage(productId, path, makePrimary);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={onFile} disabled={busy} />
      {busy && <p className="text-xs text-ink/50">Uploading…</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
