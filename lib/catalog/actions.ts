"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/types/db";

function rupeesToPaise(v: FormDataEntryValue | null): number {
  const n = Number(v ?? 0);
  return Math.round((isFinite(n) ? n : 0) * 100);
}

/** Create a product. Simple-product default: price + stock on the row. */
export async function createProduct(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  const { data, error } = await supabase
    .from("products")
    .insert({
      title,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      price: rupeesToPaise(formData.get("price")),
      stock: Number(formData.get("stock") ?? 0),
      status: (String(formData.get("status") ?? "draft") as ProductStatus),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}/edit`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      price: rupeesToPaise(formData.get("price")),
      stock: Number(formData.get("stock") ?? 0),
      status: String(formData.get("status") ?? "draft") as ProductStatus,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
}

/** Add an optional variant (opt-in; simple products need none). */
export async function addVariant(productId: string, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const override = formData.get("price_override");
  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    variant_name: String(formData.get("variant_name") ?? "Size").trim(),
    variant_value: String(formData.get("variant_value") ?? "").trim(),
    stock: Number(formData.get("stock") ?? 0),
    price_override:
      override != null && String(override).length
        ? rupeesToPaise(override)
        : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteVariant(productId: string, variantId: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/products/${productId}/edit`);
}

/** Record an uploaded image (file already in storage via the browser). */
export async function addProductImage(
  productId: string,
  storagePath: string,
  isPrimary: boolean,
) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    is_primary: isPrimary,
    position: 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/products/${productId}/edit`);
}
